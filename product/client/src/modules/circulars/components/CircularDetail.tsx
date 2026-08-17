import React, { useState } from 'react';
import { Circular } from '../types/circular.types';
import { PriorityBadge, CategoryBadge, StatusBadge, EmergencyBadge } from './CircularBadge';
import { X, Paperclip, ExternalLink, User, Clock, Users, Building2, Eye, Loader2 } from 'lucide-react';
import { downloadAndOpen } from '../../../platform/download';
import { toast } from '../../../components/ui/Toast';

interface CircularDetailProps {
  circular: Circular;
  onClose?: () => void;
  onAcknowledge?: (id: string) => void;
  acknowledging?: boolean;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Not specified';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatBroadcastLevel(level?: string): string {
  const labels: Record<string, string> = {
    ALL_CAMPUS: 'Entire institution',
    FACULTY_ONLY: 'Faculty and staff',
    STUDENT_ONLY: 'All students',
    HOD_ONLY: 'Heads of department',
    DEPARTMENT_SPECIFIC: 'Specified departments',
    SELECTED_USERS: 'Selected recipients',
  };
  return labels[level || ''] || (level ? level.replace(/_/g, ' ') : 'Institution notice');
}

export const CircularDetail: React.FC<CircularDetailProps> = ({ circular, onClose }) => {
  const [downloadingAttachment, setDownloadingAttachment] = useState(false);

  const handleDownloadAttachment = async () => {
    if (!circular.attachmentUrl || downloadingAttachment) return;
    setDownloadingAttachment(true);
    const result = await downloadAndOpen(circular.attachmentUrl, circular.attachmentName || 'circular-attachment');
    setDownloadingAttachment(false);
    if (!result.success) toast.error(result.error || 'Unable to download file.');
  };

  const authorName = circular.author
    ? `${circular.author.firstName || ''} ${circular.author.lastName || ''}`.trim()
    : (circular.publishedAs || circular.authorRole || 'Principal Office');

  const meta = [
    {
      label: 'Published by',
      value: authorName,
      detail: circular.publishedAs || 'Executive office',
      Icon: User,
    },
    {
      label: 'Scope / department',
      value: circular.broadcastLevel === 'DEPARTMENT_SPECIFIC' && circular.department?.name
        ? circular.department.name : 'Institution-wide',
      detail: circular.department?.code || 'All campus',
      Icon: Building2,
    },
    {
      label: 'Published',
      value: formatDate(circular.publishedAt ?? circular.publishDate ?? circular.createdAt),
      detail: 'Local campus time',
      Icon: Clock,
    },
    {
      label: 'Audience',
      value: formatBroadcastLevel(circular.broadcastLevel),
      detail: 'Authorized recipients',
      Icon: Users,
    },
  ];

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white shadow-[0_24px_80px_-36px_rgba(15,23,42,0.38)] dark:border-slate-800 dark:bg-[#10141d]">
      <header className="flex items-start justify-between border-b border-slate-200/70 px-5 py-6 sm:px-8 sm:py-8 dark:border-slate-800">
        <div className="min-w-0 flex-1 pr-3">
          <div className="mb-4 flex flex-wrap gap-2">
            {circular.isEmergency ? <EmergencyBadge /> : <CategoryBadge category={circular.category} />}
            <PriorityBadge priority={circular.priority} />
            <StatusBadge status={circular.status} />
            {circular.isPinned && <span className="text-xs font-semibold text-amber-600">Pinned notice</span>}
          </div>
          <h1 className="max-w-2xl text-2xl font-bold leading-tight tracking-[-0.035em] text-slate-950 sm:text-3xl dark:text-white">
            {circular.title}
          </h1>
          {circular.circularNumber && (
            <p className="mt-3 inline-flex rounded-md bg-indigo-50 px-2 py-1 font-mono text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              {circular.circularNumber}
            </p>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} type="button" aria-label="Close circular" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </header>

      <section className="grid grid-cols-1 gap-px border-b border-slate-200/70 bg-slate-200/70 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800">
        {meta.map(({ label, value, detail, Icon }) => (
          <div key={label} className="flex items-start gap-3 bg-slate-50/90 p-5 sm:p-6 dark:bg-[#0d1119]">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">{value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
            </div>
          </div>
        ))}
      </section>

      {circular.description && (
        <div className="px-5 pt-7 sm:px-8 sm:pt-9">
          <p className="max-w-3xl border-l-2 border-indigo-500 pl-4 text-sm italic leading-6 text-slate-600 dark:text-slate-300">
            {circular.description}
          </p>
        </div>
      )}

      <div className="px-5 py-8 sm:px-8 sm:py-10">
        <div className="prose prose-slate max-w-3xl text-[0.95rem] leading-7 dark:prose-invert" dangerouslySetInnerHTML={{ __html: circular.content.replace(/\n/g, '<br/>') }} />
      </div>

      {circular.attachmentUrl && (
        <div className="mx-5 mb-7 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 sm:mx-8 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            <Paperclip className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{circular.attachmentName ?? 'Circular attachment'}</p>
            <p className="text-xs text-slate-500">Download or open document</p>
          </div>
          <button
            type="button"
            onClick={handleDownloadAttachment}
            disabled={downloadingAttachment}
            aria-label="Download circular attachment"
            className="rounded-xl p-2 text-indigo-600 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:hover:bg-indigo-500/15"
          >
            {downloadingAttachment ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          </button>
        </div>
      )}

      {circular.referenceLink && (
        <div className="mx-5 mb-7 sm:mx-8">
          <a href={circular.referenceLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <ExternalLink className="h-4 w-4" /> Reference link
          </a>
        </div>
      )}

      <footer className="flex items-center gap-2 border-t border-slate-100 px-5 py-4 text-xs font-medium text-emerald-600 sm:px-8 dark:border-slate-800 dark:text-emerald-400">
        <Eye className="h-4 w-4" />
        <span>Viewed automatically when opened{circular.userReadAt ? ` · ${formatDate(circular.userReadAt)}` : ''}</span>
      </footer>
    </article>
  );
};
