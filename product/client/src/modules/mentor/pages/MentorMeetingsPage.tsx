import React from 'react';
import { Calendar, Construction } from 'lucide-react';
import { EmptyState } from '../../../design-system/components/EmptyState';

/**
 * Mentee Group / Individual Meetings scheduling.
 *
 * There is no backend for this feature yet (no `/mentor/meetings` route or
 * data model exists server-side — confirmed via repo-wide search). Building
 * full CRUD (Prisma model + service + routes + notifications) is real
 * net-new feature work, out of scope for this pass. Rather than showing a
 * form that silently 404s on submit, this page is an honest "not available
 * yet" state so the navigation entry isn't a dead end or a fake success.
 */
export const MentorMeetingsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <Calendar className="w-4 h-4" /> Mentor Workspace
          </div>
          <h1 className="text-xl font-extrabold text-foreground mt-0.5">Mentee Group & Individual Meetings</h1>
          <p className="text-xs text-muted-foreground">
            Schedule periodic mentee group meetings, review sessions, and advisement assemblies.
          </p>
        </div>
      </div>

      <EmptyState
        icon={Construction}
        title="Not Available Yet"
        description="Meeting scheduling isn't built into this release yet. Please continue coordinating mentee meetings through your existing department process until this feature is delivered."
      />

    </div>
  );
};
