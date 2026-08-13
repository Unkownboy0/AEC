import React, { useMemo, useState } from 'react';
import { Bell, Eye, FileText, Inbox, RefreshCw, Search, Trash2, XCircle, Eraser } from 'lucide-react';
import { useCirculars } from '../hooks/useCirculars';
import { CircularCard } from '../components/CircularCard';
import { CircularDetail } from '../components/CircularDetail';
import { Circular } from '../types/circular.types';
import { useAuth } from '../../../context/AuthContext';

interface RoleCircularsPageProps { roleLabel: string; roleColor?: string; }
const FacultyCircularsPage: React.FC = () => <RoleCircularsPage roleLabel="Faculty" />;

export const RoleCircularsPage: React.FC<RoleCircularsPageProps> = ({ roleLabel }) => {
  const { circulars, loading, error, refresh, markRead, clear, removeDraft, cancelPublished } = useCirculars();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Circular | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const unread = circulars.filter((item) => !item.isRead).length;
  const read = circulars.filter((item) => item.isRead).length;
  const visible = useMemo(() => circulars.filter((item) => {
    const matchesView = view === 'ALL' || (view === 'UNREAD' && !item.isRead) || (view === 'READ' && item.isRead);
    const text = `${item.title || ''} ${item.description || ''} ${item.circularNumber || ''}`.toLowerCase();
    return matchesView && text.includes(query.trim().toLowerCase());
  }), [circulars, query, view]);

  const handleOpen = async (item: Circular) => {
    setSelected(item.isRead ? item : { ...item, isRead: true, userReadAt: new Date().toISOString() });
    try { await markRead(item.id); } catch { refresh(); }
  };

  const runAction = async (action: 'clear' | 'delete' | 'cancel') => {
    if (!selected) return;
    const messages = { clear: 'Clear this circular from your view?', delete: 'Delete this draft permanently?', cancel: 'Cancel this published circular for all recipients?' };
    if (!window.confirm(messages[action])) return;
    if (action === 'clear') await clear(selected.id);
    if (action === 'delete') await removeDraft(selected.id);
    if (action === 'cancel') await cancelPublished(selected.id);
    setSelected(null);
  };

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 pb-16">
      <header className="flex flex-col gap-5 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-semibold text-primary">{roleLabel} communications</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary">Circulars</h1><p className="mt-1 max-w-2xl text-sm text-text-muted">Official notices addressed to your current workspace, ordered by publication time.</p></div>
        <button onClick={refresh} className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {[{ label: 'Received', value: circulars.length, icon: Inbox }, { label: 'Unread', value: unread, icon: Bell }, { label: 'Read', value: read, icon: Eye }].map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-border bg-surface p-4"><div className="flex items-center justify-between text-xs text-text-muted"><span>{label}</span><Icon className="h-4 w-4 text-primary" /></div><strong className="mt-3 block text-2xl tabular-nums text-text-primary">{value}</strong></article>)}
      </div>
      <div className="flex flex-col gap-3 rounded-xl bg-surface-soft/70 p-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1" role="tablist">{(['ALL', 'UNREAD', 'READ'] as const).map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${view === item ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>{item === 'ALL' ? 'All circulars' : item === 'READ' ? 'Read' : 'Unread'}</button>)}</div>
        <label className="relative sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><span className="sr-only">Search circulars</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or circular number" className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-xs text-text-primary outline-none focus:border-primary" /></label>
      </div>
      {loading && <div className="grid gap-4 xl:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl bg-muted" />)}</div>}
      {error && !loading && <div className="rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center"><p className="text-sm text-text-secondary">{error}</p><button onClick={refresh} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Try again</button></div>}
      {!loading && !error && visible.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-surface/50 py-16 text-center"><FileText className="mx-auto mb-3 h-10 w-10 text-text-muted" /><p className="font-semibold text-text-primary">No matching circulars</p><p className="mt-1 text-sm text-text-muted">New notices addressed to this workspace will appear here.</p></div>}
      {!loading && visible.length > 0 && <div className="grid gap-4 xl:grid-cols-2">{visible.map((item) => <CircularCard key={item.id} circular={item} onClick={handleOpen} />)}</div>}
      {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"><div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-surface shadow-2xl sm:mx-4 sm:max-w-2xl sm:rounded-2xl"><div className="flex flex-wrap items-center gap-2 border-b border-border p-3"><button onClick={() => runAction('clear')} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"><Eraser className="h-4 w-4" /> Clear from my view</button>{selected.authorId === user?.id && selected.status === 'DRAFT' && <button onClick={() => runAction('delete')} className="inline-flex items-center gap-2 rounded-lg border border-danger/30 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /> Delete draft</button>}{selected.authorId === user?.id && selected.status === 'PUBLISHED' && <button onClick={() => runAction('cancel')} className="inline-flex items-center gap-2 rounded-lg border border-danger/30 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10"><XCircle className="h-4 w-4" /> Cancel circular</button>}</div><CircularDetail circular={selected} onClose={() => setSelected(null)} /></div></div>}
    </section>
  );
};

export { FacultyCircularsPage };
export default FacultyCircularsPage;
