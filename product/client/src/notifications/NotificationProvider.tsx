import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Bell, ArrowRight, X, Sparkles } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { resolveNotificationRoute } from './notification-router';
import { setPendingDeepLink } from '../platform/pending-deep-link';
import { initFirebaseAnalytics, requestWebFcmToken, onForegroundWebMessage } from '../lib/firebase';
import type {
  AppNotification,
  NotificationMeta,
  DeviceTokenRegistration,
} from './notification.types';

/* Generate or retrieve a stable device ID */
function getOrCreateDeviceId(): string {
  const key = 'campusos_device_id';
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

/** Synthesize a soft, pleasant 2-tone chime using Web Audio API */
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  } catch (_) {
    // AudioContext blocked or unsupported
  }
}

/** Trigger haptic vibration pattern for notifications */
function triggerHapticNotification() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([40, 60, 40]);
    } catch (_) {}
  }
}

export interface ActiveNotificationToast {
  id: string | number;
  title: string;
  body: string;
  eventType?: string;
  entityId?: string;
  deepLinkRoute?: string;
  createdAt: number;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  meta: NotificationMeta | null;
  isLoading: boolean;
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  triggerTestNotification: (title?: string, message?: string) => Promise<void>;
  deviceToken: string | null;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/* 3s polling for ultra real-time feel + instant focus sync */
const UNREAD_POLL_INTERVAL_MS = 3_000;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [meta, setMeta] = useState<NotificationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<ActiveNotificationToast | null>(null);

  const pushListenersRegistered = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUnreadCountRef = useRef<number | null>(null);
  const lastRegisteredTokenRef = useRef<string | null>(null);

