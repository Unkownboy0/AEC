import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, RefreshCw, ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { resolveNotificationRoute } from '../../notifications/notification-router';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  deepLinkRoute?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
  eventType: string;
}

function formatTime(dateStr: string) {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAsRead = async (n: NotificationItem) => {
    try {
      if (!n.isRead) {
        await api.patch(`/notifications/${n.id}/read`);
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
      }
      const targetRoute = resolveNotificationRoute(n.eventType, n.relatedEntityId, n.deepLinkRoute);
      if (targetRoute) {
        navigate(targetRoute);
      }
    } catch {}
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-app-bg text-text-primary">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md border-b border-border px-4 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              type="button"
              className="p-2 rounded-xl hover:bg-surface-soft text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-text-primary leading-none">Notifications Center</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-primary font-bold mt-1">{unreadCount} unread alerts</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              type="button"
              className="p-2 rounded-xl hover:bg-surface-soft text-text-muted hover:text-text-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-soft text-primary text-xs font-bold hover:bg-primary/20 transition-colors disabled:opacity-60"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main List Container */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-surface-soft border border-border/60 animate-pulse" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16 bg-surface rounded-2xl border border-border p-6">
            <p className="text-text-muted text-sm mb-4">{error}</p>
            <button
              onClick={load}
              type="button"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-colors"
            >
              Retry Loading
            </button>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="text-center py-20 bg-surface rounded-2xl border border-border p-8">
            <Bell className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-text-primary font-bold text-sm">No notifications right now</p>
            <p className="text-text-muted text-xs mt-1">
              New circulars, leave updates, and task alerts will appear here in real-time.
            </p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="space-y-2.5">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markAsRead(n)}
                className={`
                  relative flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all
                  hover:border-primary/40 active:scale-[0.995]
                  ${!n.isRead
                    ? 'bg-surface border-primary/30 shadow-xs'
                    : 'bg-surface/60 border-border opacity-85'}
                `}
              >
                {!n.isRead && (
                  <div className="absolute left-0 top-3.5 bottom-3.5 w-1 bg-primary rounded-r-full" />
                )}
                <div className="w-9 h-9 rounded-xl bg-surface-soft border border-border/40 flex items-center justify-center shrink-0 text-primary">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className={`text-xs font-bold leading-tight ${!n.isRead ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {n.title}
                    </p>
                    <span className="text-[11px] text-text-muted shrink-0">{formatTime(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{n.message}</p>
                </div>
                {!n.isRead && <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
