import React from 'react';
import { ApprovalRequester } from './ApprovalTypes';
import { User, Mail, Phone, Building2, GraduationCap, IdCard } from 'lucide-react';

import { resolveAssetUrl } from '../../utils/assets';

interface ApprovalRequesterCardProps {
  requester: ApprovalRequester;
  className?: string;
}

export const ApprovalRequesterCard: React.FC<ApprovalRequesterCardProps> = ({
  requester,
  className = '',
}) => {
  const initials = requester.name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const avatar = requester.avatarUrl ? resolveAssetUrl(requester.avatarUrl) : null;

  return (
    <div className={`p-4 sm:p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3.5">
        {avatar ? (
          <img
            src={avatar}
            alt={requester.name}
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-gray-100 dark:ring-gray-800"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
            {initials}
          </div>
        )}

        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {requester.name}
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
              {requester.role}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            {requester.departmentName && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                {requester.departmentName}
              </span>
            )}
            {requester.classSection && (
              <span className="inline-flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                {requester.classSection}
              </span>
            )}
            {(requester.admissionNo || requester.employeeId) && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-400">
                <IdCard className="w-3.5 h-3.5" />
                {requester.admissionNo || requester.employeeId}
              </span>
            )}
          </div>
        </div>
      </div>

      {(requester.email || requester.phone) && (
        <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 text-xs text-gray-500 dark:text-gray-400 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
          {requester.email && (
            <a
              href={`mailto:${requester.email}`}
              className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              {requester.email}
            </a>
          )}
          {requester.phone && (
            <a
              href={`tel:${requester.phone}`}
              className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors font-mono"
            >
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              {requester.phone}
            </a>
          )}
        </div>
      )}
    </div>
  );
};
