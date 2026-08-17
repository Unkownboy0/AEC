import React from 'react';
import {
  Inbox,
  Megaphone,
  ListChecks,
  ClipboardCheck,
  GraduationCap,
  MessageCircleWarning,
  CalendarOff,
} from 'lucide-react';
import Button from '../primitives/Button/Button';

/* ═══════════════════════════════════════════════════════════════════
   EMPTY STATES — CampusOS Enterprise ERP
   
   Presets for standard module empty states:
   - No Circulars
   - No Tasks
   - No Attendance
   - No Students
   - No Complaints
   - No Leave Requests
   ═══════════════════════════════════════════════════════════════════ */

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  preset?: 'circulars' | 'tasks' | 'attendance' | 'students' | 'complaints' | 'leave';
  className?: string;
}

const PRESET_CONFIGS = {
  circulars: {
    title: 'No Circulars Available',
    description: 'There are no active notices or announcements published for your department.',
    icon: Megaphone,
  },
  tasks: {
    title: 'No Pending Tasks',
    description: 'You are all caught up! No active tasks or pending items require your attention.',
    icon: ListChecks,
  },
  attendance: {
    title: 'No Attendance Records',
    description: 'No attendance data recorded for the selected date or section.',
    icon: ClipboardCheck,
  },
  students: {
    title: 'No Students Found',
    description: 'There are no student profiles matching your filter criteria.',
    icon: GraduationCap,
  },
  complaints: {
    title: 'No Complaints Logged',
    description: 'No active complaints or grievances reported in the system.',
    icon: MessageCircleWarning,
  },
  leave: {
    title: 'No Leave Requests',
    description: 'There are no leave or On Duty (OD) applications pending approval.',
    icon: CalendarOff,
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  preset,
  className,
}) => {
  const presetConfig = preset ? PRESET_CONFIGS[preset] : null;

  const finalTitle = title || presetConfig?.title || 'No records found';
  const finalDescription = description || presetConfig?.description || 'There are no items to display right now.';
  const IconComponent = icon || presetConfig?.icon || Inbox;

  const effectivePrimaryLabel = primaryActionLabel || actionLabel;
  const effectivePrimaryAction = onPrimaryAction || onAction;

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border shadow-2xs space-y-4 my-4 ${className || ''}`}>
      <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20 shadow-2xs">
        <IconComponent className="w-7 h-7 stroke-[1.8]" />
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-foreground tracking-tight">{finalTitle}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{finalDescription}</p>
      </div>

      {(effectivePrimaryLabel || secondaryActionLabel) && (
        <div className="flex items-center justify-center gap-3 pt-1">
          {effectivePrimaryLabel && effectivePrimaryAction && (
            <Button variant="primary" size="sm" onClick={effectivePrimaryAction}>
              {effectivePrimaryLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
export default EmptyState;
