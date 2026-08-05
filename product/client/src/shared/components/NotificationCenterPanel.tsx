import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../../design-system/components/StatusBadge';
import { Skeleton } from '../../design-system/components/Skeleton';
import { EmptyState } from '../../design-system/components/EmptyState';
import api from '../../lib/axios';
import { useNavigate } from 'react-router-dom';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  deepLink?: string;
}

export const NotificationCenterPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data?.status === 'success') {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleClick = (notif: NotificationItem) => {
    if (!notif.read) handleMarkRead(notif.id);
    if (notif.deepLink) navigate(notif.deepLink);
  };

  return (
    <div className="space-y-4 p-4 bg-card border border-border rounded-2xl shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Notification Center</h3>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all as read
        </button>
      </div>

      {isLoading ? (
        <Skeleton variant="card" count={3} />
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You are all caught up!" icon={Bell} />
      ) : (
        <div className="divide-y divide-border/60 max-h-[400px] overflow-y-auto pr-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`py-3 px-2 rounded-xl transition-colors cursor-pointer flex flex-col gap-1 ${
                n.read ? 'opacity-70 hover:bg-muted/30' : 'bg-primary/5 hover:bg-primary/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{n.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
