import React, { useState } from 'react';
import { Circular } from '../types/circular.types';
import { PriorityBadge, CategoryBadge, StatusBadge, AcknowledgedBadge, EmergencyBadge } from './CircularBadge';
import {
  X, Paperclip, ExternalLink, User, Calendar, Clock,
  CheckCircle2, Users, Building2, FileText,
} from 'lucide-react';

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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-start justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex flex-wrap gap-2 mb-2">
            {circular.isEmergency ? <EmergencyBadge /> : <CategoryBadge category={circular.category} />}
            <PriorityBadge priority={circular.priority} />
            <StatusBadge status={circular.status} />
            {circular.isPinned && <span className="text-xs text-amber-600 font-medium">📌 Pinned</span>}
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{circular.title}</h2>
          <p className="text-xs text-gray-400 font-mono mt-1">#{circular.circularNumber}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50">
          {/* Publisher */}
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Published by</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {circular.author ? `${circular.author.firstName} ${circular.author.lastName}` : 'Unknown'}
              </p>
              <p className="text-xs text-gray-500">{circular.publishedAs}</p>
            </div>
          </div>

          {/* Department */}
          {circular.department && (
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Department</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{circular.department.name}</p>
                <p className="text-xs text-gray-500">{circular.department.code}</p>
              </div>
            </div>
          )}

          {/* Published At */}
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Published</p>
              <p className="text-sm text-gray-700 dark:text-gray-200">{formatDate(circular.publishedAt)}</p>
            </div>
          </div>

          {/* Expiry */}
          {circular.expiryDate && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Expires</p>
                <p className="text-sm text-gray-700 dark:text-gray-200">{formatDate(circular.expiryDate)}</p>
              </div>
            </div>
          )}

          {/* Audience */}
          <div className="flex items-start gap-2 sm:col-span-2">
            <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Target Audience</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 capitalize">
                {circular.broadcastLevel?.replace(/_/g, ' ').toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {circular.description && (
          <div className="px-4 pt-4">
            <p className="text-sm text-gray-500 italic border-l-2 border-blue-200 pl-3 py-1">
              {circular.description}
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="p-4">
          <div
            className="prose prose-sm max-w-none text-gray-700 dark:text-gray-200 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: circular.content.replace(/\n/g, '<br/>') }}
          />
        </div>

        {/* Attachment */}
        {circular.attachmentUrl && (
          <div className="mx-4 mb-4 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-gray-50 dark:bg-gray-800">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Paperclip className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                {circular.attachmentName ?? 'Attachment'}
              </p>
              <p className="text-xs text-gray-400">Document</p>
            </div>
            <a
              href={circular.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Reference Link */}
        {circular.referenceLink && (
          <div className="mx-4 mb-4">
            <a
              href={circular.referenceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Reference Link
            </a>
          </div>
        )}

        {/* Read status */}
        <div className="px-4 pb-2">
          {circular.userReadAt && (
            <p className="text-xs text-gray-400">
              ✓ Read on {formatDate(circular.userReadAt)}
            </p>
          )}
          {ackDone && circular.userAcknowledgedAt && (
            <p className="text-xs text-emerald-600 mt-0.5">
              ✓ Acknowledged on {formatDate(circular.userAcknowledgedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      {circular.acknowledgementRequired && !ackDone && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={handleAck}
            disabled={acknowledging}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <CheckCircle2 className="w-5 h-5" />
            {acknowledging ? 'Acknowledging...' : 'Acknowledge & Confirm Read'}
          </button>
        </div>
      )}
      {ackDone && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm">You have acknowledged this circular</span>
          </div>
        </div>
      )}
    </div>
  );
};
