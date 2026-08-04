import React from 'react';
import { UserCheck, ShieldAlert } from 'lucide-react';

interface ActorAttributionLabelProps {
  actorName: string;
  actorRole: string;
  performedAsRole?: string;
  actionType: 'APPROVED' | 'REJECTED' | 'UPLOADED' | 'PUBLISHED' | string;
  timestamp?: string;
}

export const ActorAttributionLabel: React.FC<ActorAttributionLabelProps> = ({
  actorName,
  actorRole,
  performedAsRole,
  actionType,
  timestamp
}) => {
  const isActingPrincipal = performedAsRole === 'ACTING_PRINCIPAL' || actorRole.includes('Acting Principal');

  const actionVerb = 
    actionType === 'APPROVED' ? 'Approved' :
    actionType === 'REJECTED' ? 'Rejected' :
    actionType === 'UPLOADED' ? 'Uploaded' :
    actionType === 'PUBLISHED' ? 'Published' : actionType;

  return (
    <div className="inline-flex flex-col p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 space-y-1">
      <div className="flex items-center gap-1.5 font-bold">
        <UserCheck className="w-4 h-4 text-violet-400" />
        <span>{actionVerb} by</span>
        <strong className="text-white font-extrabold">{actorName}</strong>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300 font-semibold pl-5">
        <span className="px-2 py-0.5 rounded bg-violet-600/30 text-violet-300 border border-violet-500/30 font-extrabold">
          {isActingPrincipal ? 'Vice Principal — Acting Principal' : actorRole}
        </span>

        {isActingPrincipal && (
          <span className="text-[10px] text-amber-300 font-bold italic">
            (Performed under active Principal delegation)
          </span>
        )}
      </div>

      {timestamp && (
        <span className="text-[10px] text-slate-400 pl-5 font-mono">
          {new Date(timestamp).toLocaleString()}
        </span>
      )}
    </div>
  );
};
