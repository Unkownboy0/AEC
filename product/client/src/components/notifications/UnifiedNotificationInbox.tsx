import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  CheckCheck,
  AlertTriangle,
  FileText,
  Calendar,
  CreditCard,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Trash2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { resolveNotificationRoute } from '../../notifications/notification-router';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../notifications/NotificationProvider';

interface NotificationItem {
  id: string;
  eventType: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  deepLinkRoute?: string;
  isRead: boolean;
  readAt?: string;
  deliveryChannel: string;
  createdAt: string;
}

type TabKey = 'ALL' | 'UNREAD' | 'APPROVALS' | 'TASKS' | 'ACADEMIC' | 'FEES' | 'EXAMS' | 'CRITICAL';

export const UnifiedNotificationInbox: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerTestNotification } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const params: any = { limit: 50 };
      if (activeTab === 'UNREAD') {
        params.isRead = false;
      } else if (activeTab !== 'ALL') {
        params.category = activeTab;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.get('/notifications', { params });
      if (res.data?.status === 'success' || res.data?.data) {
        const list = Array.isArray(res.data.data) ? res.data.data : [];
        setNotifications(list);
        setUnreadCount(res.data.meta?.unreadCount ?? list.filter((n: any) => !n.isRead).length);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleAcknowledge = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/acknowledge`);
      toast.success('Notification acknowledged.');
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error('Failed to acknowledge notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      toast.success('All notifications marked as read.');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification cleared.');
    } catch {
      toast.error('Failed to clear notification');
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
    const targetRoute = resolveNotificationRoute(
      item.eventType,
      item.relatedEntityId,
      item.deepLinkRoute,
      user?.role
    );
    if (targetRoute) {
      navigate(targetRoute);
    }
  };

  // Group notifications by date
  const groupNotifications = (items: NotificationItem[]) => {
    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    items.forEach((item) => {
      const itemTime = new Date(item.createdAt).getTime();
      if (itemTime >= todayStart) today.push(item);
      else if (itemTime >= yesterdayStart) yesterday.push(item);
      else earlier.push(item);
    });

    return { today, yesterday, earlier };
  };

  const getEventIcon = (eventType: string) => {
    const type = (eventType || '').toUpperCase();
    if (type.includes('EMERGENCY') || type.includes('SECURITY')) {
      return <ShieldAlert className="h-5 w-5 text-rose-500" />;
    }
    if (type.includes('LEAVE') || type.includes('OD') || type.includes('PURCHASE')) {
      return <FileText className="h-5 w-5 text-indigo-500" />;
    }
    if (type.includes('TASK')) {
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    }
    if (type.includes('FEE') || type.includes('PAYMENT')) {
      return <CreditCard className="h-5 w-5 text-amber-500" />;
    }
    if (type.includes('EXAM') || type.includes('RESULT') || type.includes('TIMETABLE')) {
      return <GraduationCap className="h-5 w-5 text-blue-500" />;
    }
    return <Bell className="h-5 w-5 text-primary" />;
  };

  const { today, yesterday, earlier } = groupNotifications(notifications);

  const renderSection = (title: string, items: NotificationItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider px-1">{title}</h4>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                item.isRead
                  ? 'bg-card/60 border-border hover:bg-card hover:shadow-sm'
                  : 'bg-primary/5 border-primary/20 shadow-sm hover:border-primary/40'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-background border shadow-xs shrink-0 mt-0.5">
                {getEventIcon(item.eventType)}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h5 className={`text-sm font-bold truncate ${item.isRead ? 'text-foreground' : 'text-primary'}`}>
                      {item.title}
                    </h5>
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {item.message}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      {item.eventType.replace(/_/g, ' ')}
                    </span>
                    {item.deepLinkRoute && (
                      <span className="text-[10px] text-primary font-bold flex items-center gap-1 hover:underline">
                        View Detail <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleAcknowledge(item.id, e)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleClearOne(item.id, e)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Clear Notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'UNREAD', label: 'Unread', count: unreadCount },
    { key: 'APPROVALS', label: 'Approvals' },
    { key: 'TASKS', label: 'Tasks' },
    { key: 'ACADEMIC', label: 'Academic' },
    { key: 'FEES', label: 'Fees' },
    { key: 'EXAMS', label: 'Exams' },
    { key: 'CRITICAL', label: 'Critical' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-foreground flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" /> Institutional Notification Centre
            </h1>
            {unreadCount > 0 && (
              <span className="text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time event updates, academic alerts, workflows, approvals, and official announcements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerTestNotification('🔔 Campus Notification Alert', 'Real-time push notification delivered to your device!')}
            className="text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Test Alert
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(true)}
            disabled={isRefreshing}
            className="text-xs font-bold gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs font-bold gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Notification Stream */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground border bg-card rounded-2xl animate-pulse">
          Loading notification feed...
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center border bg-card rounded-2xl space-y-2">
          <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <h4 className="text-sm font-bold text-foreground">No notifications found</h4>
          <p className="text-xs text-muted-foreground">You are all caught up! No notifications in this category.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {renderSection('Today', today)}
          {renderSection('Yesterday', yesterday)}
          {renderSection('Earlier', earlier)}
        </div>
      )}
    </div>
  );
};

export default UnifiedNotificationInbox;
