import React from 'react';
import { BookOpen } from 'lucide-react';

export const DepartmentSubjects: React.FC = () => (
  <section className="space-y-6" aria-labelledby="department-subjects-title">
    <header>
      <h2 id="department-subjects-title" className="text-xl font-extrabold uppercase tracking-tight text-foreground">Department Subjects</h2>
      <p className="mt-1 text-sm text-muted-foreground">Subject registry and faculty allocation</p>
    </header>
    <div className="rounded-2xl border bg-card p-8 text-center">
      <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <h3 className="mt-3 font-bold text-foreground">No subject records are available</h3>
      <p className="mt-1 text-sm text-muted-foreground">This workspace will show records after the academic subject service is configured for your department.</p>
    </div>
  </section>
);
