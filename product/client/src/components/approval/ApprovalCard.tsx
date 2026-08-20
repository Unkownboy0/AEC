import React from 'react';
import { ApprovalViewModel, ApprovalActionDef } from './ApprovalTypes';
import { ApprovalStatusBadge, ApprovalPriorityBadge } from './ApprovalStatusBadge';
import { Calendar, User, Clock, ChevronRight, Building2 } from 'lucide-react';
import { Avatar } from '../../design-system/primitives/Avatar/Avatar';
import { resolveAssetUrl } from '../../utils/assets';

interface ApprovalCardProps {
  request: ApprovalViewModel;
  onClick?: () => void;
  onQuickAction?: (action: ApprovalActionDef, request: ApprovalViewModel) => void;
  className?: string;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  request,
  onClick,
  onQuickAction,
  className = '',
}) => {
  const typeVariantClasses = {
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  }[request.typeVariant || 'purple'];

  const avatarUrl = request.requester.avatarUrl ? resolveAssetUrl(request.requester.avatarUrl) : undefined;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3.5 group ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar
            src={avatarUrl}
            name={request.requester.name}
            size="md"
            className="w-10 h-10 ring-2 ring-gray-100 dark:ring-gray-800 shadow-xs shrink-0 mt-0.5"
          />

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase ${typeVariantClasses}`}>
                {request.typeBadgeLabel || request.requestType}
              </span>

              <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                {request.requester.name}
              </span>

              <span className="text-xs text-gray-400 font-mono">
                #{request.requestNumber || request.id.slice(0, 8)}
              </span>

              <ApprovalPriorityBadge priority={request.priority} isEmergency={request.isEmergency} />
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium line-clamp-1">
              {request.title} {request.reason ? `• ${request.reason}` : ''}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              {request.requester.departmentName && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {request.requester.departmentName}
                </span>
              )}
              {request.requester.classSection && (
                <span>• {request.requester.classSection}</span>
              )}
            <span>
              • Submitted {new Date(request.submittedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        </div>
      </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-gray-800">
          <ApprovalStatusBadge status={request.status} label={request.statusLabel} size="sm" />

          {request.availableActions && request.availableActions.length > 0 && onQuickAction ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {request.availableActions.slice(0, 2).map((act) => (
                <button
                  key={act.action}
                  type="button"
                  onClick={() => onQuickAction(act, request)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
                    act.variant === 'primary'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : act.variant === 'secondary'
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {act.label}
                </button>
              ))}
            </div>
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          )}
        </div>
      </div>

      {/* Context preview chips (e.g. affected sessions or balance) if present */}
      {request.contextSections && request.contextSections.length > 0 && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-wrap gap-2">
            {request.contextSections.map((ctx) => (
              <span
                key={ctx.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800/80 text-[11px] font-semibold text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800"
              >
                {ctx.icon}
                <span>{ctx.title}</span>
                {ctx.badge && (
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                    ({ctx.badge.label})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
