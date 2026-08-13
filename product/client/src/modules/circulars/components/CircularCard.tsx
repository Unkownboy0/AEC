import React from 'react';
import { Circular } from '../types/circular.types';
import { PriorityBadge, CategoryBadge, UnreadDot, EmergencyBadge } from './CircularBadge';
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
        'group relative h-full overflow-hidden bg-surface rounded-2xl border transition-all duration-200 cursor-pointer p-5',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 active:translate-y-0',
        isUnread ? 'border-primary/30 shadow-xs' : 'border-border',
        circular.isEmergency && 'border-danger/40 bg-danger-light/30'
      )}
    >
      {/* Unread indicator strip */}
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
      )}

      <div className="flex items-start gap-3.5">
        {/* Category Icon Container */}
        <div
          className={clsx(
            'w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 mt-0.5',
            circular.isEmergency
              ? 'bg-danger-light text-danger border-danger/20'
              : 'bg-primary-soft text-primary border-primary/15'
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
            </div>
          </div>

          {/* Title */}
          <h3
            className={clsx(
              'text-base font-semibold tracking-tight leading-snug mb-1.5 line-clamp-2',
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
            <p className="text-sm text-text-muted line-clamp-2 mb-3 leading-relaxed">
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

          </div>
        </div>
      </div>
    </div>
  );
};
