import React from 'react';
import { Circular } from '../types/circular.types';
import { PriorityBadge, CategoryBadge, UnreadDot, AcknowledgedBadge, EmergencyBadge } from './CircularBadge';
import { FileText, Paperclip, Clock, User, Building2, Globe, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

interface CircularCardProps {
  circular: Circular;
  onClick: (circular: Circular) => void;
  onAcknowledge?: (id: string) => void;
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatBroadcastLevel(level?: string): { label: string; icon: any } {
  switch (level) {
    case 'ALL_CAMPUS':
      return { label: 'Entire Institution', icon: Globe };
    case 'FACULTY_ONLY':
      return { label: 'Faculty & Staff', icon: User };
    case 'STUDENT_ONLY':
      return { label: 'All Students', icon: User };
    case 'HOD_ONLY':
      return { label: 'HODs Only', icon: ShieldCheck };
    case 'DEPARTMENT_SPECIFIC':
      return { label: 'Specific Depts', icon: Building2 };
    case 'SELECTED_USERS':
      return { label: 'Selected Recipients', icon: User };
    default:
      return { label: 'Institution Notice', icon: Globe };
  }
}

export const CircularCard: React.FC<CircularCardProps> = ({ circular, onClick, onAcknowledge }) => {
  const isUnread = !circular.isRead;

  // Resolve author name cleanly (never show Unknown)
  const authorName = circular.author
    ? `${circular.author.firstName || ''} ${circular.author.lastName || ''}`.trim()
    : (circular.publishedAs || circular.authorRole || 'Principal Office');

  // Resolve department display label (avoid defaulting to Science & Humanities for all-campus circulars)
  const isDeptSpecific = circular.broadcastLevel === 'DEPARTMENT_SPECIFIC';
  const deptLabel = isDeptSpecific && circular.department?.name
    ? circular.department.name
    : 'Institution-wide';

  const broadcastInfo = formatBroadcastLevel(circular.broadcastLevel);
  const BroadcastIcon = broadcastInfo.icon;

  return (
    <div
      onClick={() => onClick(circular)}
      className={clsx(
        'relative bg-surface rounded-2xl border transition-all duration-200 cursor-pointer p-4',
        'hover:shadow-md hover:border-primary/40 active:scale-[0.995]',
        isUnread ? 'border-primary/30 shadow-xs' : 'border-border',
        circular.isEmergency && 'border-danger/40 bg-danger-light/30'
      )}
    >
      {/* Unread indicator strip */}
      {isUnread && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
      )}

      <div className="flex items-start gap-3.5">
        {/* Category Icon Container */}
        <div
          className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
            circular.isEmergency
              ? 'bg-danger-light text-danger'
              : 'bg-primary-soft text-primary'
          )}
        >
          <FileText className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Top badges row */}
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {circular.isEmergency ? (
                <EmergencyBadge />
              ) : (
                <CategoryBadge category={circular.category} />
              )}
              <PriorityBadge priority={circular.priority} />
              {circular.isPinned && (
                <span className="text-[11px] text-amber-500 dark:text-amber-400 font-bold flex items-center gap-1">
                  📌 Pinned
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isUnread && <UnreadDot />}
              {circular.isAcknowledged && <AcknowledgedBadge />}
            </div>
          </div>

          {/* Title */}
          <h3
            className={clsx(
              'text-sm font-bold tracking-tight leading-snug mb-1 line-clamp-2',
              isUnread ? 'text-text-primary' : 'text-text-secondary'
            )}
          >
            {circular.title}
          </h3>

          {/* Meta Line: Circular Number & Broadcast Scope */}
          <div className="flex items-center gap-2 text-[11px] text-text-muted mb-2 flex-wrap">
            {circular.circularNumber && (
              <span className="font-mono font-bold text-primary bg-primary-soft/50 px-2 py-0.5 rounded-md">
                {circular.circularNumber}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-soft border border-border/80 font-medium">
              <BroadcastIcon className="w-3 h-3 text-text-muted" />
              <span>{broadcastInfo.label}</span>
            </span>
          </div>

          {/* Author & Scope */}
          <div className="flex items-center gap-1.5 mb-2 text-xs text-text-secondary">
            <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="font-semibold truncate">
              {authorName}
            </span>
            <span className="text-text-muted">•</span>
            <span className="text-text-muted truncate">{deptLabel}</span>
          </div>

          {/* Description preview */}
          {circular.description && (
            <p className="text-xs text-text-muted line-clamp-2 mb-2.5 leading-relaxed">
              {circular.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-text-muted">
                <Clock className="w-3 h-3 text-text-muted" />
                {formatTime(circular.publishedAt ?? circular.publishDate ?? circular.createdAt)}
              </span>
              {circular.attachmentUrl && (
                <span className="flex items-center gap-1 text-[11px] text-primary font-semibold">
                  <Paperclip className="w-3 h-3" />
                  Attachment
                </span>
              )}
            </div>

            {/* Acknowledge button */}
            {circular.acknowledgementRequired && !circular.isAcknowledged && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAcknowledge?.(circular.id);
                }}
                className="text-xs px-3 py-1 rounded-lg bg-success-light text-success border border-success/30 hover:bg-success/20 font-bold transition-colors active:scale-95"
              >
                Acknowledge
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
