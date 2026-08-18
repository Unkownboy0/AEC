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
import { setPendingDeepLink, consumePendingDeepLink } from '../platform/pending-deep-link';
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

  const listenersAttachedRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUnreadCountRef = useRef<number | null>(null);
  const lastRegisteredTokenRef = useRef<string | null>(null);
  const lastRegisteredUserIdRef = useRef<string | null>(null);

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

  // ── Register push token with backend ──────────────────────────────
  const registerTokenWithBackend = useCallback(async (token: string, platform: 'android' | 'ios' | 'web', targetUserId?: string) => {
    const currentUserId = targetUserId || user?.id;
    if (!currentUserId || !token) return;

    if (lastRegisteredTokenRef.current === token && lastRegisteredUserIdRef.current === currentUserId) {
      return;
    }

    try {
      const deviceId = getOrCreateDeviceId();
      const payload: DeviceTokenRegistration & { appVersion?: string } = {
        token,
        platform,
        deviceId,
        appVersion: '1.0.2',
      };
      await api.post('/notifications/device-tokens', payload);
      lastRegisteredTokenRef.current = token;
      lastRegisteredUserIdRef.current = currentUserId;
      setDeviceToken(token);
      console.log(`[PUSH] backend-device-register=200 platform=${platform} userId=${currentUserId.slice(0, 8)}...`);
    } catch (err: any) {
      const status = err.response?.status || 'network-error';
      console.warn(`[PUSH] backend-register-failed status=${status}`, err);
    }
  }, [user?.id]);

  // ── Dispatch In-App Toast Banner & Web OS Notification Banner ───────
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

      // 3. Browser web notification if permitted (native mobile relies on heads-up in-app toast + FCM system alert)
      if (!Capacitor.isNativePlatform() && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
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
            const targetRoute = resolveNotificationRoute(type || 'GENERAL', entityId, deepLink, user?.role);
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
    [navigate, user?.role]
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

        // Trigger in-app toast only if new unread notifications arrived after initial load
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
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      setUnreadCount((count) => Math.max(0, count - (notifications.find((item) => item.id === id && !item.isRead) ? 1 : 0)));
    } catch (err) {
      console.warn('[Notifications] Clear notification failed:', err);
    }
  }, [notifications]);

  const clearAllNotifications = useCallback(async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
      setMeta((current) => current ? { ...current, total: 0, unreadCount: 0, totalPages: 0 } : current);
    } catch (err) {
      console.warn('[Notifications] Clear all failed:', err);
    }
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

  // ── Check pending deep link when user becomes authenticated ───────
  useEffect(() => {
    if (user?.id) {
      const pending = consumePendingDeepLink();
      if (pending) {
        console.log(`[PUSH] Consuming cold-launch pending deep link: ${pending}`);
        navigate(pending, { replace: false });
      }
    } else {
      // User logged out — clear registration tracking
      lastRegisteredUserIdRef.current = null;
      lastRegisteredTokenRef.current = null;
    }
  }, [user?.id, navigate]);

  // ── Native Push Listeners Setup & Registration (Once on Native Mount) ─
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removePushAction: (() => void) | null = null;
    let removeLocalAction: (() => void) | null = null;
    let removePushReceived: (() => void) | null = null;
    let removePushRegistration: (() => void) | null = null;
    let removePushError: (() => void) | null = null;

    const setupNativePush = async () => {
      console.log('[PUSH] bootstrap-start');

      try {
        const platform = Capacitor.getPlatform() as 'android' | 'ios';

        // 1. Create Android Notification Channel
        if (platform === 'android') {
          try {
            await PushNotifications.createChannel({
              id: 'campusos_alerts',
              name: 'CampusOS Alerts',
              description: 'Instant notification alerts for leave, approvals, tasks & circulars',
              importance: 5,
              visibility: 1,
              sound: 'default',
              vibration: true,
              lights: true,
            });
          } catch (channelErr) {
            console.warn('[PUSH] Channel creation warning:', channelErr);
          }
        }

        // 2. Install Listeners BEFORE calling PushNotifications.register()
        if (!listenersAttachedRef.current) {
          const regSub = await PushNotifications.addListener('registration', (tokenData) => {
            const rawToken = tokenData.value;
            const fingerprint = rawToken ? `${rawToken.slice(0, 6)}...${rawToken.slice(-6)} (len=${rawToken.length})` : 'empty';
            console.log(`[PUSH] registration-success tokenFingerprint=${fingerprint}`);

            import('@capacitor/preferences').then(({ Preferences }) => {
              Preferences.set({ key: 'campusos_fcm_token', value: rawToken }).catch(() => {});
            }).catch(() => {});

            setDeviceToken(rawToken);
            if (user?.id) {
              registerTokenWithBackend(rawToken, platform, user.id);
            }
          });
          removePushRegistration = () => regSub.remove();

          const errSub = await PushNotifications.addListener('registrationError', (err) => {
            console.error(`[PUSH] registration-error code=${err?.error || JSON.stringify(err)}`);
          });
          removePushError = () => errSub.remove();

          const recSub = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log(`[PUSH] pushNotificationReceived title="${notification.title || ''}"`);
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
          removePushReceived = () => recSub.remove();

          const actionSub = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            const rawNotif = action.notification as any;
            const data = (rawNotif?.data || rawNotif?.extra || rawNotif) as Record<string, any> | undefined;
            const eventType = data?.eventType || data?.type || data?.event_type;
            const entityId = data?.relatedEntityId || data?.entityId || data?.id;
            const deepLink = data?.deepLinkRoute || data?.deepLink || data?.route || data?.url;

            console.log(`[PUSH] pushNotificationActionPerformed eventType=${eventType || 'GENERAL'} entityId=${entityId || 'none'}`);

            const route = resolveNotificationRoute(eventType, entityId, deepLink, user?.role);
            if (route) {
              if (user?.id) {
                navigate(route, { replace: false });
                fetchUnreadCount();
              } else {
                setPendingDeepLink(route);
              }
            }
          });
          removePushAction = () => actionSub.remove();

          const localActionSub = await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
            const rawNotif = action.notification as any;
            const data = (rawNotif?.extra || rawNotif?.data || rawNotif) as Record<string, any> | undefined;
            const eventType = data?.eventType || data?.type || data?.event_type;
            const entityId = data?.relatedEntityId || data?.entityId || data?.id;
            const deepLink = data?.deepLinkRoute || data?.deepLink || data?.route || data?.url;

            const route = resolveNotificationRoute(eventType, entityId, deepLink, user?.role);
            if (route) {
              if (user?.id) {
                navigate(route, { replace: false });
                fetchUnreadCount();
              } else {
                setPendingDeepLink(route);
              }
            }
          });
          removeLocalAction = () => localActionSub.remove();

          listenersAttachedRef.current = true;
          console.log('[PUSH] listeners-installed');
        }

        // 3. Permission Check & Request (Handles prompt, prompt-with-rationale, granted, denied)
        let permStatus = await PushNotifications.checkPermissions();
        console.log(`[PUSH] permission-check state=${permStatus.receive}`);

        if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
          permStatus = await PushNotifications.requestPermissions();
          console.log(`[PUSH] permission-requested result=${permStatus.receive}`);
        }

        if (permStatus.receive === 'granted') {
          console.log('[PUSH] permission=granted');
          console.log('[PUSH] register-called');
          await PushNotifications.register();
          console.log('[PUSH] ready');
        } else {
          console.warn(`[PUSH] permission=${permStatus.receive}`);
        }

        // 4. Check cached token and sync if user is active
        try {
          const { Preferences } = await import('@capacitor/preferences');
          const { value: cachedToken } = await Preferences.get({ key: 'campusos_fcm_token' });
          if (cachedToken) {
            setDeviceToken(cachedToken);
            if (user?.id) {
              registerTokenWithBackend(cachedToken, platform, user.id);
            }
          }
        } catch (_) {}
      } catch (err) {
        console.error('[PUSH] Native push bootstrap error:', err);
      }
    };

    setupNativePush();

    return () => {
      removePushRegistration?.();
      removePushError?.();
      removePushReceived?.();
      removePushAction?.();
      removeLocalAction?.();
    };
  }, []); // Run once on mount to establish permanent native listeners

  // ── Sync Device Token to Backend whenever Authenticated User Changes ─
  useEffect(() => {
    if (!user?.id) return;

    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform() as 'android' | 'ios';
      import('@capacitor/preferences').then(({ Preferences }) => {
        Preferences.get({ key: 'campusos_fcm_token' }).then(({ value: cachedToken }) => {
          if (cachedToken) {
            registerTokenWithBackend(cachedToken, platform, user.id);
          }
        }).catch(() => {});
      }).catch(() => {});
    }
  }, [user?.id, registerTokenWithBackend]);

  // ── Register Web Firebase Push Listener & Token (Web Browser) ─────
  useEffect(() => {
    if (!user?.id || Capacitor.isNativePlatform()) return;

    let unsubscribeForeground: (() => void) | null = null;

    const setupWebPush = async () => {
      try {
        if (typeof window === 'undefined' || !('Notification' in window)) return;

        initFirebaseAnalytics().catch(() => {});

        if (Notification.permission === 'granted') {
          const webToken = await requestWebFcmToken();
          if (webToken) {
            registerTokenWithBackend(webToken, 'web', user.id);
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
        console.warn('[PUSH] Web push setup failed:', err);
      }
    };

    setupWebPush();

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, [user?.id, registerTokenWithBackend, fetchUnreadCount, fetchNotifications, triggerNativeDeviceNotification]);

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
