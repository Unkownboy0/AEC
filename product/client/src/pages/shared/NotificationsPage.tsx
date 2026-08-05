import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

interface Notification {
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
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function getEventIcon(eventType: string) {
  if (eventType?.includes('CIRCULAR')) return '📢';
  if (eventType?.includes('LEAVE')) return '🏖️';
  if (eventType?.includes('TASK')) return '✅';
  if (eventType?.includes('EMERGENCY')) return '🚨';
  return '🔔';
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

  const markAsRead = async (id: string, deepLink?: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      if (deepLink) navigate(deepLink);
    } catch {}
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h1>
              {unreadCount > 0 && <p className="text-xs text-gray-400">{unreadCount} unread</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-60"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-3">{error}</p>
            <button onClick={load} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">Retry</button>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">Notifications will appear here when you receive them</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id, n.deepLinkRoute)}
                className={`
                  relative flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all
                  hover:shadow-sm active:scale-[0.99]
                  ${n.isRead
                    ? 'bg-white border-gray-100 opacity-75'
                    : 'bg-white border-blue-100 shadow-sm'}
                `}
              >
                {!n.isRead && (
                  <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r-full" />
                )}
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 text-lg">
                  {getEventIcon(n.eventType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-tight mb-0.5 ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
