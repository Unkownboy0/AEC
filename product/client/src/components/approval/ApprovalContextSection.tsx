import React from 'react';
import { ApprovalContextCard } from './ApprovalTypes';
import { Layers } from 'lucide-react';

interface ApprovalContextSectionProps {
  cards?: ApprovalContextCard[];
  className?: string;
}

export const ApprovalContextSection: React.FC<ApprovalContextSectionProps> = ({
  cards,
  className = '',
}) => {
  if (!cards || cards.length === 0) return null;

  const badgeVariantMap: Record<string, string> = {
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    red: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {cards.map((card) => (
        <div
          key={card.id}
          className="p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50 space-y-3.5"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {card.icon || <Layers className="w-4 h-4 text-purple-600" />}
              <span>{card.title}</span>
            </h3>

            {card.badge && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  badgeVariantMap[card.badge.variant || 'purple']
                }`}
              >
                {card.badge.label}
              </span>
            )}
          </div>

          {card.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{card.description}</p>
          )}

          {card.customContent && <div>{card.customContent}</div>}

          {card.items && card.items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {card.items.map((item, iIdx) => (
                <div
                  key={iIdx}
                  className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/70 dark:border-gray-700/60 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-1.5 truncate">
                      {item.tag && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          {item.tag}
                        </span>
                      )}
                      <span className="font-bold text-gray-800 dark:text-gray-200 truncate">
                        {item.label}
                      </span>
                    </div>
                    {item.subValue && (
                      <p className="text-[10px] text-gray-400">{item.subValue}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-purple-600 dark:text-purple-400">
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
