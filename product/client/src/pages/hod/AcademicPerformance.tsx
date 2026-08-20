import React from 'react';
import { BarChart2 } from 'lucide-react';

export const AcademicPerformance: React.FC = () => (
  <section className="space-y-6" aria-labelledby="academic-performance-title">
    <header>
      <h2 id="academic-performance-title" className="text-xl font-extrabold uppercase tracking-tight text-foreground">Academic Performance</h2>
      <p className="mt-1 text-sm text-muted-foreground">Verified result and performance analytics</p>
    </header>
    <div className="rounded-2xl border bg-card p-8 text-center">
      <BarChart2 className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <h3 className="mt-3 font-bold text-foreground">No verified performance data is available</h3>
      <p className="mt-1 text-sm text-muted-foreground">Analytics will appear when published examination results are connected to this workspace.</p>
    </div>
  </section>
);
