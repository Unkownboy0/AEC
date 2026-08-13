import React, { useState, useCallback, useMemo } from 'react';
import { Plus, RefreshCw, FileText, ChevronRight, ChevronLeft, Send, Eye, Search, CheckCheck, Trash2, Archive, X } from 'lucide-react';
import { useCirculars } from '../hooks/useCirculars';
import { CircularCard } from '../components/CircularCard';
import { CircularDetail } from '../components/CircularDetail';
import { createHodCircular } from '../api/circularApi';
import { Circular, CreateCircularPayload, CircularCategory, CircularPriority } from '../types/circular.types';
import { PriorityBadge, CategoryBadge } from '../components/CircularBadge';
import { toast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';

const CATEGORIES: CircularCategory[] = [
  'GENERAL', 'ACADEMIC', 'EXAMINATION', 'PLACEMENT', 'INTERNSHIP',
  'EVENT', 'FEES', 'TRANSPORT', 'EMERGENCY', 'DEPARTMENT',
];
const PRIORITIES: CircularPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const WIZARD_STEPS = [
  'Circular Details',
  'Choose Recipients',
  'Attachment',
  'Preview',
  'Publish',
];

const emptyForm = (): CreateCircularPayload => ({
  title: '',
  category: 'GENERAL',
  priority: 'NORMAL',
  description: '',
  content: '',
  broadcastLevel: 'DEPARTMENT_SPECIFIC',
  targetYears: [],
  targetSemesters: [],
  targetSections: [],
  targetDepartments: [],
  targetRoles: [],
  selectedUserIds: [],
  attachmentUrl: '',
  attachmentName: '',
  referenceLink: '',
  isPinned: false,
  isEmergency: false,
  acknowledgementRequired: false,
});

const toggle = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

export const HodCircularPage: React.FC = () => {
  const { user } = useAuth();
  const { circulars, loading, error, unreadCount, refresh, acknowledge, markRead, clear, removeDraft, cancelPublished } = useCirculars();
  const [selected, setSelected] = useState<Circular | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateCircularPayload>(emptyForm());
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'PINNED' | 'URGENT'>('ALL');
  const [pendingAction, setPendingAction] = useState<{ circular: Circular; action: 'clear' | 'delete' | 'cancel' } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const [publishResult, setPublishResult] = useState<any>(null);

  const resetWizard = () => {
    setStep(0);
    setForm(emptyForm());
    setPublishError('');
    setPublishSuccess(false);
    setPublishResult(null);
    setShowWizard(false);
  };

  const handleAcknowledge = useCallback(async (id: string) => {
    setAcknowledging(true);
    await acknowledge(id);
    setAcknowledging(false);
  }, [acknowledge]);

  const handleOpen = useCallback(async (circular: Circular) => {
    setSelected(circular.isRead ? circular : { ...circular, isRead: true, userReadAt: new Date().toISOString() });
    if (!circular.isRead) {
      try { await markRead(circular.id); } catch { toast.error('Could not mark this circular as read'); }
    }
  }, [markRead]);

  const visibleCirculars = useMemo(() => circulars.filter((circular) => {
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || `${circular.title} ${circular.circularNumber} ${circular.description || ''} ${circular.author?.firstName || ''} ${circular.author?.lastName || ''}`.toLowerCase().includes(needle);
    if (!matchesSearch) return false;
    if (filter === 'UNREAD') return !circular.isRead;
    if (filter === 'PINNED') return circular.isPinned;
    if (filter === 'URGENT') return circular.priority === 'URGENT' || circular.isEmergency;
    return true;
  }), [circulars, filter, search]);

  const runPendingAction = async () => {
    if (!pendingAction) return;
    setActionBusy(true);
    try {
      if (pendingAction.action === 'clear') await clear(pendingAction.circular.id);
      if (pendingAction.action === 'delete') await removeDraft(pendingAction.circular.id);
      if (pendingAction.action === 'cancel') await cancelPublished(pendingAction.circular.id);
      setSelected(null);
      toast.success(pendingAction.action === 'clear' ? 'Circular cleared from your feed' : pendingAction.action === 'delete' ? 'Draft circular deleted' : 'Published circular cancelled');
      setPendingAction(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Circular action failed');
    } finally { setActionBusy(false); }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError('');
    setPublishResult(null);
    try {
      const res = await createHodCircular(form);
      const circularObj = res.circular || (res as any).data?.circular;
      const recipientsObj = res.recipients || (res as any).data?.recipients;
      const totalRecipients = recipientsObj?.total ?? 0;

      if (res.success && (circularObj || (res as any).data) && totalRecipients > 0) {
        setPublishResult({
          ...res,
          circular: circularObj,
          recipients: recipientsObj,
        });
        setPublishSuccess(true);
        refresh();
      } else {
        setPublishError('No active department recipients matched the selected audience.');
      }
    } catch (err: any) {
      const serverError = err?.response?.data;
      if (serverError?.code === 'NO_RECIPIENTS_FOUND') {
        setPublishError('No active recipients matched your selection. Review audience settings and try again.');
      } else if (serverError?.details) {
        const detailsStr = Object.entries(serverError.details)
          .map(([field, errs]: [string, any]) => `${field}: ${(errs as string[]).join(', ')}`)
          .join(' | ');
        setPublishError(`Validation Error — ${detailsStr}`);
      } else {
        setPublishError(serverError?.error ?? err?.message ?? 'Failed to publish circular');
      }
    } finally {
      setPublishing(false);
    }
  };



  // ─── Wizard Step Content ───────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
        <input
          type="text"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Internal Assessment Schedule — November 2026"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value as CircularCategory }))}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Priority</label>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value as CircularPriority }))}
          >
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Short Description</label>
        <input
          type="text"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Brief summary (optional)"
          value={form.description ?? ''}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Content *</label>
        <textarea
          rows={6}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Write the full circular content here..."
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
        />
      </div>
      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="rounded" />
          <span className="text-sm text-gray-600">Pin to dashboard</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isEmergency} onChange={e => setForm(f => ({ ...f, isEmergency: e.target.checked }))} className="rounded" />
          <span className="text-sm text-red-600 font-medium">Emergency</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.acknowledgementRequired} onChange={e => setForm(f => ({ ...f, acknowledgementRequired: e.target.checked }))} className="rounded" />
          <span className="text-sm text-gray-600">Require acknowledgement</span>
        </label>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 bg-blue-50 rounded-xl p-3 border border-blue-100">
        <strong>Note:</strong> This circular will be sent to your department. You can optionally filter by year, semester, or section.
      </p>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Target Years (leave blank = all years)</label>
        <div className="flex flex-wrap gap-2">
          {YEARS.map(y => (
            <button
              key={y}
              type="button"
              onClick={() => setForm(f => ({ ...f, targetYears: toggle(f.targetYears ?? [], y) }))}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                (form.targetYears ?? []).includes(y)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Target Semesters</label>
        <div className="flex flex-wrap gap-2">
          {SEMESTERS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setForm(f => ({ ...f, targetSemesters: toggle(f.targetSemesters ?? [], s) }))}
              className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                (form.targetSemesters ?? []).includes(s)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Target Sections</label>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setForm(f => ({ ...f, targetSections: toggle(f.targetSections ?? [], s) }))}
              className={`w-12 h-12 rounded-xl border text-sm font-bold transition-all ${
                (form.targetSections ?? []).includes(s)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Attachment URL</label>
        <input
          type="url"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://drive.google.com/..."
          value={form.attachmentUrl ?? ''}
          onChange={e => setForm(f => ({ ...f, attachmentUrl: e.target.value }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Attachment Name</label>
        <input
          type="text"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Internal Assessment Schedule.pdf"
          value={form.attachmentName ?? ''}
          onChange={e => setForm(f => ({ ...f, attachmentName: e.target.value }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Reference Link</label>
        <input
          type="url"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
          value={form.referenceLink ?? ''}
          onChange={e => setForm(f => ({ ...f, referenceLink: e.target.value }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Expiry Date</label>
        <input
          type="datetime-local"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.expiryDate ?? ''}
          onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <div className="flex flex-wrap gap-2 mb-3">
          <CategoryBadge category={form.category ?? 'GENERAL'} />
          <PriorityBadge priority={form.priority ?? 'NORMAL'} />
          {form.isEmergency && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">🚨 EMERGENCY</span>}
          {form.isPinned && <span className="text-xs text-amber-600">📌 Pinned</span>}
          {form.acknowledgementRequired && <span className="text-xs text-blue-600">✓ Ack required</span>}
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-1">{form.title || <span className="text-gray-400 italic">No title</span>}</h3>
        {form.description && <p className="text-sm text-gray-500 mb-2">{form.description}</p>}
        <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">{form.content || <span className="text-gray-400 italic">No content</span>}</p>
      </div>
      <div className="rounded-xl border border-gray-100 p-3 text-sm text-gray-600">
        <p className="font-medium mb-1">Recipients:</p>
        <p>📍 Your entire department
          {(form.targetYears?.length ?? 0) > 0 && ` · Years: ${form.targetYears!.join(', ')}`}
          {(form.targetSemesters?.length ?? 0) > 0 && ` · Semesters: ${form.targetSemesters!.join(', ')}`}
          {(form.targetSections?.length ?? 0) > 0 && ` · Sections: ${form.targetSections!.join(', ')}`}
        </p>
        {form.attachmentUrl && <p className="mt-1">📎 Attachment: {form.attachmentName || form.attachmentUrl}</p>}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
      {publishSuccess && publishResult ? (
        <div className="w-full space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mx-auto">
            <span className="text-3xl">✅</span>
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-gray-900 dark:text-white">Circular Published</h3>
            <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1 font-bold">
              Circular No: {publishResult.circular.circularNumber || publishResult.circular.id}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-xs text-left space-y-2">
            <p className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider text-[10px]">Recipient Breakdown</p>
            <div className="grid grid-cols-3 gap-2 py-1 text-center font-bold">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                <p className="text-base font-black">{publishResult.recipients?.students ?? 0}</p>
                <p className="text-[10px]">Students</p>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                <p className="text-base font-black">{publishResult.recipients?.faculty ?? 0}</p>
                <p className="text-[10px]">Faculty</p>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                <p className="text-base font-black">{publishResult.recipients?.mentors ?? 0}</p>
                <p className="text-[10px]">Mentors</p>
              </div>
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-300 pt-1">
              Total Recipients: {publishResult.recipients?.total ?? 0}
            </p>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1 text-[11px] text-gray-500">
              <p>• In-app notifications: <span className="font-bold text-emerald-600">{publishResult.notifications?.inAppCreated ?? publishResult.recipients?.total} created</span></p>
              <p>• Native notifications: <span className="font-bold text-blue-600">{publishResult.notifications?.pushQueued ?? publishResult.recipients?.total} queued</span></p>
              {publishResult.notifications?.pushUnavailable > 0 && (
                <p className="text-amber-600 font-semibold">• {publishResult.notifications.pushUnavailable} users do not have an active notification device.</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={resetWizard}
              className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs dark:bg-white dark:text-gray-900 hover:bg-gray-800"
            >
              Done & Close
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <Send className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">Ready to Publish</h3>
          <p className="text-xs text-gray-500 max-w-sm">
            Click Publish to dispatch this circular. The backend will verify active department recipients and queue native push notifications.
          </p>
          {publishError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-xl border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 w-full text-left space-y-2">
              <p className="font-bold">{publishError}</p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep(1)} className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-[11px] font-bold">
                  Edit Recipients
                </button>
                <button onClick={handlePublish} className="px-3 py-1 bg-red-600 text-white rounded-lg text-[11px] font-bold">
                  Try Again
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  const canProceed = () => {
    if (step === 0) return form.title.trim().length >= 3 && form.content.trim().length >= 1;
    return true;
  };

  // ─── Main Render ──────────────────────────────────────────────

  return (
    <main className="mx-auto min-h-full w-full max-w-[1440px] space-y-5 pb-10">
      <header className="flex flex-col gap-5 rounded-[1.75rem] border border-border/70 bg-card p-6 md:flex-row md:items-end md:justify-between md:p-8">
        <div>
          <p className="text-sm font-semibold text-primary">Department communication</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] md:text-3xl">Circulars</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Publish department notices, track what needs attention, and manage previous circulars from one workspace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={refresh} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold transition hover:border-primary/45 hover:text-primary active:scale-[.98] disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
          <button onClick={() => { setShowWizard(true); setStep(0); setForm(emptyForm()); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[.98]"><Plus className="h-4 w-4" />New circular</button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Circular summary">
        <article className="rounded-2xl bg-muted/45 p-5"><p className="text-sm text-muted-foreground">All circulars</p><p className="mt-3 text-3xl font-extrabold tabular-nums">{circulars.length}</p></article>
        <article className="rounded-2xl bg-muted/45 p-5"><p className="text-sm text-muted-foreground">Unread</p><p className="mt-3 text-3xl font-extrabold tabular-nums text-primary">{unreadCount}</p></article>
        <article className="rounded-2xl bg-muted/45 p-5"><p className="text-sm text-muted-foreground">Pinned</p><p className="mt-3 text-3xl font-extrabold tabular-nums">{circulars.filter(c => c.isPinned).length}</p></article>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">{(['ALL', 'UNREAD', 'PINNED', 'URGENT'] as const).map(value => <button key={value} onClick={() => setFilter(value)} className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition ${filter === value ? 'bg-foreground text-background' : 'bg-muted/55 text-muted-foreground hover:text-foreground'}`}>{value === 'ALL' ? 'All' : value === 'UNREAD' ? 'Unread' : value === 'PINNED' ? 'Pinned' : 'Urgent'}</button>)}</div>
          <label className="relative w-full lg:w-80"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><span className="sr-only">Search circulars</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search title, number or author" className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
        </div>

      <div>
        {/* Loading */}
        {loading && (
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-muted/45 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl border border-danger/25 bg-danger-light/20 py-12 text-center" role="alert">
            <p className="mb-3 text-sm text-muted-foreground">{error}</p>
            <button onClick={refresh} className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background">Retry</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && visibleCirculars.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <FileText className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
            <p className="font-semibold">{circulars.length ? 'No matching circulars' : 'No circulars yet'}</p>
            <p className="mt-1 text-sm text-muted-foreground">{circulars.length ? 'Change the search or filter to see more results.' : 'Publish a circular when your department has an update.'}</p>
          </div>
        )}

        {/* List */}
        {!loading && visibleCirculars.length > 0 && (
          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            {visibleCirculars.map(c => <div key={c.id} className="relative"><CircularCard circular={c} onClick={handleOpen} /><div className="absolute bottom-4 right-4 flex items-center gap-1"><button type="button" onClick={(event) => { event.stopPropagation(); setPendingAction({ circular: c, action: 'clear' }); }} className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Clear from my feed"><CheckCheck className="h-4 w-4" /></button>{c.authorId === user?.id && c.status === 'DRAFT' && <button type="button" onClick={(event) => { event.stopPropagation(); setPendingAction({ circular: c, action: 'delete' }); }} className="rounded-lg p-2 text-muted-foreground transition hover:bg-danger-light hover:text-danger" title="Delete draft"><Trash2 className="h-4 w-4" /></button>}{c.authorId === user?.id && c.status === 'PUBLISHED' && <button type="button" onClick={(event) => { event.stopPropagation(); setPendingAction({ circular: c, action: 'cancel' }); }} className="rounded-lg p-2 text-muted-foreground transition hover:bg-danger-light hover:text-danger" title="Cancel published circular"><Archive className="h-4 w-4" /></button>}</div></div>)}
          </div>
        )}
      </div>
      </section>

      {/* Detail Sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-2xl sm:mx-4 sm:rounded-2xl max-h-[90vh] rounded-t-2xl overflow-hidden shadow-2xl">
            <CircularDetail
              circular={selected}
              onClose={() => setSelected(null)}
              onAcknowledge={handleAcknowledge}
              acknowledging={acknowledging}
            />
          </div>
        </div>
      )}

      {pendingAction && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="circular-action-title" className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-danger">Confirm action</p><h2 id="circular-action-title" className="mt-1 text-xl font-bold">{pendingAction.action === 'clear' ? 'Clear circular?' : pendingAction.action === 'delete' ? 'Delete this draft?' : 'Cancel published circular?'}</h2></div><button onClick={() => setPendingAction(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close confirmation"><X className="h-4 w-4" /></button></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{pendingAction.action === 'clear' ? 'This removes the circular from your personal feed only.' : pendingAction.action === 'delete' ? 'The draft will be permanently deleted.' : 'Recipients will no longer see this published circular as active.'}</p><p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm font-semibold">{pendingAction.circular.title}</p><div className="mt-6 flex justify-end gap-2"><button onClick={() => setPendingAction(null)} disabled={actionBusy} className="rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-muted">Keep it</button><button onClick={runPendingAction} disabled={actionBusy} className="rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-danger-foreground disabled:opacity-60">{actionBusy ? 'Working...' : pendingAction.action === 'clear' ? 'Clear' : pendingAction.action === 'delete' ? 'Delete draft' : 'Cancel circular'}</button></div></section></div>}

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg sm:mx-4 bg-white dark:bg-gray-900 sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Wizard Header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 dark:text-white">New Department Circular</h2>
                <button onClick={resetWizard} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-gray-400 text-xl leading-none">×</span>
                </button>
              </div>
              {/* Step Progress */}
              <div className="flex items-center gap-1">
                {WIZARD_STEPS.map((label, i) => (
                  <React.Fragment key={label}>
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < step ? 'bg-emerald-500 text-white' :
                      i === step ? 'bg-blue-600 text-white' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    {i < WIZARD_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 rounded transition-all ${i < step ? 'bg-emerald-400' : 'bg-gray-100'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Step {step + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[step]}</p>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {stepContent[step]()}
            </div>

            {/* Wizard Navigation */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              <div className="flex-1" />
              {step < WIZARD_STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-1 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.97] transition-all disabled:opacity-50"
                >
                  {step === 3 ? <><Eye className="w-4 h-4" /> Preview</> : <>Next <ChevronRight className="w-4 h-4" /></>}
                </button>
              ) : !publishSuccess ? (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-[0.97] transition-all disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {publishing ? 'Publishing...' : 'Publish Circular'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
