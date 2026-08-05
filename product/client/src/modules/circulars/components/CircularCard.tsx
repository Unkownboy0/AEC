import React from 'react';
import { Circular } from '../types/circular.types';
import { PriorityBadge, CategoryBadge, UnreadDot, AcknowledgedBadge, EmergencyBadge } from './CircularBadge';
import { FileText, Paperclip, Clock, User } from 'lucide-react';

interface CircularCardProps {
  circular: Circular;
  onClick: (circular: Circular) => void;
  onAcknowledge?: (id: string) => void;
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const CircularCard: React.FC<CircularCardProps> = ({ circular, onClick, onAcknowledge }) => {
  const isUnread = !circular.isRead;

  return (
    <div
      onClick={() => onClick(circular)}
      className={`
        relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer
        hover:shadow-md hover:border-blue-200 active:scale-[0.99]
        ${isUnread ? 'border-blue-100 shadow-sm' : 'border-gray-100'}
        ${circular.isEmergency ? 'border-red-200 bg-red-50/30' : ''}
      `}
      style={{ padding: '16px' }}
    >
      {/* Unread indicator strip */}
      {isUnread && (
        <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r-full" />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
          ${circular.isEmergency ? 'bg-red-100' : 'bg-blue-50'}
        `}>
          <FileText className={`w-5 h-5 ${circular.isEmergency ? 'text-red-600' : 'text-blue-600'}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {circular.isEmergency && <EmergencyBadge />}
              {!circular.isEmergency && <CategoryBadge category={circular.category} />}
              <PriorityBadge priority={circular.priority} />
              {circular.isPinned && (
                <span className="text-xs text-amber-600 font-medium">📌 Pinned</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isUnread && <UnreadDot />}
              {circular.isAcknowledged && <AcknowledgedBadge />}
            </div>
          </div>

          {/* Title */}
          <h3 className={`text-sm font-semibold leading-tight mb-1 line-clamp-2 ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
            {circular.title}
          </h3>

          {/* Circular number */}
          <p className="text-xs text-gray-400 mb-2 font-mono">#{circular.circularNumber}</p>

          {/* Publisher */}
          <div className="flex items-center gap-1 mb-2">
            <User className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {circular.author ? `${circular.author.firstName} ${circular.author.lastName}` : 'Unknown'}
              {' · '}
              <span className="text-gray-400">{circular.publishedAs}</span>
              {circular.department && (
                <span className="text-gray-400"> — {circular.department.name}</span>
              )}
            </span>
          </div>

          {/* Description preview */}
          {circular.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{circular.description}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {formatTime(circular.publishedAt ?? circular.createdAt)}
              </span>
              {circular.attachmentUrl && (
                <span className="flex items-center gap-1 text-xs text-blue-500">
                  <Paperclip className="w-3 h-3" />
                  Attachment
                </span>
              )}
            </div>

            {/* Acknowledge button */}
            {circular.acknowledgementRequired && !circular.isAcknowledged && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onAcknowledge?.(circular.id);
                }}
                className="text-xs px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium transition-colors active:scale-95"
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
