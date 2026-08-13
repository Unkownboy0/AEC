import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, BriefcaseBusiness, Clock3, FlaskConical, RefreshCw, Search, UsersRound } from 'lucide-react';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';

type Filter = 'ALL' | 'HOME' | 'CROSS_DEPARTMENT' | 'FREE' | 'BUSY' | 'LEAVE_OD' | 'WORKLOAD';

const statusMeta: Record<string, { label: string; className: string }> = {
  FREE: { label: 'Free', className: 'bg-emerald-500/10 text-emerald-500' },
  IN_CLASS: { label: 'In class', className: 'bg-blue-500/10 text-blue-500' },
  IN_LAB: { label: 'In lab', className: 'bg-violet-500/10 text-violet-500' },
  ON_LEAVE: { label: 'On leave', className: 'bg-rose-500/10 text-rose-500' },
  ON_DUTY: { label: 'On duty', className: 'bg-amber-500/10 text-amber-500' },
  NO_SCHEDULE: { label: 'No schedule', className: 'bg-muted text-muted-foreground' },
};

export const HodFacultyWorkspace: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await api.get('/enterprise/faculty-operations', { params: { period: period || undefined } });
      setData(response.data?.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Faculty availability could not be loaded.');
    } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { void load(); }, [load]);

  const items = useMemo(() => (data?.items || []).filter((faculty: any) => {
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || `${faculty.name} ${faculty.employeeId} ${faculty.homeDepartment?.name} ${faculty.teachingDepartments?.map((d: any) => d.name).join(' ')}`.toLowerCase().includes(needle);
    if (!matchesSearch) return false;
    if (filter === 'HOME') return faculty.relationship === 'HOME';
    if (filter === 'CROSS_DEPARTMENT') return faculty.relationship === 'CROSS_DEPARTMENT';
    if (filter === 'FREE') return faculty.status === 'FREE';
    if (filter === 'BUSY') return ['IN_CLASS', 'IN_LAB'].includes(faculty.status);
    if (filter === 'LEAVE_OD') return ['ON_LEAVE', 'ON_DUTY'].includes(faculty.status);
    return true;
  }), [data, filter, search]);

  const tabs: Array<{ key: Filter; label: string; count?: number }> = [
    { key: 'ALL', label: 'All', count: data?.summary?.total },
    { key: 'HOME', label: 'Home faculty', count: data?.summary?.homeFaculty },
    { key: 'CROSS_DEPARTMENT', label: 'Cross-department', count: data?.summary?.crossDepartment },
    { key: 'FREE', label: 'Free now', count: data?.summary?.free },
    { key: 'BUSY', label: 'Busy', count: data?.summary?.busy },
    { key: 'LEAVE_OD', label: 'Leave / OD', count: (data?.summary?.onLeave || 0) + (data?.summary?.onDuty || 0) },
    { key: 'WORKLOAD', label: 'Workload' },
  ];

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-5 pb-10">
      <header className="flex flex-col gap-5 rounded-[1.75rem] border border-border/70 bg-card p-6 md:flex-row md:items-end md:justify-between md:p-8">
        <div><p className="text-sm font-semibold text-primary">Department teaching operations</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] md:text-3xl">Faculty availability and workload</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Home and visiting faculty in one live timetable-backed view. Select a period to check substitution or task availability.</p></div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold transition hover:border-primary/50 hover:text-primary active:scale-[.98]"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh</button>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Faculty availability summary">
        {[
          ['Visible faculty', data?.summary?.total, UsersRound], ['Free', data?.summary?.free, Clock3],
          ['Teaching now', data?.summary?.busy, BookOpen], ['Cross-department', data?.summary?.crossDepartment, BriefcaseBusiness],
        ].map(([label, value, Icon]: any) => <article key={label} className="rounded-2xl bg-muted/45 p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon className="h-4 w-4 text-primary" /></div>{loading ? <div className="mt-5 h-8 w-16 animate-pulse rounded-lg bg-muted" /> : <p className="mt-4 text-3xl font-extrabold tabular-nums">{value ?? '-'}</p>}</article>)}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">{tabs.map(tab => <button key={tab.key} onClick={() => setFilter(tab.key)} className={cn('min-h-10 shrink-0 rounded-xl px-3.5 text-sm font-semibold transition', filter === tab.key ? 'bg-foreground text-background' : 'bg-muted/55 text-muted-foreground hover:text-foreground')}>{tab.label}{tab.count !== undefined && <span className="ml-2 opacity-65">{tab.count}</span>}</button>)}</div>
          <div className="flex gap-2"><label className="relative min-w-0 flex-1 lg:w-72"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><span className="sr-only">Search faculty</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, ID or department" className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label><select value={period} onChange={event => setPeriod(event.target.value)} className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-primary"><option value="">Current time</option>{(data?.periods || []).map((value: number) => <option key={value} value={value}>Period {value}</option>)}</select></div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-8 text-center" role="alert"><h2 className="font-bold">Faculty data unavailable</h2><p className="mt-2 text-sm text-muted-foreground">{error}</p><button onClick={() => void load()} className="mt-4 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background">Retry</button></div>
        : loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-muted/50" />)}</div>
        : items.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-12 text-center"><UsersRound className="mx-auto h-7 w-7 text-muted-foreground" /><h2 className="mt-3 font-bold">No matching faculty</h2><p className="mt-1 text-sm text-muted-foreground">No faculty allocations match this period and filter.</p></div>
        : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((faculty: any) => {
          const meta = statusMeta[faculty.status] || statusMeta.NO_SCHEDULE;
          const allocation = faculty.currentAllocation;
          return <article key={faculty.id} className="flex min-h-72 flex-col rounded-2xl border border-border/75 bg-card p-5 transition hover:border-primary/35"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-muted-foreground">{faculty.employeeId}</p><h2 className="mt-1 text-lg font-bold">{faculty.name}</h2><p className="mt-0.5 text-sm text-muted-foreground">{faculty.designation}</p></div><span className={cn('rounded-lg px-2.5 py-1.5 text-xs font-bold', meta.className)}>{meta.label}</span></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-semibold">Home · {faculty.homeDepartment?.code}</span>{faculty.relationship === 'CROSS_DEPARTMENT' && <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Visiting faculty</span>}</div>{allocation ? <div className="mt-4 rounded-xl bg-muted/45 p-4"><div className="flex items-center gap-2 text-xs font-semibold text-primary">{allocation.type === 'LAB' ? <FlaskConical className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />} Period {allocation.period} · {allocation.startTime}–{allocation.endTime}</div><p className="mt-2 font-bold">{allocation.subject?.name}</p><p className="mt-1 text-sm text-muted-foreground">{allocation.department?.code} · {allocation.section?.semester?.name} · {allocation.section?.name} · {allocation.room || 'Room not assigned'}</p></div> : <div className="mt-4 rounded-xl bg-muted/35 p-4 text-sm text-muted-foreground">No blocking class in the selected period.</div>}<div className="mt-auto grid grid-cols-3 gap-2 pt-4 text-center"><div><p className="text-lg font-bold tabular-nums">{faculty.workload?.scheduledPeriodsToday ?? 0}</p><p className="text-[11px] text-muted-foreground">Periods today</p></div><div><p className="text-lg font-bold tabular-nums">{faculty.workload?.mentorStudents ?? 0}</p><p className="text-[11px] text-muted-foreground">Mentees</p></div><div><p className="text-lg font-bold tabular-nums">{faculty.workload?.activeTasks ?? 0}</p><p className="text-[11px] text-muted-foreground">Active tasks</p></div></div>{faculty.nextClass && <p className="mt-4 border-t border-border/65 pt-3 text-xs text-muted-foreground">Next: P{faculty.nextClass.period} · {faculty.nextClass.department?.code} · {faculty.nextClass.subject?.name} · {faculty.nextClass.startTime}</p>}</article>;
        })}</div>}
      </section>
    </main>
  );
};

export default HodFacultyWorkspace;
