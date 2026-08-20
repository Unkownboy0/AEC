import React, { useMemo } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '../../../design-system/components/PageHeader/PageHeader';
import { MetricCard } from '../../../design-system/components/MetricCard/MetricCard';
import { QuickActionCard } from '../../../design-system/components/QuickActionCard/QuickActionCard';
import { SectionHeader } from '../../../design-system/components/SectionHeader/SectionHeader';

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD PATTERN — CampusOS Design System Pattern
   
   Standard layout for role dashboards:
   1. Greeting Header
   2. Quick Actions Grid (6-8 max)
   3. Key Metric Cards (4-6 max)
   4. Today's Work / Main Content
   5. Secondary Alerts / Activity
   ═══════════════════════════════════════════════════════════════════ */

export interface DashboardMetric {
  id: string;
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  subtitle?: string;
  onClick?: () => void;
}

export interface DashboardQuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  onClick: () => void;
  badge?: string | number;
  variant?: 'default' | 'primary';
}

export interface DashboardPatternProps {
  greeting?: string;
  userName?: string;
  roleTitle?: string;
  quickActions?: DashboardQuickAction[];
  metrics?: DashboardMetric[];
  mainContent?: React.ReactNode;
  secondaryContent?: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
}

export const DashboardPattern: React.FC<DashboardPatternProps> = ({
  greeting = 'Welcome back',
  userName,
  roleTitle,
  quickActions = [],
  metrics = [],
  mainContent,
  secondaryContent,
  headerAction,
  className,
}) => {
  const formattedGreeting = useMemo(() => {
    if (userName) return `${greeting}, ${userName}`;
    return greeting;
  }, [greeting, userName]);

  return (
    <div className={clsx('space-y-6 md:space-y-8', className)}>
      {/* 1. Header & Greeting (Desktop only — mobile header provides identity) */}
      <div className="hidden lg:block">
        <PageHeader
          title={formattedGreeting}
          description={roleTitle ? `Here is your overview for today as ${roleTitle}.` : 'Here is your summary and daily priorities.'}
          action={headerAction}
        />
      </div>

      {/* 2. Key Metrics Grid */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {metrics.slice(0, 6).map((metric) => (
            <MetricCard key={metric.id} {...metric} />
          ))}
        </div>
      )}

      {/* 3. Quick Actions */}
      {quickActions.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="Quick Actions" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {quickActions.slice(0, 8).map((action) => (
              <QuickActionCard key={action.id} {...action} />
            ))}
          </div>
        </div>
      )}

      {/* 4. Main & Secondary Layout */}
      {(mainContent || secondaryContent) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className={clsx('space-y-6', secondaryContent ? 'lg:col-span-2' : 'lg:col-span-3')}>
            {mainContent}
          </div>
          {secondaryContent && (
            <div className="space-y-6">
              {secondaryContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

DashboardPattern.displayName = 'DashboardPattern';
export default DashboardPattern;
