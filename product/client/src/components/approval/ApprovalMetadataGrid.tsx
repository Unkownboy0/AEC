import React from 'react';
import { ApprovalMetadataField } from './ApprovalTypes';

interface ApprovalMetadataGridProps {
  fields: ApprovalMetadataField[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const ApprovalMetadataGrid: React.FC<ApprovalMetadataGridProps> = ({
  fields,
  columns = 4,
  className = '',
}) => {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns];

  if (!fields || fields.length === 0) return null;

  return (
    <div
      className={`grid ${colClass} gap-3 sm:gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100/80 dark:border-gray-800/80 text-xs ${className}`}
    >
      {fields.map((field, idx) => (
        <div key={idx} className="space-y-0.5">
          <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {field.label}
          </p>
          <div
            className={`font-bold ${
              field.isHighlight
                ? 'text-blue-600 dark:text-blue-400 text-sm'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {field.value}
          </div>
          {field.hint && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500">{field.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
};
