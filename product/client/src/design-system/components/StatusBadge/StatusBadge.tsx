import React from 'react';
import { clsx } from 'clsx';
import { Badge } from '../../primitives/Badge/Badge';

/* ═══════════════════════════════════════════════════════════════════
   STATUS BADGE — CampusOS Design System Component
   
   Maps backend status enums to human-readable labels with
   semantic colors. Never shows raw enum values.
   ═══════════════════════════════════════════════════════════════════ */

export type WorkflowStatus =
  | 'draft'
  | 'submitted'
  | 'pending_mentor'
  | 'pending_hod'
  | 'pending_principal'
  | 'handled_by_vp'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'completed'
  | 'cancelled'
  | 'in_progress'
  | 'overdue'
  | 'published'
  | 'scheduled'
  | 'archived'
  | 'active'
  | 'inactive'
  | 'pending'
  | 'under_review'
  | 'escalated'
  | 'resolved'
  | 'reopened'
  | 'closed';

interface StatusConfig {
  label: string;
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  dot?: boolean;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  // Workflow statuses
  draft: { label: 'Draft', variant: 'outline' },
  submitted: { label: 'Submitted', variant: 'info', dot: true },
  pending: { label: 'Pending', variant: 'warning', dot: true },
  pending_mentor: { label: 'Waiting for Mentor', variant: 'warning', dot: true },
  pending_hod: { label: 'Waiting for HOD Approval', variant: 'warning', dot: true },
  pending_principal: { label: 'Waiting for Principal Approval', variant: 'warning', dot: true },
  handled_by_vp: { label: 'Handled by Vice Principal', variant: 'info', dot: true },
  approved: { label: 'Approved', variant: 'success', dot: true },
  rejected: { label: 'Rejected', variant: 'danger', dot: true },
  returned: { label: 'Returned for Changes', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'default' },

  // Task statuses
  in_progress: { label: 'In Progress', variant: 'info', dot: true },
  overdue: { label: 'Overdue', variant: 'danger', dot: true },

  // Circular statuses
  published: { label: 'Published', variant: 'success' },
  scheduled: { label: 'Scheduled', variant: 'info' },
  archived: { label: 'Archived', variant: 'default' },

  // General
  active: { label: 'Active', variant: 'success', dot: true },
  inactive: { label: 'Inactive', variant: 'default' },

  // Complaint statuses
  under_review: { label: 'Under Review', variant: 'info', dot: true },
  escalated: { label: 'Escalated', variant: 'danger', dot: true },
  resolved: { label: 'Resolved', variant: 'success' },
  reopened: { label: 'Reopened', variant: 'warning', dot: true },
  closed: { label: 'Closed', variant: 'default' },
};

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Converts any backend status string to a human-readable badge.
 * Normalizes the input: PENDING_HOD → pending_hod → "Waiting for HOD Approval"
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className }) => {
  const normalized = status.toLowerCase().replace(/-/g, '_').trim();
  const config = STATUS_MAP[normalized];

  if (!config) {
    // Fallback: Convert unknown status to readable format
    const readable = status
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return (
      <Badge variant="outline" size={size} className={className}>
        {readable}
      </Badge>
    );
  }

  return (
    <Badge variant={config.variant} size={size} dot={config.dot} className={className}>
      {config.label}
    </Badge>
  );
};

StatusBadge.displayName = 'StatusBadge';
export default StatusBadge;
