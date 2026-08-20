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
  Building2,
  FileBox,
  MessageSquare,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { resolveNotificationRoute } from '../../notifications/notification-router';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../notifications/NotificationProvider';
import { ProfileAvatar } from '../profile/ProfileAvatar';

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
  actorUserId?: string;
  actorDisplayName?: string;
  actorProfileImage?: string;
  actorRole?: string;
  actorGender?: string;
  actorType?: 'HUMAN' | 'SYSTEM';
  senderName?: string;
  senderAvatar?: string;
  senderRole?: string;
  senderGender?: string;
  actorName?: string;
  actorAvatar?: string;
  subjectName?: string;
  subjectRole?: string;
  subjectAvatar?: string;
}

type TabKey = 'ALL' | 'UNREAD' | 'APPROVALS' | 'TASKS' | 'ACADEMIC' | 'FEES' | 'EXAMS' | 'CRITICAL';

export const UnifiedNotificationInbox: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerTestNotification, refetchBadges } = useNotifications();
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
    const target = notifications.find((n) => n.id === id);
    if (!target || target.isRead) return;

    // Optimistic state update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await api.patch(`/notifications/${id}/read`);
      refetchBadges?.();
    } catch {
      // Rollback on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false, readAt: undefined } : n))
      );
      setUnreadCount((c) => c + 1);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleAcknowledge = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = notifications.find((n) => n.id === id);
    if (!target) return;

    // Optimistic state update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    if (!target.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    try {
      await api.post(`/notifications/${id}/acknowledge`);
      toast.success('Notification acknowledged.');
      refetchBadges?.();
    } catch {
      // Rollback on failure
      if (!target.isRead) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false, readAt: undefined } : n))
        );
        setUnreadCount((c) => c + 1);
      }
      toast.error('Failed to acknowledge notification');
    }
  };

  const handleMarkAllRead = async () => {
    const prevList = [...notifications];
    const prevCount = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await api.post('/notifications/read-all');
      toast.success('All notifications marked as read.');
      refetchBadges?.();
    } catch {
      setNotifications(prevList);
      setUnreadCount(prevCount);
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const prevList = [...notifications];
    const item = notifications.find((n) => n.id === id);

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (item && !item.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    try {
      await api.delete(`/notifications/${id}`);
      toast.success('Notification cleared.');
      refetchBadges?.();
    } catch {
      setNotifications(prevList);
      if (item && !item.isRead) {
        setUnreadCount((c) => c + 1);
      }
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
          {items.map((item) => {
            const hasHumanActor = item.actorType === 'HUMAN' || (item.actorType !== 'SYSTEM' && Boolean(item.actorDisplayName || item.senderName || item.actorProfileImage || item.senderAvatar));
            const actorName = item.actorDisplayName || item.actorName || item.senderName || (hasHumanActor ? 'Campus User' : 'CampusOS System');
            const actorRole = item.actorRole || item.senderRole;
            const actorAvatar = item.actorProfileImage || item.actorAvatar || item.senderAvatar;
            const actorGender = item.actorGender || item.senderGender;

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 sm:gap-4 ${
                  item.isRead
                    ? 'bg-card/60 border-border hover:bg-card hover:shadow-xs'
                    : 'bg-primary/5 border-primary/25 shadow-xs hover:border-primary/40'
                }`}
              >
                {/* Profile Avatar (Human) or System Module Icon (System) */}
                <div className="relative shrink-0 mt-0.5">
                  {hasHumanActor ? (
                    <ProfileAvatar
                      gender={actorGender}
                      name={actorName}
                      src={actorAvatar}
                      size="md"
                      shape="circle"
                      className="w-10 h-10 ring-2 ring-border/60 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 shadow-xs flex items-center justify-center text-primary">
                      {getEventIcon(item.eventType)}
                    </div>
                  )}
                  {hasHumanActor && (
                    <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-surface border border-border shadow-xs text-primary">
                      {getEventIcon(item.eventType)}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <h5 className={`text-xs sm:text-sm font-bold truncate ${item.isRead ? 'text-foreground' : 'text-primary'}`}>
                        {item.title}
                      </h5>
                      {hasHumanActor ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                          {actorRole ? `${actorName} (${actorRole})` : actorName}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground border border-border shrink-0">
                          System Alert
                        </span>
                      )}
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {item.subjectName && item.subjectName !== actorName && (
                    <p className="text-[11px] font-semibold text-primary/80">
                      Regarding: {item.subjectName} {item.subjectRole ? `(${item.subjectRole})` : ''}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
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
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-muted hover:bg-muted/80 text-foreground cursor-pointer transition-colors"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleAcknowledge(item.id, e)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer shadow-xs transition-opacity"
                      >
                        Acknowledge
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleClearOne(item.id, e)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                        title="Clear Notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
