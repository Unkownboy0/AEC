import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BedDouble, BriefcaseBusiness, Building2, CheckCircle2, ClipboardList, Download, FileCheck2, FileSpreadsheet, GraduationCap, RefreshCw, UserRoundCheck, Users } from 'lucide-react';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';

const cn = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');
const statusTone = (value: string) => value === 'BREACHED' ? 'text-rose-300 bg-rose-500/10 border-rose-500/20' : value === 'AT_RISK' ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';

export const AdministrationDeanCommandCentrePage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, error, refetch } = useRealtimeSync<any>(['administration-dean-command'], '/administration-dean/dashboard?periodDays=30', { intervalMs: 15000 });

  const exportReport = async (format: 'PDF' | 'EXCEL') => {
    try {
      const response = await api.get(`/administration-dean/export?format=${format}`, { responseType: 'blob' });
      const extension = format === 'PDF' ? 'pdf' : 'xlsx';
      const url = URL.createObjectURL(new Blob([response.data]));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `Administration_Dean_Report.${extension}`; anchor.click(); URL.revokeObjectURL(url);
      toast.success(`${format === 'PDF' ? 'PDF' : 'Excel'} report downloaded`);
    } catch (exportError: any) { toast.error(exportError?.response?.data?.message || 'You are not authorized to export this report'); }
  };

  if (isLoading) return <div className="mx-auto max-w-7xl p-6 text-slate-400">Loading live administration data…</div>;
  if (error || !data) return <div className="mx-auto max-w-7xl p-6"><div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center"><AlertTriangle className="mx-auto mb-3 text-rose-400"/><p className="text-white">Administration data could not be loaded.</p><button onClick={() => refetch()} className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Retry</button></div></div>;

  const metrics = [
    { label: 'Applications', value: data.admission.total, meta: `${data.admission.recent} received in 30 days`, icon: GraduationCap, route: '/admission-dean/admissions' },
    { label: 'Confirmed onboarding', value: data.onboarding.confirmedApplications, meta: `${data.onboarding.unlinkedAccounts} accounts need linking`, icon: UserRoundCheck, route: '/admission-dean/students' },
    { label: 'Documents pending', value: data.documents.pending, meta: `${data.documents.rejected} rejected / re-upload`, icon: FileCheck2, route: '/admission-dean/admissions?tab=applications' },
    { label: 'Student services', value: data.services.active, meta: 'Active administrative requests', icon: ClipboardList, route: '/admission-dean/services' },
    { label: 'Important complaints', value: data.complaints.important.length, meta: `${data.complaints.breached} SLA breached`, icon: AlertTriangle, route: '/admission-dean/complaints' },
    { label: 'Hostel oversight', value: data.hostel.enabled ? `${data.hostel.occupancyRate}%` : 'Not assigned', meta: data.hostel.enabled ? `${data.hostel.residents} residents · ${data.hostel.buildings} buildings` : 'Disabled by institution policy', icon: BedDouble, route: '/admission-dean/hostel' },
  ];

  return <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 p-6 lg:p-8">
      <div className="absolute right-0 top-0 h-full w-2 bg-violet-500" />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-violet-400">Administration operations · live institutional data</p><h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Admission & Administration Command Centre</h1><p className="mt-2 max-w-3xl text-sm text-slate-400">Admissions, onboarding, records, services, complaints and policy-authorized hostel oversight in one governed workspace.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => refetch()} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200"><RefreshCw className={cn('mr-2 inline h-4 w-4', isFetching && 'animate-spin')}/>Live sync</button><button onClick={() => exportReport('PDF')} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200"><Download className="mr-2 inline h-4 w-4"/>PDF</button><button onClick={() => exportReport('EXCEL')} className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white"><FileSpreadsheet className="mr-2 inline h-4 w-4"/>Excel</button></div>
      </div>
      <p className="mt-5 text-xs text-slate-500">Updated {new Date(data.generatedAt).toLocaleTimeString()} · IQAC and Examination authority excluded</p>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(({ label, value, meta, icon: Icon, route }) => <button key={label} onClick={() => navigate(route)} className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left transition hover:border-violet-500/50 hover:bg-slate-900"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-white">{value}</p><p className="mt-1 text-xs text-slate-400">{meta}</p></div><span className="rounded-xl bg-violet-500/10 p-2.5 text-violet-400"><Icon className="h-5 w-5"/></span></div></button>)}</section>

    <section className="grid gap-6 xl:grid-cols-[1.45fr_.75fr]">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-white">Important student administration & hostel complaints</h2><p className="text-xs text-slate-500">Priority, owner, SLA and resolution from the authoritative grievance record</p></div><button onClick={() => navigate('/admission-dean/complaints')} className="text-xs font-semibold text-violet-400">Open complaints →</button></div><div className="space-y-2">{data.complaints.important.length ? data.complaints.important.map((item: any) => <button key={item.id} onClick={() => navigate('/admission-dean/complaints')} className="grid w-full gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-left md:grid-cols-[1fr_auto_auto]"><div><div className="flex gap-2"><span className="text-[10px] font-bold uppercase text-violet-400">{item.category}</span><span className="text-[10px] font-bold uppercase text-rose-400">{item.priority}</span></div><p className="mt-1 text-sm font-semibold text-white">{item.title}</p><p className="mt-1 text-xs text-slate-500">Owner: {item.owner} · {item.status}</p>{item.resolutionRemarks && <p className="mt-1 text-xs text-emerald-300">Resolution: {item.resolutionRemarks}</p>}</div><span className={cn('self-center rounded-full border px-2 py-1 text-[10px] font-bold', statusTone(item.slaStatus))}>{item.slaStatus}</span><span className="self-center text-xs text-slate-500">Due {new Date(item.dueAt).toLocaleString()}</span></button>) : <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500"><CheckCircle2 className="mx-auto mb-2 text-emerald-400"/>No important complaints in the live feed.</div>}</div></div>

      <div className="space-y-4"><div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h2 className="font-semibold text-white">Operational queue</h2><div className="mt-4 space-y-3 text-sm"><button onClick={() => navigate('/admission-dean/tasks')} className="flex w-full justify-between text-slate-300"><span><BriefcaseBusiness className="mr-2 inline h-4 w-4 text-violet-400"/>Administrative tasks</span><b className="text-white">{data.tasks.active.length}</b></button><button onClick={() => navigate('/admission-dean/coordination')} className="flex w-full justify-between text-slate-300"><span><Building2 className="mr-2 inline h-4 w-4 text-violet-400"/>Department coordination</span><b className="text-white">{data.coordination.active}</b></button><button onClick={() => navigate('/admission-dean/students')} className="flex w-full justify-between text-slate-300"><span><Users className="mr-2 inline h-4 w-4 text-violet-400"/>Active student records</span><b className="text-white">{data.onboarding.activeStudents}</b></button></div></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h2 className="font-semibold text-white">Faculty workspace assignment</h2>{data.facultyWorkspace.available ? <><p className="mt-2 text-sm text-slate-300">{data.facultyWorkspace.department.name} · {data.facultyWorkspace.designation || 'Faculty'}</p><p className="mt-1 text-xs text-slate-500">Reports to {data.facultyWorkspace.hod ? `${data.facultyWorkspace.hod.firstName} ${data.facultyWorkspace.hod.lastName}` : 'department HOD not assigned'}</p><button onClick={() => navigate('/faculty/dashboard')} className="mt-4 w-full rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white">Open assigned Faculty Workspace</button></> : <p className="mt-3 text-sm text-slate-500">No Faculty workspace is assigned. Access is never inferred from the Dean role.</p>}</div></div>
    </section>
  </main>;
};

export default AdministrationDeanCommandCentrePage;
