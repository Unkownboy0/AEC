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
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { resolveNotificationRoute } from './notification-router';
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

  const pushListenersRegistered = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevUnreadCountRef = useRef<number>(0);

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
            importance: 5, // MAX importance for heads-up pop-up banner
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

  // ── Dispatch Native Mobile & Web OS Notification Banner ────────────
  const triggerNativeDeviceNotification = useCallback(
    async (title: string, body: string, type?: string, entityId?: string, deepLink?: string) => {
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

        // Trigger native notification if new unread notification arrived
        if (newUnread > prevUnreadCountRef.current && fetchedList.length > 0) {
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

        if (newUnread > prevUnreadCountRef.current) {
          // Unread count jumped — refresh list & trigger native alert
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

  // ── Register push token with backend ──────────────────────────────
  const registerTokenWithBackend = useCallback(async (token: string, platform: 'android' | 'ios') => {
    try {
      const deviceId = getOrCreateDeviceId();
      const payload: DeviceTokenRegistration = {
        token,
        platform,
        deviceId,
      };
      await api.post('/notifications/device-tokens', payload);
      setDeviceToken(token);
    } catch (err) {
      console.warn('[Notifications] Device token registration failed:', err);
    }
  }, []);

  // ── Handle notification tap -> navigate ────────────────────────────
  const handleNotificationTap = useCallback(
    (notification: { data?: Record<string, string>; title?: string; body?: string }) => {
      const eventType = notification.data?.eventType;
      const entityId = notification.data?.relatedEntityId;
      const deepLink = notification.data?.deepLinkRoute;

      if (!eventType) return;

      const route = resolveNotificationRoute(eventType, entityId, deepLink);
      if (route) {
        navigate(route, { replace: false });
      }
    },
    [navigate]
  );

  // ── Register Capacitor push listeners (Mobile Native OS) ──────────
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform() || pushListenersRegistered.current) return;

    const setup = async () => {
      try {
        let status = await PushNotifications.checkPermissions();

        if (status.receive === 'prompt') {
          status = await PushNotifications.requestPermissions();
        }

        if (status.receive !== 'granted') {
          return;
        }

        try {
          await PushNotifications.addListener('registration', (tokenData) => {
            const platform = Capacitor.getPlatform() as 'android' | 'ios';
            registerTokenWithBackend(tokenData.value, platform);
          });

          await PushNotifications.addListener('pushNotificationReceived', (notification) => {
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

          await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            handleNotificationTap(action.notification);
            fetchUnreadCount();
          });

          await PushNotifications.register();
          pushListenersRegistered.current = true;
        } catch (regErr) {
          console.warn('[Notifications] Native push registration skipped (FCM config optional):', regErr);
        }
      } catch (err) {
        console.warn('[Notifications] Mobile push setup failed:', err);
      }
    };

    setup();
  }, [user, registerTokenWithBackend, fetchUnreadCount, fetchNotifications, handleNotificationTap, triggerNativeDeviceNotification]);

  // ── Real-time 5s Polling + Window Focus Sync ────────────────────────
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setMeta(null);
      return;
    }

    fetchNotifications(1);
    fetchUnreadCount();

    // 5-second real-time poll
    pollIntervalRef.current = setInterval(fetchUnreadCount, UNREAD_POLL_INTERVAL_MS);

    // Instant refresh when user returns to application tab
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
      deviceToken,
    }),
    [notifications, unreadCount, meta, isLoading, fetchNotifications, markAsRead, markAllAsRead, clearNotification, clearAllNotifications, deviceToken]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
