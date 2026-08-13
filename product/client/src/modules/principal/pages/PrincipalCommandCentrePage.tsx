import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, BarChart3, BedDouble, BriefcaseBusiness, Building2, CheckSquare, Clock3, FileCheck2, GraduationCap, IndianRupee, Megaphone, Power, RefreshCw, ShieldCheck, Sparkles, Users, BusFront } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/axios';
import { PrincipalStatusModal } from '../../principal-availability/components/PrincipalStatusModal';
import { useDelegationContext } from '../../delegation/context/DelegationContext';

const compact = (value = 0) => new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const money = (value = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(value);

const Stat = ({ label, value, detail, icon: Icon, onClick, alert = false }: any) => <button onClick={onClick} className="rounded-xl bg-card p-4 text-left ring-1 ring-border/70 transition duration-200 hover:-translate-y-0.5 hover:ring-primary/40 active:translate-y-0">
  <span className="flex items-start justify-between gap-2"><span className="text-[10px] font-semibold text-muted-foreground">{label}</span><Icon className={`h-4 w-4 ${alert ? 'text-rose-500' : 'text-primary'}`} /></span>
  <span className="mt-3 block text-2xl font-bold tracking-tight tabular-nums">{value}</span><span className="mt-1 block text-[10px] text-muted-foreground">{detail}</span>
</button>;

const Action = ({ label, icon: Icon, onClick }: any) => <button onClick={onClick} className="flex min-h-20 items-center justify-between rounded-xl bg-white/5 p-3 text-left ring-1 ring-white/10 transition hover:bg-white/10 active:scale-[.99]"><span className="flex items-center gap-2 text-xs font-semibold"><Icon className="h-4 w-4 text-teal-300" />{label}</span><ArrowRight className="h-3.5 w-3.5 text-slate-500" /></button>;

export const PrincipalCommandCentrePage: React.FC = () => {
  const navigate = useNavigate();
  const { principalStatus, delegationStatus, refetch: refetchDelegation } = useDelegationContext();
  const [statusOpen, setStatusOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [periodDays, setPeriodDays] = useState('30');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const params = { periodDays, ...(departmentId ? { departmentId } : {}) };
      const [dashboard, tree] = await Promise.all([api.get('/principal-command/dashboard', { params }), api.get('/principal-command/hierarchy', { params })]);
      setData(dashboard.data.data); setHierarchy(tree.data.data);
    } catch (err: any) { setError(err.response?.data?.message || 'Principal command information could not be loaded.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [periodDays, departmentId]);

  if (loading && !data) return <main className="mx-auto max-w-[1440px] space-y-4 p-4 md:p-7"><div className="h-44 animate-pulse rounded-2xl bg-muted" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div></main>;
  if (error && !data) return <main className="mx-auto max-w-3xl p-6"><section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center"><AlertTriangle className="mx-auto h-7 w-7 text-rose-500" /><h1 className="mt-3 text-lg font-bold">Command centre unavailable</h1><p className="mt-1 text-sm text-muted-foreground">{error}</p><button onClick={load} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Retry</button></section></main>;
  if (!data) return null;
  const delegated = delegationStatus === 'ACTIVE' || !['AVAILABLE', 'ONLINE', null].includes(principalStatus as any);

  return <main className="mx-auto max-w-[1440px] space-y-5 p-4 pb-24 md:p-7">
    <PrincipalStatusModal isOpen={statusOpen} onClose={() => setStatusOpen(false)} currentStatus={principalStatus === 'ONLINE' ? 'AVAILABLE' : principalStatus || 'AVAILABLE'} onStatusUpdated={() => { setStatusOpen(false); refetchDelegation?.(); load(); }} />
    <header className="relative overflow-hidden rounded-2xl bg-slate-950 px-5 py-6 text-white ring-1 ring-white/10 md:px-8 md:py-8">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(20,184,166,.17),transparent_62%)]" />
      <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end"><div><p className="flex items-center gap-2 text-[10px] font-semibold tracking-[.18em] text-teal-300"><ShieldCheck className="h-4 w-4" /> INSTITUTION OPERATIONS · LIVE COMMAND</p><h1 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Principal command centre</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Approvals, academic delivery, people availability, finance, quality and campus operations from their authoritative modules.</p></div><div className="flex flex-wrap gap-2"><select aria-label="Reporting period" value={periodDays} onChange={(event) => setPeriodDays(event.target.value)} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white"><option className="text-slate-900" value="30">30 days</option><option className="text-slate-900" value="90">90 days</option><option className="text-slate-900" value="180">180 days</option></select><button onClick={() => setStatusOpen(true)} className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold ${delegated ? 'bg-amber-400 text-slate-950' : 'bg-teal-400 text-slate-950'}`}><Power className="h-4 w-4" />{delegated ? 'Review delegation' : 'Set availability'}</button><button aria-label="Refresh command centre" onClick={load} className="rounded-lg border border-white/15 bg-white/10 p-2.5"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div></div>
      {delegated && <div className="relative mt-5 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">VP delegation is active. {data.approvals.delegatedPending} request(s) remain in the acting Principal queue.</div>}
      <nav aria-label="Principal quick actions" className="relative mt-5 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6"><Action label="Approval desk" icon={FileCheck2} onClick={() => navigate('/principal/approval-center')} /><Action label="Assign task" icon={CheckSquare} onClick={() => navigate('/principal/tasks')} /><Action label="Publish circular" icon={Megaphone} onClick={() => navigate('/principal/circulars')} /><Action label="Availability" icon={Activity} onClick={() => navigate('/principal/department-availability')} /><Action label="Reports" icon={BarChart3} onClick={() => navigate('/principal/reports')} /><Action label="Institution" icon={Building2} onClick={() => navigate('/principal/institution')} /></nav>
    </header>

    {data.institutionalAlerts.length > 0 && <section aria-label="Institutional alerts" className="grid gap-2 md:grid-cols-2">{data.institutionalAlerts.map((alert: any, index: number) => <button key={`${alert.label}-${index}`} onClick={() => navigate(alert.route)} className="flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-left"><span className="flex items-center gap-2 text-xs font-semibold"><AlertTriangle className="h-4 w-4 text-amber-500" />{alert.label}</span><ArrowRight className="h-3.5 w-3.5" /></button>)}</section>}

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
      <Stat label="Pending approvals" value={data.approvals.total} detail={`${data.approvals.delegatedPending} delegated`} icon={FileCheck2} alert={data.approvals.total > 0} onClick={() => navigate('/principal/approval-center')} />
      <Stat label="Student attendance" value={`${data.attendanceToday.students.rate}%`} detail={`${data.attendanceToday.students.recorded} records today`} icon={GraduationCap} onClick={() => navigate('/principal/departments')} />
      <Stat label="Faculty availability" value={`${data.attendanceToday.faculty.rate}%`} detail={`${data.attendanceToday.faculty.recorded} records today`} icon={Users} onClick={() => navigate('/principal/department-availability')} />
      <Stat label="Active tasks" value={data.tasks.active.length} detail={`${data.tasks.overdue} overdue`} icon={CheckSquare} alert={data.tasks.overdue > 0} onClick={() => navigate('/principal/tasks')} />
      <Stat label="Fee outstanding" value={money(data.finance.outstanding)} detail={`${data.finance.collectionRate}% collected`} icon={IndianRupee} onClick={() => navigate('/principal/reports')} />
      <Stat label="Placements" value={data.placements.placed} detail={`${data.placements.companies} companies`} icon={BriefcaseBusiness} onClick={() => navigate('/principal/placement')} />
      <Stat label="Major grievances" value={data.alerts.majorGrievances} detail={`${data.alerts.openGrievances} open total`} icon={AlertTriangle} alert={data.alerts.majorGrievances > 0} onClick={() => navigate('/principal/complaints')} />
      <Stat label="IQAC progress" value={data.accreditation.available ? `${data.accreditation.progress}%` : 'N/A'} detail={data.accreditation.available ? `${data.accreditation.verifiedOrClosed}/${data.accreditation.totalAudits} verified` : 'Source unavailable'} icon={Sparkles} onClick={() => navigate('/principal/reports')} />
    </section>

    <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/70"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Institution performance</h2><p className="text-xs text-muted-foreground">Department view sourced from live student, attendance, marks, fees and placement records.</p></div><select aria-label="Department drill-down" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-xs"><option value="">All departments</option>{data.departments.map((department: any) => <option key={department.id} value={department.id}>{department.code} · {department.name}</option>)}</select></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="text-[10px] text-muted-foreground"><tr><th className="py-2">Department</th><th>Students</th><th>Faculty</th><th>Attendance</th><th>GPA</th><th>Fee collection</th><th>Placed</th></tr></thead><tbody>{data.departments.map((row: any) => <tr key={row.id} className="border-t border-border/60"><td className="py-3 font-semibold"><span className="mr-2 text-primary">{row.code}</span>{row.name}</td><td>{compact(row.students)}</td><td>{compact(row.faculty)}</td><td>{row.attendanceRate}%</td><td>{row.averageGpa}</td><td>{row.feeCollectionRate}%</td><td>{row.placements}</td></tr>)}</tbody></table></div></section>
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/70"><h2 className="font-bold">Workflow bottlenecks</h2><p className="text-xs text-muted-foreground">Queues ranked by current action volume.</p><div className="mt-3">{data.bottlenecks.map((item: any) => <button key={item.label} onClick={() => navigate(item.route)} className="flex w-full items-center justify-between border-b border-border/60 py-3 text-left last:border-0"><span className="text-xs font-semibold">{item.label}</span><span className="rounded-md bg-muted px-2 py-1 text-xs font-bold tabular-nums">{item.count}</span></button>)}</div></section>
    </div>

    <div className="grid gap-5 lg:grid-cols-3">
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/70"><h2 className="flex items-center gap-2 text-sm font-bold"><Clock3 className="h-4 w-4 text-primary" /> Priority tasks</h2><div className="mt-3 space-y-2">{data.tasks.active.slice(0, 4).map((task: any) => <button key={task.id} onClick={() => navigate('/principal/tasks')} className="block w-full rounded-lg bg-muted/45 p-3 text-left"><span className="flex justify-between gap-2 text-xs font-semibold"><span>{task.title}</span><span className="text-primary">{task.completionPercent}%</span></span><span className="mt-1 block text-[10px] text-muted-foreground">{task.department?.code || 'Institution'} · {task.status.replaceAll('_', ' ')}</span></button>)}{!data.tasks.active.length && <p className="py-5 text-center text-xs text-muted-foreground">No active tasks.</p>}</div></section>
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/70"><h2 className="flex items-center gap-2 text-sm font-bold"><Megaphone className="h-4 w-4 text-primary" /> Recent circulars</h2><div className="mt-3 space-y-2">{data.circulars.map((circular: any) => <button key={circular.id} onClick={() => navigate(`/circulars/${circular.id}`)} className="block w-full border-b border-border/60 py-2 text-left last:border-0"><span className="text-xs font-semibold">{circular.title}</span><span className="mt-1 block text-[10px] text-muted-foreground">{circular.circularNumber} · {new Date(circular.publishedAt).toLocaleDateString()}</span></button>)}{!data.circulars.length && <p className="py-5 text-center text-xs text-muted-foreground">No published circulars.</p>}</div></section>
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/70"><h2 className="text-sm font-bold">Campus operations</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted/45 p-3"><BedDouble className="h-4 w-4 text-primary" /><p className="mt-3 text-xl font-bold">{data.hostel.residents}</p><p className="text-[10px] text-muted-foreground">Hostel residents · {data.hostel.buildings} buildings</p></div><div className="rounded-xl bg-muted/45 p-3"><BusFront className="h-4 w-4 text-primary" /><p className="mt-3 text-xl font-bold">{data.transport.activeRoutes}</p><p className="text-[10px] text-muted-foreground">Routes · {data.transport.assignedStudents} students</p></div></div><button onClick={() => navigate('/principal/reports')} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary">Open operations report <ArrowRight className="h-3.5 w-3.5" /></button></section>
    </div>

    <section className="rounded-2xl bg-card p-5 ring-1 ring-border/70"><h2 className="text-sm font-bold">Authorized academic drill-down</h2><p className="text-xs text-muted-foreground">Institution → department → program → semester/year → section. Student and Faculty detail pages remain protected by the shared access service.</p><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{hierarchy.map((department: any) => <article key={department.id} className="rounded-xl bg-muted/35 p-4"><h3 className="text-xs font-bold"><span className="mr-2 text-primary">{department.code}</span>{department.name}</h3><p className="mt-1 text-[10px] text-muted-foreground">{department._count.students} students · {department._count.faculties} faculty</p><div className="mt-3 space-y-2">{department.programs.map((program: any) => <details key={program.id} className="rounded-lg bg-background px-3 py-2"><summary className="cursor-pointer text-xs font-semibold">{program.code} · {program.level}</summary><div className="mt-2 space-y-1 text-[10px] text-muted-foreground">{program.semesters.map((semester: any) => <p key={semester.id}>{semester.name}: {semester.sections.map((section: any) => `${section.name} (${section._count.students})`).join(', ') || 'No active sections'}</p>)}</div></details>)}</div></article>)}</div></section>
  </main>;
};

export default PrincipalCommandCentrePage;
