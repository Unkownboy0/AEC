import React, { useState } from 'react';
import { Circular } from '../types/circular.types';
import { PriorityBadge, CategoryBadge, StatusBadge, AcknowledgedBadge, EmergencyBadge } from './CircularBadge';
import {
  X, Paperclip, ExternalLink, User, Calendar, Clock,
  CheckCircle2, Users, Building2, FileText, Globe, ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

interface CircularDetailProps {
  circular: Circular;
  onClose?: () => void;
  onAcknowledge?: (id: string) => void;
  acknowledging?: boolean;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatBroadcastLevel(level?: string): string {
  switch (level) {
    case 'ALL_CAMPUS': return 'Entire Institution';
    case 'FACULTY_ONLY': return 'Faculty & Staff Only';
    case 'STUDENT_ONLY': return 'All Students';
    case 'HOD_ONLY': return 'HODs Only';
    case 'DEPARTMENT_SPECIFIC': return 'Specific Departments';
    case 'SELECTED_USERS': return 'Selected Recipients';
    default: return level ? level.replace(/_/g, ' ') : 'Institution Notice';
  }
}

export const CircularDetail: React.FC<CircularDetailProps> = ({
  circular,
  onClose,
  onAcknowledge,
  acknowledging = false,
}) => {
  const [ackDone, setAckDone] = useState(circular.isAcknowledged);

  const handleAck = async () => {
    if (ackDone) return;
    await onAcknowledge?.(circular.id);
    setAckDone(true);
  };

  const authorName = circular.author
    ? `${circular.author.firstName || ''} ${circular.author.lastName || ''}`.trim()
    : (circular.publishedAs || circular.authorRole || 'Principal Office');

  return (
    <div className="flex flex-col h-full bg-surface rounded-2xl overflow-hidden border border-border shadow-modal">
      {/* Top Bar */}
      <div className="flex items-start justify-between p-5 border-b border-border">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex flex-wrap gap-2 mb-2.5">
            {circular.isEmergency ? <EmergencyBadge /> : <CategoryBadge category={circular.category} />}
            <PriorityBadge priority={circular.priority} />
            <StatusBadge status={circular.status} />
            {circular.isPinned && <span className="text-xs text-amber-500 font-bold">📌 Pinned</span>}
          </div>
          <h2 className="text-lg font-bold text-text-primary leading-snug">{circular.title}</h2>
          {circular.circularNumber && (
            <p className="text-xs font-mono font-bold text-primary bg-primary-soft/50 inline-block px-2 py-0.5 rounded-md mt-1.5">
              {circular.circularNumber}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl hover:bg-surface-soft text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-surface-soft border-b border-border">
          {/* Publisher */}
          <div className="flex items-start gap-2.5">
            <User className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-text-muted uppercase font-bold tracking-wider mb-0.5">Published by</p>
              <p className="text-xs font-bold text-text-primary">{authorName}</p>
              <p className="text-[11px] text-text-muted">{circular.publishedAs || 'Executive Office'}</p>
            </div>
          </div>

          {/* Scope / Department */}
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-text-muted uppercase font-bold tracking-wider mb-0.5">Scope / Department</p>
              <p className="text-xs font-bold text-text-primary">
                {circular.broadcastLevel === 'DEPARTMENT_SPECIFIC' && circular.department?.name
                  ? circular.department.name
                  : 'Institution-wide'}
              </p>
              <p className="text-[11px] text-text-muted">
                {circular.broadcastLevel === 'DEPARTMENT_SPECIFIC' && circular.department?.code
                  ? circular.department.code
                  : 'INST'}
              </p>
            </div>
          </div>

          {/* Published At */}
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-text-muted uppercase font-bold tracking-wider mb-0.5">Published Date & Time</p>
              <p className="text-xs text-text-secondary font-medium">
                {formatDate(circular.publishedAt ?? circular.publishDate ?? circular.createdAt)}
              </p>
            </div>
          </div>

          {/* Audience */}
          <div className="flex items-start gap-2.5">
            <Users className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-text-muted uppercase font-bold tracking-wider mb-0.5">Target Audience</p>
              <p className="text-xs font-bold text-primary">{formatBroadcastLevel(circular.broadcastLevel)}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {circular.description && (
          <div className="px-5 pt-4">
            <p className="text-xs text-text-secondary italic border-l-2 border-primary pl-3 py-1.5 bg-surface-soft/60 rounded-r-lg">
              {circular.description}
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="p-5">
          <div
            className="prose prose-sm max-w-none text-text-primary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: circular.content.replace(/\n/g, '<br/>') }}
          />
        </div>

        {/* Attachment */}
        {circular.attachmentUrl && (
          <div className="mx-5 mb-4 p-3.5 rounded-xl border border-border flex items-center gap-3 bg-surface-soft">
            <div className="w-9 h-9 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
              <Paperclip className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">
                {circular.attachmentName ?? 'Attachment Document'}
              </p>
              <p className="text-[11px] text-text-muted">Document</p>
            </div>
            <a
              href={circular.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-primary-soft text-primary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Reference Link */}
        {circular.referenceLink && (
          <div className="mx-5 mb-4">
            <a
              href={circular.referenceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Reference Link
            </a>
          </div>
        )}

        {/* Read status */}
        <div className="px-5 pb-3">
          {circular.userReadAt && (
            <p className="text-xs text-text-muted font-medium">
              ✓ Read on {formatDate(circular.userReadAt)}
            </p>
          )}
          {ackDone && circular.userAcknowledgedAt && (
            <p className="text-xs text-success font-bold mt-0.5">
              ✓ Acknowledged on {formatDate(circular.userAcknowledgedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      {circular.acknowledgementRequired && !ackDone && (
        <div className="p-4 border-t border-border bg-surface">
          <button
            onClick={handleAck}
            disabled={acknowledging}
            type="button"
            className="w-full py-3 rounded-xl bg-success text-white font-bold flex items-center justify-center gap-2 hover:bg-success/90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            {acknowledging ? 'Acknowledging...' : 'Acknowledge & Confirm Read'}
          </button>
        </div>
      )}
      {ackDone && (
        <div className="p-4 border-t border-border bg-surface">
          <div className="flex items-center justify-center gap-2 text-success font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>You have acknowledged this circular</span>
          </div>
        </div>
      )}
    </div>
  );
};
