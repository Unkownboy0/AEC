import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, BarChart3, BriefcaseBusiness, Building2, CheckSquare, Clock3, FileCheck2, GraduationCap, Megaphone, RefreshCw, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { useRealtimeSync } from '../../../hooks/useRealtimeSync';
import { useDelegationContext } from '../../delegation/context/DelegationContext';

type Dashboard = any;

export const VpDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshStatus } = useDelegationContext();
  const { data, isLoading, isFetching, error, refetch } = useRealtimeSync<Dashboard>(['vp-command'], '/vp-command/dashboard', { intervalMs: 10_000 });

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) return <State title="VP workspace could not load" detail="Live institutional sources are unavailable. No fallback figures are shown." onRetry={() => refetch()} />;

  const delegated = data.delegatedPrincipal?.active ? data.delegatedPrincipal : null;
  return (
    <main className="mx-auto max-w-7xl space-y-5 pb-12 text-text-primary">
      <header className="relative overflow-hidden rounded-3xl bg-surface px-5 py-6 ring-1 ring-border/70 sm:px-7 sm:py-7">
        <div aria-hidden className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.12),transparent_66%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-primary">INSTITUTION OPERATIONS</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Vice Principal workspace</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">Monitor academic operations, departments, assigned approvals and institutional delivery from one live workspace.</p>
          </div>
          <button onClick={() => { refetch(); refreshStatus(); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-surface-soft px-4 text-xs font-bold ring-1 ring-border transition hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh live data
          </button>
        </div>
        <nav aria-label="VP quick actions" className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Action icon={Building2} label="Departments" onClick={() => navigate('/vp/departments')} />
          <Action icon={FileCheck2} label="VP approvals" onClick={() => document.getElementById('vp-approvals')?.scrollIntoView({ behavior: 'smooth' })} />
          <Action icon={CheckSquare} label="Tasks" onClick={() => navigate('/vp/tasks')} />
          <Action icon={Megaphone} label="Circulars" onClick={() => navigate('/vp/circulars')} />
          <Action icon={Activity} label="Availability" onClick={() => navigate('/vp/department-availability')} />
          <Action icon={BarChart3} label="Reports" onClick={() => navigate('/vp/reports')} />
        </nav>
      </header>

      {delegated && (
        <section className="rounded-2xl bg-amber-50 p-5 text-amber-950 ring-1 ring-amber-300/70 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-700/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" /><div><p className="text-sm font-extrabold">Acting on behalf of Principal</p><p className="mt-1 text-xs leading-5 opacity-80">Limited authority until {formatDate(delegated.endsAt)} · {delegated.categories.length} categories · {delegated.pending} pending.</p></div></div>
            <button onClick={() => navigate('/vp/acting-principal/approvals')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-xs font-bold text-white transition hover:bg-amber-700 active:scale-[0.98]">Open delegated desk <ArrowRight className="h-4 w-4" /></button>
          </div>
        </section>
      )}

      <section aria-label="Operational KPIs" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={GraduationCap} label="Student attendance" value={rate(data.attendanceToday.students)} detail={`${data.attendanceToday.students.recorded} records today`} onClick={() => navigate('/vp/attendance')} />
        <Stat icon={UserCheck} label="Faculty availability" value={rate(data.attendanceToday.faculty)} detail={`${data.attendanceToday.faculty.present} present today`} onClick={() => navigate('/vp/faculty')} />
        <Stat icon={FileCheck2} label="Assigned VP approvals" value={data.approvals.pending} detail="Normal VP authority" onClick={() => document.getElementById('vp-approvals')?.scrollIntoView({ behavior: 'smooth' })} />
        <Stat icon={CheckSquare} label="Active tasks" value={data.tasks.active.length} detail={`${data.tasks.overdue} overdue`} alert={data.tasks.overdue > 0} onClick={() => navigate('/vp/tasks')} />
        <Stat icon={Users} label="Active students" value={data.overview.activeStudents} detail={`${data.overview.activeDepartments} departments`} onClick={() => navigate('/vp/students')} />
        <Stat icon={BriefcaseBusiness} label="Placements" value={data.placements.placed} detail={`${data.placements.companies} companies`} onClick={() => navigate('/vp/placements')} />
        <Stat icon={GraduationCap} label="Academic GPA" value={data.academic.averageGpa || 'N/A'} detail={`${data.comparisons.academicGpa.delta >= 0 ? '+' : ''}${data.comparisons.academicGpa.delta} change`} onClick={() => navigate('/vp/examinations')} />
        <Stat icon={AlertTriangle} label="Operational alerts" value={data.alerts.length} detail="Live action queue" alert={data.alerts.length > 0} onClick={() => document.getElementById('vp-alerts')?.scrollIntoView({ behavior: 'smooth' })} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <section className="overflow-hidden rounded-2xl bg-surface ring-1 ring-border/70">
          <div className="flex items-center justify-between px-5 py-4"><div><h2 className="text-sm font-bold">Department monitoring</h2><p className="mt-1 text-xs text-text-muted">Authoritative academic and operating indicators</p></div><button onClick={() => navigate('/vp/departments')} className="text-xs font-bold text-primary">Open all</button></div>
          <div className="overflow-x-auto"><table className="min-w-[680px] w-full text-left text-xs"><thead className="bg-surface-soft text-[10px] uppercase tracking-wider text-text-muted"><tr><th className="px-5 py-3">Department</th><th className="px-3 py-3">Students</th><th className="px-3 py-3">Faculty</th><th className="px-3 py-3">Attendance</th><th className="px-3 py-3">GPA</th><th className="px-5 py-3">Placements</th></tr></thead><tbody>{data.departments.map((department: any) => <tr key={department.id} className="border-t border-border/60 transition hover:bg-surface-soft"><td className="px-5 py-3.5 font-semibold">{department.code} · {department.name}</td><td className="px-3 tabular-nums">{department.students}</td><td className="px-3 tabular-nums">{department.faculty}</td><td className="px-3 tabular-nums">{department.attendanceRate}%</td><td className="px-3 tabular-nums">{department.averageGpa || '—'}</td><td className="px-5 tabular-nums">{department.placements}</td></tr>)}</tbody></table></div>
        </section>
        <section id="vp-alerts" className="rounded-2xl bg-surface p-5 ring-1 ring-border/70"><h2 className="text-sm font-bold">Alerts</h2><div className="mt-4 space-y-2">{data.alerts.length ? data.alerts.map((alert: any) => <button key={alert.label} onClick={() => navigate(alert.route)} className="flex w-full items-start justify-between gap-3 rounded-xl bg-surface-soft p-3 text-left transition hover:bg-primary-soft"><span className="text-xs font-semibold leading-5">{alert.label}</span><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" /></button>) : <Empty text="No operational alerts require attention." />}</div></section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section id="vp-approvals" className="rounded-2xl bg-surface p-5 ring-1 ring-border/70"><div className="flex justify-between"><div><h2 className="text-sm font-bold">Approvals assigned to VP</h2><p className="mt-1 text-xs text-text-muted">Separate from delegated Principal authority</p></div><span className="text-xl font-extrabold tabular-nums">{data.approvals.pending}</span></div><div className="mt-4 space-y-2">{data.approvals.recent.length ? data.approvals.recent.map((item: any) => <article key={item.id} className="rounded-xl bg-surface-soft p-3"><p className="text-xs font-bold">{item.title || item.requestType}</p><p className="mt-1 text-[11px] text-text-muted">{item.applicantName || 'Applicant not linked'} · {item.departmentName || 'Institution'}</p></article>) : <Empty text="No normal VP approvals are pending." />}</div></section>
        <section className="rounded-2xl bg-surface p-5 ring-1 ring-border/70"><div className="flex justify-between"><div><h2 className="text-sm font-bold">Current tasks</h2><p className="mt-1 text-xs text-text-muted">Assigned or created by this VP</p></div><button onClick={() => navigate('/vp/tasks')} className="text-xs font-bold text-primary">Workspace</button></div><div className="mt-4 space-y-2">{data.tasks.active.length ? data.tasks.active.map((task: any) => <button key={task.id} onClick={() => navigate('/vp/tasks')} className="flex w-full items-center justify-between rounded-xl bg-surface-soft p-3 text-left transition hover:bg-primary-soft"><div><p className="text-xs font-bold">{task.title}</p><p className="mt-1 text-[11px] text-text-muted">{task.status.replaceAll('_', ' ')} · {task.completionPercent}%</p></div><Clock3 className="h-4 w-4 text-text-muted" /></button>) : <Empty text="No active tasks are assigned." />}</div></section>
      </div>

      <section className="rounded-2xl bg-surface p-5 ring-1 ring-border/70"><div className="flex justify-between"><div><h2 className="text-sm font-bold">Recent institutional circulars</h2><p className="mt-1 text-xs text-text-muted">Published source records</p></div><button onClick={() => navigate('/vp/circulars')} className="text-xs font-bold text-primary">Open circulars</button></div><div className="mt-4 grid gap-2 md:grid-cols-2">{data.circulars.length ? data.circulars.map((circular: any) => <button key={circular.id} onClick={() => navigate(`/vp/circulars/${circular.id}`)} className="rounded-xl bg-surface-soft p-3 text-left transition hover:bg-primary-soft"><p className="text-xs font-bold">{circular.title}</p><p className="mt-1 text-[11px] text-text-muted">{circular.circularNumber} · {formatDate(circular.publishedAt)}</p></button>) : <Empty text="No published circulars are available." />}</div></section>
    </main>
  );
};

const rate = (metric: any) => metric.recorded ? `${metric.rate}%` : 'N/A';
const formatDate = (value: string) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const Action = ({ icon: Icon, label, onClick }: any) => <button onClick={onClick} className="flex min-h-12 items-center gap-2 rounded-xl bg-surface-soft px-3 text-left text-xs font-bold transition hover:-translate-y-0.5 hover:bg-primary-soft hover:text-primary active:translate-y-0 focus-visible:outline-2 focus-visible:outline-primary"><Icon className="h-4 w-4" />{label}</button>;
const Stat = ({ icon: Icon, label, value, detail, onClick, alert }: any) => <button onClick={onClick} className="group min-h-32 rounded-2xl bg-surface p-4 text-left ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:ring-primary/40 focus-visible:outline-2 focus-visible:outline-primary"><div className="flex justify-between"><Icon className={`h-4 w-4 ${alert ? 'text-rose-500' : 'text-primary'}`} /><ArrowRight className="h-3.5 w-3.5 text-text-muted opacity-0 transition group-hover:opacity-100" /></div><p className="mt-5 text-2xl font-extrabold tabular-nums">{value}</p><p className="mt-1 text-[11px] font-semibold">{label}</p><p className="mt-1 text-[10px] text-text-muted">{detail}</p></button>;
const Empty = ({ text }: { text: string }) => <div className="rounded-xl bg-surface-soft p-4 text-xs text-text-muted">{text}</div>;
const DashboardSkeleton = () => <div className="mx-auto max-w-7xl space-y-4"><div className="h-56 animate-pulse rounded-3xl bg-surface-soft" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-soft" />)}</div></div>;
const State = ({ title, detail, onRetry }: any) => <div className="mx-auto max-w-3xl rounded-3xl bg-surface p-8 text-center ring-1 ring-border"><AlertTriangle className="mx-auto h-7 w-7 text-amber-500" /><h1 className="mt-4 text-lg font-bold">{title}</h1><p className="mt-2 text-sm text-text-muted">{detail}</p><button onClick={onRetry} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">Retry</button></div>;
