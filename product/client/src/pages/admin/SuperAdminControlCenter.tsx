import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowRight, Building2, CheckCircle2, Database,
  FileClock, Flag, GitBranch, GraduationCap, HeartPulse, KeyRound, Layers3,
  RefreshCw, Search, Settings2, ShieldCheck, Users, Workflow,
} from 'lucide-react';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';

type LoadState = 'loading' | 'ready' | 'error';

const controlGroups = [
  {
    title: 'People', description: 'Identity, lifecycle and account provisioning', icon: Users,
    items: [
      { label: 'All users', path: '/admin/people', icon: Users },
      { label: 'Students', path: '/students', icon: GraduationCap },
      { label: 'Roles & access', path: '/admin/iam', icon: KeyRound },
    ],
  },
  {
    title: 'Organization', description: 'Institution and academic structure', icon: Building2,
    items: [
      { label: 'Institution', path: '/institution', icon: Building2 },
      { label: 'Academic structure', path: '/academics', icon: Layers3 },
      { label: 'Departments', path: '/master-lists', icon: Database },
    ],
  },
  {
    title: 'Workflows', description: 'Requests, approvals and routing', icon: Workflow,
    items: [
      { label: 'Workflow monitor', path: '/work-management', icon: Workflow },
      { label: 'Approval centre', path: '/approval-center', icon: CheckCircle2 },
      { label: 'Governance suite', path: '/governance', icon: GitBranch },
    ],
  },
  {
    title: 'Platform', description: 'Modules, communication and system controls', icon: Settings2,
    items: [
      { label: 'Module settings', path: '/settings', icon: Flag },
      { label: 'Notifications', path: '/notifications', icon: Activity },
      { label: 'Backup centre', path: '/backups', icon: Database },
    ],
  },
];

const numberValue = (value: unknown) => typeof value === 'number' ? value.toLocaleString('en-IN') : '—';

