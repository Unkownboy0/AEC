import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Award, BarChart3, BriefcaseBusiness, Building2, Download, GraduationCap, IndianRupee, RefreshCw, ShieldCheck, Sparkles, Users } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';

const money = (value = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(value);
const number = (value = 0) => new Intl.NumberFormat('en-IN').format(value);

const Metric = ({ label, value, detail, icon: Icon }: any) => (
  <article className="rounded-xl bg-card p-4 ring-1 ring-border/70 transition-transform duration-200 hover:-translate-y-0.5">
    <div className="flex items-start justify-between gap-3"><p className="text-[11px] font-semibold text-muted-foreground">{label}</p><Icon className="h-4 w-4 text-primary" /></div>
    <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-foreground">{value}</p>
    <p className="mt-1 text-[10px] text-muted-foreground">{detail}</p>
  </article>
);

const Comparison = ({ label, item, suffix = '' }: any) => {
  const positive = item.delta >= 0;
  return <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0">
    <div><p className="text-xs font-semibold text-foreground">{label}</p><p className="text-[10px] text-muted-foreground">Previous {item.previous}{suffix}</p></div>
    <div className="text-right"><p className="text-sm font-bold tabular-nums">{item.current}{suffix}</p><p className={`inline-flex items-center text-[10px] font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>{positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{item.delta}{suffix}</p></div>
  </div>;
};

export const ManagementWorkspace: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodDays, setPeriodDays] = useState('30');
  const [departmentId, setDepartmentId] = useState('');
  const departments = useMemo(() => data?.departments || [], [data]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await api.get('/management/dashboard', { params: { periodDays, ...(departmentId ? { departmentId } : {}) } });
      setData(response.data.data);
    } catch (err: any) { setError(err.response?.data?.message || 'Management information could not be loaded.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [periodDays, departmentId]);

  const exportReport = async () => {
    try {
      const response = await api.get('/management/export', { params: { periodDays, ...(departmentId ? { departmentId } : {}) }, responseType: 'blob' });
      const url = URL.createObjectURL(response.data); const link = document.createElement('a');
      link.href = url; link.download = `campusos-management-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
      toast.success('Executive report exported.');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Executive report export failed.'); }
  };

  if (loading && !data) return <main className="mx-auto max-w-[1440px] space-y-5 p-4 md:p-7"><div className="h-40 animate-pulse rounded-2xl bg-muted" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div></main>;
  if (error && !data) return <main className="mx-auto max-w-3xl p-6"><section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center"><AlertTriangle className="mx-auto h-7 w-7 text-rose-500" /><h1 className="mt-3 text-lg font-bold">Executive workspace unavailable</h1><p className="mt-1 text-sm text-muted-foreground">{error}</p><button onClick={load} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Retry</button></section></main>;
  if (!data) return null;

  return <main className="mx-auto max-w-[1440px] space-y-5 p-4 pb-24 md:p-7">
    <header className="relative overflow-hidden rounded-2xl bg-slate-950 px-5 py-6 text-white ring-1 ring-white/10 md:px-8 md:py-8">
      <div className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_center,rgba(20,184,166,.18),transparent_65%)]" />
      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div><p className="flex items-center gap-2 text-[11px] font-semibold tracking-[.16em] text-teal-300"><ShieldCheck className="h-4 w-4" /> GOVERNING BODY · READ-HEAVY VIEW</p><h1 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight md:text-4xl">Management intelligence workspace</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">One executive view of authoritative academic, financial, admissions, placement, quality and workforce signals.</p></div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Comparison period" value={periodDays} onChange={(event) => setPeriodDays(event.target.value)} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white"><option className="text-slate-900" value="30">Last 30 days</option><option className="text-slate-900" value="90">Last 90 days</option><option className="text-slate-900" value="180">Last 180 days</option><option className="text-slate-900" value="365">Last 12 months</option></select>
          <button onClick={load} aria-label="Refresh dashboard" className="rounded-lg border border-white/15 bg-white/10 p-2.5 hover:bg-white/15"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
          {data.permissions.canExport && <button onClick={exportReport} className="inline-flex items-center gap-2 rounded-lg bg-teal-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-300"><Download className="h-4 w-4" /> Export report</button>}
        </div>
      </div>
    </header>

    <section aria-label="Institution overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
      <Metric label="Active students" value={number(data.overview.activeStudents)} detail="Student master" icon={GraduationCap} />
      <Metric label="Faculty" value={number(data.overview.activeFaculty)} detail="Faculty/HR profiles" icon={Users} />
      <Metric label="Other staff" value={number(data.overview.activeStaff)} detail="Identity directory" icon={Users} />
      <Metric label="Departments" value={number(data.overview.activeDepartments)} detail="Academic structure" icon={Building2} />
      <Metric label="Attendance" value={`${data.comparisons.attendance.current}%`} detail={`${data.comparisons.attendance.delta >= 0 ? '+' : ''}${data.comparisons.attendance.delta} pp vs prior`} icon={Activity} />
      <Metric label="Fee collected" value={money(data.finance.collected)} detail={`${data.finance.collectionRate}% of demand`} icon={IndianRupee} />
      <Metric label="Placed" value={number(data.placements.placed)} detail={`${data.placements.companies} recruiters`} icon={BriefcaseBusiness} />
      <Metric label="Major alerts" value={number(data.alerts.majorGrievances + data.alerts.pendingWorkflows)} detail="Grievances + workflows" icon={AlertTriangle} />
    </section>

    <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/70"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-bold">Department comparison</h2><p className="text-xs text-muted-foreground">Select a department to apply server-side ABAC scope.</p></div><select aria-label="Department scope" disabled={!data.permissions.canDrillDown} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-xs font-semibold"><option value="">All departments</option>{departments.map((department: any) => <option value={department.id} key={department.id}>{department.code} · {department.name}</option>)}</select></div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="text-[10px] text-muted-foreground"><tr><th className="py-2">Department</th><th>Students</th><th>Faculty</th><th>Attendance</th><th>Avg GPA</th><th>Fee collection</th><th>Placed</th></tr></thead><tbody>{departments.map((row: any) => <tr key={row.id} className="border-t border-border/60"><td className="py-3 font-semibold"><span className="mr-2 text-primary">{row.code}</span>{row.name}</td><td className="tabular-nums">{number(row.students)}</td><td className="tabular-nums">{number(row.faculty)}</td><td>{row.attendanceRate == null ? 'Restricted' : `${row.attendanceRate}%`}</td><td>{row.averageGpa ?? 'Restricted'}</td><td>{row.feeCollectionRate == null ? 'Restricted' : `${row.feeCollectionRate}%`}</td><td>{row.placements ?? 'Restricted'}</td></tr>)}</tbody></table></div>
      </section>
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/70"><h2 className="text-base font-bold">Period comparison</h2><p className="text-xs text-muted-foreground">Current period against the preceding equal period.</p><div className="mt-3"><Comparison label="Attendance" item={data.comparisons.attendance} suffix="%" /><Comparison label="Academic GPA" item={data.comparisons.academicGpa} /><Comparison label="Admissions" item={data.comparisons.admissions} /><Comparison label="Placements" item={data.comparisons.placements} /></div></section>
    </div>

    <div className="grid gap-5 lg:grid-cols-3">
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/70"><h2 className="flex items-center gap-2 text-sm font-bold"><IndianRupee className="h-4 w-4 text-primary" /> Financial position</h2><p className="mt-5 text-3xl font-bold tabular-nums">{money(data.finance.outstanding)}</p><p className="text-xs text-muted-foreground">Outstanding of {money(data.finance.payable)} total demand</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(100, data.finance.collectionRate)}%` }} /></div></section>
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/70"><h2 className="flex items-center gap-2 text-sm font-bold"><Award className="h-4 w-4 text-primary" /> Quality & research</h2><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div><p className="text-xl font-bold">{data.research.publications}</p><p className="text-[10px] text-muted-foreground">Publications</p></div><div><p className="text-xl font-bold">{data.research.patents}</p><p className="text-[10px] text-muted-foreground">Patents</p></div><div><p className="text-xl font-bold">{data.staffDevelopment.certificationsRecorded}</p><p className="text-[10px] text-muted-foreground">Development</p></div></div><p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{data.accreditation.available ? `${data.accreditation.progress}% of IQAC audits verified or closed` : data.accreditation.message}</p></section>
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/70"><h2 className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-primary" /> Operational watch</h2><div className="mt-4 space-y-2 text-xs"><p className="flex justify-between"><span className="text-muted-foreground">Open grievances</span><strong>{data.alerts.openGrievances}</strong></p><p className="flex justify-between"><span className="text-muted-foreground">Major grievances</span><strong className="text-rose-600">{data.alerts.majorGrievances}</strong></p><p className="flex justify-between"><span className="text-muted-foreground">Pending workflows</span><strong>{data.alerts.pendingWorkflows}</strong></p><p className="flex justify-between"><span className="text-muted-foreground">Unsettled fee bills</span><strong>{data.alerts.overdueFeeBills}</strong></p></div></section>
    </div>

    <footer className="flex flex-col gap-1 border-t pt-4 text-[10px] text-muted-foreground md:flex-row md:items-center md:justify-between"><p>Sources: {data.sources.join(' · ')}</p><p>Generated {new Date(data.generatedAt).toLocaleString()} · cache {data.cache.hit ? 'reused' : 'refreshed'}</p></footer>
  </main>;
};

export default ManagementWorkspace;
