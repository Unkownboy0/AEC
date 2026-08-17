import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck, FileCheck2, Loader2, Plus, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { downloadAndOpen } from '../../platform/download';

interface Props { user?: any }
interface Department { id: string; name: string; code?: string }
interface AuditDepartment { departmentId: string; status: string; department: Department }
interface Requirement { id: string; title: string; description?: string | null }
interface Evidence {
  id: string; departmentId: string; requirementId: string; originalFileName: string; fileReference: string;
  version: number; status: string; submittedAt: string; remarks?: string | null; isCurrent: boolean;
  department: Department; requirement: Requirement;
}
interface AuditRecord {
  id: string; auditCode: string; title: string; auditType: string; description?: string | null; status: string;
  startAt?: string | null; dueAt?: string | null; departments: AuditDepartment[]; requirements: Requirement[];
  evidence?: Evidence[]; observations?: any[]; timeline?: any[]; _count?: { evidence: number; observations: number };
}

const readFileBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('The selected file could not be read.'));
  reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
  reader.readAsDataURL(file);
});

const messageFrom = (error: any) => error?.response?.data?.message || error?.message || 'The request could not be completed.';

export const IQACDeanPortal: React.FC<Props> = () => {
  const [tab, setTab] = useState<'overview' | 'audits' | 'evidence' | 'repository' | 'contributions'>('overview');
  const [dashboard, setDashboard] = useState<any>(null);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);
  const [repository, setRepository] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', auditType: 'ACADEMIC_AND_ADMINISTRATIVE', description: '', dueAt: '', requirements: '', departmentIds: [] as string[] });
  const [upload, setUpload] = useState<{ departmentId: string; requirementId: string; file: File | null }>({ departmentId: '', requirementId: '', file: null });
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [dashboardResponse, auditsResponse, departmentsResponse, repositoryResponse] = await Promise.all([
        api.get('/iqac/dashboard'), api.get('/iqac/audits'), api.get('/academics/departments'), api.get('/iqac/repository'),
      ]);
      setDashboard(dashboardResponse.data.data);
      setAudits(auditsResponse.data.data || []);
      setDepartments(departmentsResponse.data.data || []);
      setRepository(repositoryResponse.data.data || []);
    } catch (loadError) {
      setError(messageFrom(loadError));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openAudit = async (id: string) => {
    setSaving(true);
    try {
      const response = await api.get(`/iqac/audits/${id}`);
      setSelectedAudit(response.data.data);
      setTab('evidence');
    } catch (requestError) { toast.error(messageFrom(requestError)); }
    finally { setSaving(false); }
  };

  const createAudit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      await api.post('/iqac/audits', {
        ...form,
        dueAt: form.dueAt || undefined,
        requirements: form.requirements.split('\n').map((title) => title.trim()).filter(Boolean),
        publish: true,
      });
      toast.success('Audit created and evidence requests sent.');
      setForm({ title: '', auditType: 'ACADEMIC_AND_ADMINISTRATIVE', description: '', dueAt: '', requirements: '', departmentIds: [] });
      setShowCreate(false);
      await load();
    } catch (requestError) { toast.error(messageFrom(requestError)); }
    finally { setSaving(false); }
  };

  const uploadEvidence = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAudit || !upload.file) return;
    setSaving(true);
    try {
      const base64 = await readFileBase64(upload.file);
      const fileResponse = await api.post('/files/upload', { name: upload.file.name, mimeType: upload.file.type || 'application/octet-stream', folder: '/iqac', base64 });
      const stored = fileResponse.data.data;
      await api.post(`/iqac/audits/${selectedAudit.id}/evidence`, {
        departmentId: upload.departmentId,
        requirementId: upload.requirementId,
        fileReference: stored.path,
        originalFileName: upload.file.name,
        mimeType: upload.file.type || stored.mimeType,
        fileSize: upload.file.size,
      });
      toast.success('Evidence uploaded and version history updated.');
      setUpload({ departmentId: '', requirementId: '', file: null });
      await openAudit(selectedAudit.id);
      await load();
    } catch (requestError) { toast.error(messageFrom(requestError)); }
    finally { setSaving(false); }
  };

  const reviewEvidence = async (evidence: Evidence, action: 'VERIFIED' | 'CORRECTION_REQUIRED' | 'REJECTED') => {
    const remarks = action === 'VERIFIED' ? '' : window.prompt('Enter the review remarks:')?.trim();
    if (action !== 'VERIFIED' && !remarks) return;
    setSaving(true);
    try {
      await api.patch(`/iqac/evidence/${evidence.id}/review`, { action, remarks });
      toast.success(`Evidence marked ${action.toLowerCase().replace(/_/g, ' ')}.`);
      if (selectedAudit) await openAudit(selectedAudit.id);
      await load();
    } catch (requestError) { toast.error(messageFrom(requestError)); }
    finally { setSaving(false); }
  };

  const currentEvidence = useMemo(() => selectedAudit?.evidence?.filter((item) => item.isCurrent) || [], [selectedAudit]);

  const addComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAudit || !comment.trim()) return;
    setSaving(true);
    try {
      await api.post(`/iqac/audits/${selectedAudit.id}/observations`, { message: comment.trim(), category: 'COMMENT' });
      setComment('');
      await openAudit(selectedAudit.id);
      toast.success('Comment added to the audit history.');
    } catch (requestError) { toast.error(messageFrom(requestError)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-[320px] grid place-items-center text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading IQAC records…</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><AlertCircle className="mb-2 h-5 w-5" />{error}<button onClick={() => void load()} className="mt-4 block rounded-lg border px-3 py-2 font-semibold"><RefreshCw className="mr-2 inline h-4 w-4" />Retry</button></div>;

  const metrics = [
    ['Active audits', dashboard?.activeAudits ?? 0], ['Awaiting review', dashboard?.pendingVerification ?? 0],
    ['Correction required', dashboard?.correctionRequired ?? 0], ['Verified today', dashboard?.verifiedToday ?? 0],
  ];

  return <div className="space-y-5">
    <header className="rounded-2xl border bg-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="flex items-center gap-2 text-xl font-black"><ShieldCheck className="h-6 w-6 text-emerald-600" />IQAC quality assurance</h1><p className="mt-1 text-xs text-muted-foreground">NAAC · NBA · AQAR · SSR · evidence repository · verified quality metrics</p></div>
        <div className="flex flex-wrap gap-2">{(['overview', 'audits', 'evidence', 'repository', 'contributions'] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize ${tab === item ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>{item}</button>)}</div>
      </div>
    </header>

    {tab === 'overview' && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <div key={String(label)} className="rounded-xl border bg-card p-4"><p className="text-[11px] font-bold uppercase text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>)}</div>
      <section className="rounded-xl border bg-card p-5"><h2 className="font-extrabold">Upcoming compliance deadlines</h2>{dashboard?.upcomingDeadlines?.length ? <div className="mt-3 divide-y">{dashboard.upcomingDeadlines.map((item: any) => <button key={item.id} onClick={() => void openAudit(item.id)} className="flex w-full items-center justify-between py-3 text-left"><span><b>{item.title}</b><small className="block text-muted-foreground">{item.auditCode}</small></span><span className="text-xs">{item.dueAt ? new Date(item.dueAt).toLocaleDateString() : 'No due date'}</span></button>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No upcoming deadlines.</p>}</section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{dashboard?.accreditation?.map((item: any) => <div key={item.type} className="rounded-xl bg-slate-950 p-4 text-white"><p className="text-xs font-bold text-emerald-400">{item.type.replace(/_/g, ' ')}</p><p className="mt-2 text-2xl font-black tabular-nums">{item.active}</p><p className="text-xs text-slate-500">active · {item.overdue} overdue</p></div>)}</section>
      <section className="rounded-xl border bg-card p-5"><h2 className="font-extrabold">Connected quality sources</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(dashboard?.sourceMetrics || {}).map(([key, value]) => <div key={key}><p className="text-xs capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</p><b className="text-xl tabular-nums">{String(value)}</b></div>)}</div></section>
    </>}

    {tab === 'audits' && <section className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between"><div><h2 className="font-extrabold">Audit register</h2><p className="text-xs text-muted-foreground">All values below come from the IQAC audit database.</p></div><button onClick={() => setShowCreate((value) => !value)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><Plus className="mr-1 inline h-4 w-4" />Create audit</button></div>
      {showCreate && <form onSubmit={createAudit} className="mt-4 grid gap-3 rounded-xl border bg-muted/30 p-4 md:grid-cols-2">
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Audit title" className="rounded-lg border bg-background p-2.5 text-sm" />
        <select value={form.auditType} onChange={(e) => setForm({ ...form, auditType: e.target.value })} className="rounded-lg border bg-background p-2.5 text-sm"><option value="ACADEMIC_AND_ADMINISTRATIVE">Academic & administrative</option><option value="NAAC">NAAC</option><option value="NBA">NBA</option><option value="AQAR">AQAR</option><option value="SSR">SSR</option><option value="ANNUAL_REPORT">Annual report</option><option value="BEST_PRACTICES">Best practices</option><option value="INSTITUTIONAL_VALUES">Institutional values</option></select>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Purpose and instructions" className="rounded-lg border bg-background p-2.5 text-sm" />
        <textarea required value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder={'Evidence requirements\nOne requirement per line'} className="rounded-lg border bg-background p-2.5 text-sm" />
        <input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} className="rounded-lg border bg-background p-2.5 text-sm" />
        <div className="rounded-lg border bg-background p-2.5"><p className="mb-2 text-xs font-bold">Departments</p><div className="max-h-28 space-y-1 overflow-auto">{departments.map((department) => <label key={department.id} className="flex gap-2 text-xs"><input type="checkbox" checked={form.departmentIds.includes(department.id)} onChange={(e) => setForm({ ...form, departmentIds: e.target.checked ? [...form.departmentIds, department.id] : form.departmentIds.filter((id) => id !== department.id) })} />{department.code || department.name} — {department.name}</label>)}</div></div>
        <button disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 md:col-span-2">{saving ? 'Creating…' : 'Create and request evidence'}</button>
      </form>}
      {audits.length ? <div className="mt-4 space-y-2">{audits.map((audit) => <button key={audit.id} onClick={() => void openAudit(audit.id)} className="flex w-full flex-col gap-2 rounded-xl border p-4 text-left hover:bg-muted/40 md:flex-row md:items-center md:justify-between"><span><b>{audit.title}</b><small className="block text-muted-foreground">{audit.auditCode} · {audit.auditType.replace(/_/g, ' ')}</small><small className="block text-muted-foreground">{audit.departments.map((item) => item.department.code || item.department.name).join(', ')}</small></span><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold">{audit.status.replace(/_/g, ' ')}</span></button>)}</div> : <p className="py-12 text-center text-sm text-muted-foreground">No IQAC audits have been created.</p>}
    </section>}

    {tab === 'evidence' && <section className="rounded-xl border bg-card p-5">
      {!selectedAudit ? <div className="py-12 text-center"><ClipboardCheck className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">Open an audit from the audit register to review its evidence.</p></div> : <div className="space-y-5">
        <div><p className="text-xs font-bold text-emerald-700">{selectedAudit.auditCode}</p><h2 className="text-lg font-black">{selectedAudit.title}</h2><p className="text-xs text-muted-foreground">{selectedAudit.departments.map((item) => item.department.name).join(', ')}</p></div>
        <form onSubmit={uploadEvidence} className="grid gap-2 rounded-xl border bg-muted/30 p-4 md:grid-cols-4"><select required value={upload.departmentId} onChange={(e) => setUpload({ ...upload, departmentId: e.target.value })} className="rounded-lg border bg-background p-2 text-xs"><option value="">Department</option>{selectedAudit.departments.map((item) => <option key={item.departmentId} value={item.departmentId}>{item.department.name}</option>)}</select><select required value={upload.requirementId} onChange={(e) => setUpload({ ...upload, requirementId: e.target.value })} className="rounded-lg border bg-background p-2 text-xs"><option value="">Requirement</option>{selectedAudit.requirements.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><input required type="file" onChange={(e) => setUpload({ ...upload, file: e.target.files?.[0] || null })} className="rounded-lg border bg-background p-2 text-xs" /><button disabled={saving} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><Upload className="mr-1 inline h-4 w-4" />Upload evidence</button></form>
        {currentEvidence.length ? <div className="space-y-2">{currentEvidence.map((item) => <div key={item.id} className="rounded-xl border p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><span className="flex gap-3"><FileCheck2 className="h-5 w-5 text-emerald-600" /><span><button type="button" onClick={async () => { const res = await downloadAndOpen(item.fileReference, item.originalFileName || 'Evidence_Document.pdf'); if (!res.success) toast.error(res.error || 'Failed to open evidence file.'); }} className="font-bold hover:underline">{item.originalFileName}</button><small className="block text-muted-foreground">{item.department.code || item.department.name} · {item.requirement.title} · Version {item.version}</small>{item.remarks && <small className="mt-1 block text-amber-700">{item.remarks}</small>}</span></span><span className="flex flex-wrap items-center gap-2"><b className="rounded-full bg-muted px-2 py-1 text-[10px]">{item.status.replace(/_/g, ' ')}</b><button onClick={() => void reviewEvidence(item, 'VERIFIED')} className="rounded-lg border border-emerald-300 px-2 py-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="mr-1 inline h-3 w-3" />Verify</button><button onClick={() => void reviewEvidence(item, 'CORRECTION_REQUIRED')} className="rounded-lg border border-amber-300 px-2 py-1 text-[10px] font-bold text-amber-700">Return</button><button onClick={() => void reviewEvidence(item, 'REJECTED')} className="rounded-lg border border-red-300 px-2 py-1 text-[10px] font-bold text-red-700">Reject</button></span></div></div>)}</div> : <p className="py-10 text-center text-sm text-muted-foreground">No evidence has been uploaded for this audit.</p>}
        <form onSubmit={addComment} className="flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Comment on this audit or its evidence…" className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"/><button disabled={saving || !comment.trim()} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Add comment</button></form>
        <div className="rounded-xl bg-muted/30 p-4"><h3 className="text-xs font-bold uppercase tracking-wide">Verification and comment history</h3><div className="mt-3 space-y-2">{selectedAudit.timeline?.map((entry: any) => <div key={entry.id} className="border-l-2 border-emerald-500 pl-3 text-xs"><b>{entry.eventType.replace(/_/g, ' ')}</b><p className="text-muted-foreground">{entry.description}</p><small className="text-muted-foreground">{entry.actor?.firstName} {entry.actor?.lastName} · {new Date(entry.createdAt).toLocaleString()}</small></div>)}</div></div>
      </div>}
    </section>}
    {tab === 'repository' && <section className="rounded-xl border bg-card p-5"><div><h2 className="font-extrabold">Evidence Repository</h2><p className="text-xs text-muted-foreground">Upload once, reuse everywhere. Every row retains source, version and verification provenance.</p></div><div className="mt-4 space-y-2">{repository.length ? repository.map((item: any) => <button key={item.id} onClick={() => void openAudit(item.auditId)} className="grid w-full gap-2 rounded-xl border p-4 text-left md:grid-cols-[1fr_auto_auto]"><span><b>{item.originalFileName}</b><small className="block text-muted-foreground">{item.audit.auditType} · {item.requirement.metricCode || item.requirement.title} · {item.department.code || item.department.name}</small></span><span className="text-xs">{item.sourceType} · v{item.version}</span><span className="text-xs font-bold text-emerald-700">{item.status.replace(/_/g, ' ')}</span></button>) : <p className="py-10 text-center text-sm text-muted-foreground">No evidence has been contributed yet.</p>}</div></section>}
    {tab === 'contributions' && <section className="rounded-xl border bg-card p-5"><h2 className="font-extrabold">Department contribution progress</h2><div className="mt-4 space-y-4">{dashboard?.departmentProgress?.length ? dashboard.departmentProgress.map((item: any) => <div key={item.id}><div className="mb-1 flex justify-between text-xs"><b>{item.code || item.name} · {item.name}</b><span>{item.verified}/{item.expected} verified · {item.progress}%</span></div><div className="h-2 overflow-hidden rounded bg-muted"><div className="h-full bg-emerald-600" style={{ width: `${item.progress}%` }} /></div></div>) : <p className="text-sm text-muted-foreground">No department evidence requests are active.</p>}</div><h3 className="mt-8 font-extrabold">Evidence task deadlines</h3><div className="mt-3 divide-y">{dashboard?.evidenceTasks?.map((task: any) => <div key={task.id} className="flex justify-between py-3 text-xs"><span><b>{task.title}</b><small className="block text-muted-foreground">{task.taskNumber} · {task.category} · {task.department?.code || 'Institution'}</small></span><span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}</span></div>)}</div></section>}
  </div>;
};
