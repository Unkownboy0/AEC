import React, { useMemo, useState } from 'react';
import { Bell, CheckCheck, Clock3, Inbox, MessageSquare, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../notifications/NotificationProvider';
import { resolveNotificationRoute } from '../../notifications/notification-router';
import type { AppNotification } from '../../notifications/notification.types';

function formatTime(value: string) {
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications();
  const [view, setView] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => notifications.filter((item) => {
    const stateMatch = view === 'ALL' || (view === 'UNREAD' && !item.isRead) || (view === 'READ' && item.isRead);
    const searchMatch = `${item.title} ${item.message}`.toLowerCase().includes(query.trim().toLowerCase());
    return stateMatch && searchMatch;
  }), [notifications, query, view]);

  const open = async (item: AppNotification) => {
    if (!item.isRead) await markAsRead(item.id);
    const route = resolveNotificationRoute(item.eventType, item.relatedEntityId || undefined, item.deepLinkRoute || undefined);
    if (route) navigate(route);
  };

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 pb-16">
      <header className="flex flex-col gap-5 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs font-semibold text-primary">Live inbox</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary">Notifications</h1><p className="mt-1 text-sm text-text-muted">Circulars, approvals, reminders and campus updates for your active workspace.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => fetchNotifications(1)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold hover:bg-surface-soft"><RefreshCw className="h-4 w-4" /> Refresh</button>{unreadCount > 0 && <button onClick={markAllAsRead} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold hover:bg-surface-soft"><CheckCheck className="h-4 w-4 text-primary" /> Mark all read</button>}{notifications.length > 0 && <button onClick={() => { if (window.confirm('Clear all notifications and reminders?')) clearAllNotifications(); }} className="inline-flex items-center gap-2 rounded-lg border border-danger/30 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /> Clear all</button>}</div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">{[{ label: 'Received', value: notifications.length, icon: Inbox }, { label: 'Unread', value: unreadCount, icon: Bell }, { label: 'Read', value: Math.max(0, notifications.length - unreadCount), icon: CheckCheck }].map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-border bg-surface p-4"><div className="flex items-center justify-between text-xs text-text-muted"><span>{label}</span><Icon className="h-4 w-4 text-primary" /></div><strong className="mt-3 block text-2xl tabular-nums">{value}</strong></article>)}</div>

      <div className="flex flex-col gap-3 rounded-xl bg-surface-soft/70 p-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-1">{(['ALL', 'UNREAD', 'READ'] as const).map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${view === item ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>{item === 'ALL' ? 'All notifications' : item === 'READ' ? 'Read' : 'Unread'}</button>)}</div><label className="relative sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><span className="sr-only">Search notifications</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notifications" className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-xs outline-none focus:border-primary" /></label></div>

      {isLoading && notifications.length === 0 ? <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div> : visible.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-surface/50 py-16 text-center"><Bell className="mx-auto h-10 w-10 text-text-muted" /><p className="mt-3 font-semibold">No matching notifications</p><p className="mt-1 text-sm text-text-muted">New alerts and reminders will appear here automatically.</p></div> : <div className="grid gap-3 md:grid-cols-2">{visible.map((item) => <article key={item.id} onClick={() => open(item)} className={`group relative cursor-pointer rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg ${item.isRead ? 'border-border bg-surface/70' : 'border-primary/30 bg-surface'}`}>{!item.isRead && <span className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-primary" />}<div className="flex items-start gap-3"><span className="rounded-xl border border-border bg-surface-soft p-2 text-primary"><MessageSquare className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="text-sm font-semibold leading-5">{item.title}</h2><button aria-label="Clear notification" onClick={(event) => { event.stopPropagation(); clearNotification(item.id); }} className="rounded-lg p-1.5 text-text-muted opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100 focus:opacity-100"><Trash2 className="h-4 w-4" /></button></div><p className="mt-1 line-clamp-2 text-sm leading-6 text-text-muted">{item.message}</p><p className="mt-3 flex items-center gap-1.5 text-[11px] text-text-muted"><Clock3 className="h-3.5 w-3.5" /> {formatTime(item.createdAt)}</p></div></div></article>)}</div>}
    </section>
  );
};

export default NotificationsPage;