export const SuperAdminControlCenter: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>('loading');
  const [stats, setStats] = useState<Record<string, any>>({});
  const [directoryStats, setDirectoryStats] = useState<Record<string, any>>({});
  const [query, setQuery] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [dashboardResponse, directoryResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/users/directory-stats'),
      ]);
      setStats(dashboardResponse.data?.data?.metrics ?? dashboardResponse.data?.data ?? {});
      setDirectoryStats(directoryResponse.data?.data?.stats ?? directoryResponse.data?.data ?? {});
      setUpdatedAt(new Date());
      setState('ready');
    } catch (error) {
      console.error('[SuperAdminControlCenter] Unable to load live control-plane metrics', error);
      setState('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return controlGroups;
    return controlGroups
      .map(group => ({ ...group, items: group.items.filter(item => `${group.title} ${item.label}`.toLowerCase().includes(needle)) }))
      .filter(group => group.items.length > 0);
  }, [query]);

  const metrics = [
    { label: 'Active users', value: directoryStats.active ?? directoryStats.activeUsers ?? stats.activeUsers, icon: Users },
    { label: 'Students', value: stats.totalStudents ?? directoryStats.students, icon: GraduationCap },
    { label: 'Employees', value: stats.totalFaculty ?? directoryStats.employees ?? directoryStats.faculty, icon: ShieldCheck },
    { label: 'Departments', value: stats.totalDepartments, icon: Building2 },
  ];

  return (
    <main className="mx-auto w-full max-w-[1480px] space-y-6 px-1 pb-12">
      <section className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card">
        <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1fr_auto] lg:px-9 lg:py-9">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              Institution control plane
            </div>
            <h1 className="text-balance text-3xl font-extrabold tracking-[-0.04em] md:text-4xl">Super Admin Control Centre</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Configure people, organization, access, workflows and platform services from one governed workspace.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-muted/55 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold text-muted-foreground">Live configuration</p>
              <p className="mt-1 text-sm font-bold">{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Connecting'}</p>
            </div>
            <button onClick={() => void load()} disabled={state === 'loading'} className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background transition hover:border-primary/50 hover:text-primary active:scale-95 disabled:opacity-50" aria-label="Refresh live metrics">
              <RefreshCw className={cn('h-4 w-4', state === 'loading' && 'animate-spin')} />
            </button>
          </div>
        </div>
      </section>

      {state === 'error' && (
        <section className="flex flex-col gap-4 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-5 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-rose-500" /><div><h2 className="font-semibold">Live administration data is unavailable</h2><p className="mt-1 text-sm text-muted-foreground">No placeholder values are being shown. Check the API connection and retry.</p></div></div>
          <button onClick={() => void load()} className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition active:scale-[.98]">Retry</button>
        </section>
      )}

      <section aria-label="Institution metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article key={label} className="min-h-32 rounded-2xl bg-muted/45 p-5">
            <div className="flex items-start justify-between"><p className="text-xs font-semibold text-muted-foreground">{label}</p><Icon className="h-4 w-4 text-primary" /></div>
            {state === 'loading' ? <div className="mt-7 h-8 w-20 animate-pulse rounded-lg bg-muted" /> : <p className="mt-6 tabular-nums text-3xl font-extrabold tracking-tight">{numberValue(value)}</p>}
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-xl font-bold tracking-tight">Configuration workspace</h2><p className="mt-1 text-sm text-muted-foreground">Choose a governed area to manage.</p></div>
          <label className="relative block w-full sm:w-80"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><span className="sr-only">Search configuration</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search settings and controls" className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
        </div>
        {visibleGroups.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleGroups.map(group => {
              const GroupIcon = group.icon;
              return <article key={group.title} className="rounded-2xl border border-border/75 bg-card p-5 md:p-6"><header className="mb-5 flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><GroupIcon className="h-5 w-5" /></div><div><h3 className="font-bold">{group.title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p></div></header><div className="divide-y divide-border/65">{group.items.map(item => { const ItemIcon = item.icon; return <button key={item.path} onClick={() => navigate(item.path)} className="group flex min-h-14 w-full items-center gap-3 py-3 text-left transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><ItemIcon className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" /><span className="flex-1 text-sm font-semibold">{item.label}</span><ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></button>; })}</div></article>;
            })}
          </div>
        ) : <div className="rounded-2xl border border-dashed border-border p-12 text-center"><Search className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 font-semibold">No matching controls</p><p className="mt-1 text-sm text-muted-foreground">Try a role, module, workflow or organization term.</p></div>}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl border border-border/75 bg-card p-6"><div className="flex items-center gap-3"><HeartPulse className="h-5 w-5 text-primary" /><div><h2 className="font-bold">Configuration health</h2><p className="text-xs text-muted-foreground">Checks use live service responses; unresolved checks remain visible.</p></div></div><div className="mt-5 flex items-center justify-between rounded-xl bg-muted/45 p-4"><div><p className="text-sm font-semibold">Core data services</p><p className="mt-1 text-xs text-muted-foreground">Dashboard and directory APIs</p></div><span className={cn('text-xs font-bold', state === 'ready' ? 'text-emerald-500' : state === 'error' ? 'text-rose-500' : 'text-amber-500')}>{state === 'ready' ? 'Operational' : state === 'error' ? 'Needs attention' : 'Checking'}</span></div></article>
        <article className="rounded-2xl bg-foreground p-6 text-background"><FileClock className="h-5 w-5 opacity-70" /><h2 className="mt-5 text-lg font-bold">Audit-aware administration</h2><p className="mt-2 text-sm leading-6 opacity-70">Critical identity and configuration changes must remain attributable and reversible.</p><button onClick={() => navigate('/security-logs')} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">Open audit logs <ArrowRight className="h-4 w-4" /></button></article>
      </section>
    </main>
  );
};

export default SuperAdminControlCenter;
