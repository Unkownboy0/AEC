import React from 'react';
import { UserCheck, Construction } from 'lucide-react';
import { EmptyState } from '../../../design-system/components/EmptyState';

/**
 * Parent Follow-up / Communication Logging.
 *
 * There is no backend for this feature yet (no `/mentor/parents` route or
 * data model exists server-side — confirmed via repo-wide search). Building
 * full CRUD (Prisma model + service + routes + notifications) is real
 * net-new feature work, out of scope for this pass. Rather than showing a
 * form that silently 404s on submit, this page is an honest "not available
 * yet" state so the navigation entry isn't a dead end or a fake success.
 */
export const MentorParentCommunicationPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <UserCheck className="w-4 h-4" /> Mentor Workspace
          </div>
          <h1 className="text-xl font-extrabold text-foreground mt-0.5">Parent Communication & Follow-up Logs</h1>
          <p className="text-xs text-muted-foreground">
            Document calls, emails, and meetings held with parents regarding mentee progress.
          </p>
        </div>
      </div>

      <EmptyState
        icon={Construction}
        title="Not Available Yet"
        description="Parent communication logging isn't built into this release yet. Please continue recording parent calls and follow-ups through your existing department process until this feature is delivered."
      />

    </div>
  );
};
