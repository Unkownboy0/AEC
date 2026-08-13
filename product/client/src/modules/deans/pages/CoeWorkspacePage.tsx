import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Armchair, CalendarClock, CheckCircle2, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { Button } from '../../../components/ui/Button';

interface CoeMetrics {
  activeExams: number; upcomingExams: number; draftSchedules: number; publishedSchedules: number;
  publishedSeatAllocations: number; publishedInvigilationAssignments: number; conflictCount: number; openIncidents: number;
}

const empty: CoeMetrics = { activeExams: 0, upcomingExams: 0, draftSchedules: 0, publishedSchedules: 0, publishedSeatAllocations: 0, publishedInvigilationAssignments: 0, conflictCount: 0, openIncidents: 0 };

export const CoeWorkspacePage: React.FC = () => {
  const [metrics, setMetrics] = useState<CoeMetrics>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { const response = await api.get('/coe/dashboard'); setMetrics(response.data?.data || empty); }
    catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to load examination control data. Check the connection and try again.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const cards = [
    ['Active exams', metrics.activeExams, CalendarClock, 'text-blue-600 bg-blue-500/10'],
    ['Upcoming exams', metrics.upcomingExams, CalendarClock, 'text-violet-600 bg-violet-500/10'],
    ['Draft timetable entries', metrics.draftSchedules, RefreshCw, 'text-amber-600 bg-amber-500/10'],
    ['Published versions', metrics.publishedSchedules, CheckCircle2, 'text-emerald-600 bg-emerald-500/10'],
    ['Published seat allotments', metrics.publishedSeatAllocations, Armchair, 'text-cyan-600 bg-cyan-500/10'],
    ['Invigilation duties', metrics.publishedInvigilationAssignments, Users, 'text-indigo-600 bg-indigo-500/10'],
    ['Schedule conflicts', metrics.conflictCount, AlertTriangle, 'text-red-600 bg-red-500/10'],
    ['Open incidents', metrics.openIncidents, ShieldCheck, 'text-orange-600 bg-orange-500/10'],
  ] as const;

  return <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Examination authority</p><h1 className="mt-1 text-2xl font-bold">Exam Control Centre</h1><p className="mt-1 text-sm text-muted-foreground">Timetables, hall allocation, invigilation, incidents, marks and publication readiness.</p></div>
      <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
    </header>
    {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1"><p className="font-semibold">Examination data unavailable</p><p>{error}</p></div><Button variant="outline" onClick={load}>Retry</Button></div>}
    <section aria-busy={loading} className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value, Icon, tone]) => <article key={label} className="bg-card p-5"><div className={`mb-4 inline-flex rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div>{loading ? <div className="h-8 w-16 animate-pulse rounded bg-muted" /> : <p className="text-3xl font-bold tabular-nums">{value}</p>}<p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p></article>)}
    </section>
    <section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Authoritative workflow</h2><p className="mt-1 text-sm text-muted-foreground">Create the exam in draft, validate schedules, allocate rooms and seats, assign invigilators, then publish. Published timetables are versioned and never silently overwritten.</p><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">{['Exam draft','Schedule validation','Hall allocation','Invigilation','Publish','Marks','Results'].map((step,index)=><React.Fragment key={step}><span className="rounded-full border px-3 py-1.5">{step}</span>{index<6&&<span className="self-center">→</span>}</React.Fragment>)}</div></section>
  </motion.div>;
};