  // ── Auto-dismiss toast banner after 6 seconds ──────────────────────
  useEffect(() => {
    if (activeToast) {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setActiveToast(null);
      }, 6000);
    }
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [activeToast]);

  // ── Request Native & Web Notification Permissions ──────────────────
  useEffect(() => {
    async function requestPermissions() {
      if (Capacitor.isNativePlatform()) {
        try {
          await LocalNotifications.requestPermissions();
          await LocalNotifications.createChannel({
            id: 'campusos_alerts',
            name: 'CampusOS High Priority Alerts',
            description: 'Instant notification alerts for leave, approvals, tasks & circulars',
            importance: 5, // MAX importance for heads-up banner
            visibility: 1,
            vibration: true,
          });
        } catch (e) {
          console.warn('[Notifications] Native channel init failed:', e);
        }
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      }
    }

    requestPermissions();
  }, []);

  // ── Dispatch Native Mobile, In-App Toast & Web OS Notification Banner ─
  const triggerNativeDeviceNotification = useCallback(
    async (title: string, body: string, type?: string, entityId?: string, deepLink?: string) => {
      // 1. Play soft audio chime & haptic feedback
      playNotificationChime();
      triggerHapticNotification();

      // 2. Show in-app heads-up floating toast banner
      setActiveToast({
        id: Date.now(),
        title,
        body,
        eventType: type,
        entityId,
        deepLinkRoute: deepLink,
        createdAt: Date.now(),
      });

      // 3. Schedule OS level notification
      if (Capacitor.isNativePlatform()) {
        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                title,
                body,
                id: Math.floor(Math.random() * 100000),
                schedule: { at: new Date(Date.now() + 100) },
                channelId: 'campusos_alerts',
                actionTypeId: 'OPEN_APP',
                extra: { eventType: type, relatedEntityId: entityId, deepLinkRoute: deepLink },
              },
            ],
          });
        } catch (err) {
          console.warn('[Notifications] Native LocalNotifications schedule failed:', err);
        }
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const notif = new Notification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `${Date.now()}`,
          });

          notif.onclick = (e) => {
            e.preventDefault();
            window.focus();
            const targetRoute = resolveNotificationRoute(type || 'GENERAL', entityId, deepLink);
            if (targetRoute) {
              navigate(targetRoute);
            }
            notif.close();
          };
        } catch (e) {
          console.warn('[Notifications] Native browser notification trigger failed:', e);
        }
      }
    },
    [navigate]
  );

  // ── Fetch notifications list ───────────────────────────────────────
  const fetchNotifications = useCallback(async (page = 1) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/notifications?page=${page}&limit=20`);
      if (res.data?.data) {
        const fetchedList: AppNotification[] = res.data.data;
        setNotifications(page === 1 ? fetchedList : (prev) => [...prev, ...fetchedList]);
        setMeta(res.data.meta);
        const newUnread = res.data.meta?.unreadCount ?? 0;

        // Trigger native notification only if new unread notifications arrived after initial load
        if (prevUnreadCountRef.current !== null && newUnread > prevUnreadCountRef.current && fetchedList.length > 0) {
          const latest = fetchedList[0];
          if (latest && !latest.isRead) {
            triggerNativeDeviceNotification(
              latest.title,
              latest.message,
              latest.eventType,
              latest.relatedEntityId || undefined,
              latest.deepLinkRoute || undefined
            );
          }
        }
        prevUnreadCountRef.current = newUnread;
        setUnreadCount(newUnread);
      }
    } catch (err) {
      console.warn('[Notifications] Fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, triggerNativeDeviceNotification]);

  // ── Fetch unread count ─────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/unread-count');
      if (typeof res.data?.unreadCount === 'number') {
        const newUnread = res.data.unreadCount;

        if (prevUnreadCountRef.current !== null && newUnread > prevUnreadCountRef.current) {
          // Unread count jumped — refresh list & trigger alert
          fetchNotifications(1);
        } else {
          setUnreadCount(newUnread);
          prevUnreadCountRef.current = newUnread;
        }
      }
    } catch {}
  }, [user, fetchNotifications]);

  // ── Mark as read ───────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => {
        const updated = Math.max(0, c - 1);
        prevUnreadCountRef.current = updated;
        return updated;
      });
    } catch (err) {
      console.warn('[Notifications] Mark read failed:', err);
    }
  }, []);

  // ── Mark all as read ───────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      prevUnreadCountRef.current = 0;
    } catch (err) {
      console.warn('[Notifications] Mark all read failed:', err);
    }
  }, []);

  const clearNotification = useCallback(async (id: string) => {
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setUnreadCount((count) => Math.max(0, count - (notifications.find((item) => item.id === id && !item.isRead) ? 1 : 0)));
  }, [notifications]);

  const clearAllNotifications = useCallback(async () => {
    await api.delete('/notifications/clear-all');
    setNotifications([]);
    setUnreadCount(0);
    setMeta((current) => current ? { ...current, total: 0, unreadCount: 0, totalPages: 0 } : current);
  }, []);

  // ── Trigger live test notification for currently logged-in user ─────
  const triggerTestNotification = useCallback(async (title?: string, message?: string) => {
    if (!user) return;
    try {
      const res = await api.post('/notifications/trigger-self-test', {
        title: title || '🔔 Campus Notification Alert',
        message: message || 'Live event push notification triggered successfully!',
        eventType: 'CAMPUS_ANNOUNCEMENT',
        deepLinkRoute: '/student/notifications',
      });
      if (res.data?.data) {
        fetchUnreadCount();
        fetchNotifications(1);
        triggerNativeDeviceNotification(
          res.data.data.title || '🔔 Campus Notification Alert',
          res.data.data.message || 'Live event push notification triggered successfully!',
          res.data.data.eventType,
          res.data.data.relatedEntityId,
          res.data.data.deepLinkRoute
        );
      }
    } catch (err) {
      console.warn('[Notifications] Self-test trigger failed:', err);
    }
  }, [user, fetchUnreadCount, fetchNotifications, triggerNativeDeviceNotification]);

  // ── Register push token with backend ──────────────────────────────
  const registerTokenWithBackend = useCallback(async (token: string, platform: 'android' | 'ios' | 'web') => {
    if (lastRegisteredTokenRef.current === token) return;
    try {
      const deviceId = getOrCreateDeviceId();
      const payload: DeviceTokenRegistration = {
        token,
        platform,
        deviceId,
      };
      await api.post('/notifications/device-tokens', payload);
      lastRegisteredTokenRef.current = token;
      setDeviceToken(token);
      console.log(`[Push] Backend registration: SUCCESS (${platform})`);
    } catch (err) {
      console.warn('[Push] Backend registration: FAILED', err);
    }
  }, []);

  // ── Cold-launch & Background deep link capture ─────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removePushListener: (() => void) | null = null;
    let removeLocalListener: (() => void) | null = null;

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const rawNotif = action.notification as any;
      const data = (rawNotif?.data || rawNotif?.extra || rawNotif) as Record<string, any> | undefined;
      const eventType = data?.eventType || data?.type || data?.event_type;
      const entityId = data?.relatedEntityId || data?.entityId || data?.id;
      const deepLink = data?.deepLinkRoute || data?.deepLink || data?.route || data?.url;

      const route = resolveNotificationRoute(eventType, entityId, deepLink, user?.role);
      if (route) {
        if (user) {
          navigate(route, { replace: false });
          fetchUnreadCount();
        } else {
          setPendingDeepLink(route);
        }
      }
    }).then((listener) => {
      removePushListener = () => listener.remove();
    }).catch((err) => {
      console.warn('[Notifications] Push tap listener setup failed:', err);
    });

    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const rawNotif = action.notification as any;
      const data = (rawNotif?.extra || rawNotif?.data || rawNotif) as Record<string, any> | undefined;
      const eventType = data?.eventType || data?.type || data?.event_type;
      const entityId = data?.relatedEntityId || data?.entityId || data?.id;
      const deepLink = data?.deepLinkRoute || data?.deepLink || data?.route || data?.url;

      const route = resolveNotificationRoute(eventType, entityId, deepLink, user?.role);
      if (route) {
        if (user) {
          navigate(route, { replace: false });
          fetchUnreadCount();
        } else {
          setPendingDeepLink(route);
        }
      }
    }).then((listener) => {
      removeLocalListener = () => listener.remove();
    }).catch((err) => {
      console.warn('[Notifications] Local notification tap listener setup failed:', err);
    });

    return () => {
      removePushListener?.();
      removeLocalListener?.();
    };
  }, [user, navigate, fetchUnreadCount]);

  // ── Register Capacitor push listeners (Mobile Native OS) ──────────
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform() || pushListenersRegistered.current) return;

    const setup = async () => {
      try {
        const platform = Capacitor.getPlatform() as 'android' | 'ios';

        try {
          const { value: cachedToken } = await (await import('@capacitor/preferences')).Preferences.get({ key: 'campusos_fcm_token' });
          if (cachedToken) {
            registerTokenWithBackend(cachedToken, platform);
          }
        } catch (_) {}

        let status = await PushNotifications.checkPermissions();

        if (status.receive === 'prompt') {
          status = await PushNotifications.requestPermissions();
        }

        if (status.receive !== 'granted') {
          console.warn('[Push] Permission: DENIED / NOT GRANTED', status.receive);
          return;
        }

        console.log('[Push] Permission: GRANTED');

        try {
          if (platform === 'android') {
            await PushNotifications.createChannel({
              id: 'campusos_alerts',
              name: 'CampusOS Alerts',
              description: 'Instant notification alerts for leave, approvals, tasks & circulars',
              importance: 5,
              visibility: 1,
              sound: 'default',
              vibration: true,
              lights: true,
            }).catch(() => {});
          }

          await PushNotifications.addListener('registration', (tokenData) => {
            console.log('[Push] FCM token received: YES');
            import('@capacitor/preferences').then(({ Preferences }) => {
              Preferences.set({ key: 'campusos_fcm_token', value: tokenData.value }).catch(() => {});
            }).catch(() => {});
            registerTokenWithBackend(tokenData.value, platform);
          });

          await PushNotifications.addListener('registrationError', (err) => {
            console.error('[Push] Registration error from FCM:', err);
          });

          await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[Push] Foreground push received:', notification.title);
            fetchUnreadCount();
            fetchNotifications(1);
            triggerNativeDeviceNotification(
              notification.title || 'CampusOS Notification',
              notification.body || 'New campus update received.',
              notification.data?.eventType,
              notification.data?.relatedEntityId,
              notification.data?.deepLinkRoute
            );
          });

          await PushNotifications.register();
          pushListenersRegistered.current = true;
        } catch (regErr) {
          console.warn('[Push] Native push registration skipped:', regErr);
        }
      } catch (err) {
        console.warn('[Notifications] Mobile push setup failed:', err);
      }
    };

    setup();
  }, [user, registerTokenWithBackend, fetchUnreadCount, fetchNotifications, triggerNativeDeviceNotification]);

  // ── Register Web Firebase Push Listener & Token (Web Browser) ─────
  useEffect(() => {
    if (!user || Capacitor.isNativePlatform()) return;

    let unsubscribeForeground: (() => void) | null = null;

    const setupWebPush = async () => {
      try {
        if (typeof window === 'undefined' || !('Notification' in window)) return;

        initFirebaseAnalytics().catch(() => {});

        if (Notification.permission === 'granted') {
          const webToken = await requestWebFcmToken();
          if (webToken) {
            registerTokenWithBackend(webToken, 'web');
          }
        }

        const unsub = await onForegroundWebMessage((payload) => {
          fetchUnreadCount();
          fetchNotifications(1);
          triggerNativeDeviceNotification(
            payload.notification?.title || payload.data?.title || 'CampusOS Notification',
            payload.notification?.body || payload.data?.message || payload.data?.body || 'New update received.',
            payload.data?.eventType,
            payload.data?.relatedEntityId,
            payload.data?.deepLinkRoute
          );
        });

        if (unsub) {
          unsubscribeForeground = unsub;
        }
      } catch (err) {
        console.warn('[Notifications] Web push setup failed:', err);
      }
    };

    setupWebPush();

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, [user, registerTokenWithBackend, fetchUnreadCount, fetchNotifications, triggerNativeDeviceNotification]);

  // ── Real-time 3s Polling + Window Focus Sync ────────────────────────
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setMeta(null);
      prevUnreadCountRef.current = null;
      return;
    }

    fetchNotifications(1);
    fetchUnreadCount();

    pollIntervalRef.current = setInterval(fetchUnreadCount, UNREAD_POLL_INTERVAL_MS);

    const handleWindowFocus = () => {
      fetchUnreadCount();
      fetchNotifications(1);
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [user, fetchNotifications, fetchUnreadCount]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      meta,
      isLoading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
      triggerTestNotification,
      deviceToken,
    }),
    [notifications, unreadCount, meta, isLoading, fetchNotifications, markAsRead, markAllAsRead, clearNotification, clearAllNotifications, triggerTestNotification, deviceToken]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* ── Active In-App Heads-Up Notification Banner ── */}
      {activeToast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-surface/95 dark:bg-surface/95 backdrop-blur-xl border border-primary/30 shadow-2xl rounded-2xl p-4 flex items-start gap-3.5 ring-1 ring-black/5 dark:ring-white/10">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Bell className="w-5 h-5 animate-pulse text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Campus Alert
                </span>
                <span className="text-[10px] text-text-muted">Just now</span>
              </div>
              <h4 className="text-sm font-bold text-text-primary truncate">{activeToast.title}</h4>
              <p className="text-xs text-text-secondary line-clamp-2 mt-0.5 leading-relaxed">{activeToast.body}</p>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const route = resolveNotificationRoute(activeToast.eventType, activeToast.entityId, activeToast.deepLinkRoute, user?.role);
                    if (route) navigate(route);
                    setActiveToast(null);
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
                >
                  View Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveToast(null)}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-text-secondary hover:bg-surface-soft active:scale-95 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface-soft transition-colors shrink-0 -mr-1 -mt-1"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
