import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, Building2, CheckCircle2, Clock3, RefreshCw, Users } from 'lucide-react';
import api from '../../lib/axios';

type Department = {
  id: string;
  name: string;
  code: string;
  hodName?: string | null;
  hodUser?: { firstName: string; lastName: string } | null;
  activeTaskCount: number;
  _count: { students: number; faculties: number };
};

export const AcademicMonitoring: React.FC<{ onOpenTasks: () => void }> = ({ onOpenTasks }) => {
  const [stats, setStats] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsResponse, departmentsResponse] = await Promise.all([
        api.get('/academic-dean/dashboard'),
        api.get('/academic-dean/departments'),
      ]);
      setStats(statsResponse.data?.data || {});
      setDepartments(departmentsResponse.data?.data || []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Academic monitoring data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading academic monitoring">{[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6"><h2 className="font-semibold text-foreground">Academic monitoring is unavailable</h2><p className="mt-1 text-sm text-muted-foreground">{error}</p><button onClick={load} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Try again</button></div>;
  }

  const indicators = [
    { label: 'Active departments', value: stats?.totalDepartments ?? departments.length, icon: Building2 },
    { label: 'Active HODs', value: stats?.activeHods ?? 0, icon: Users },
    { label: 'Low-attendance students', value: stats?.lowAttendanceCount ?? 0, icon: AlertTriangle },
    { label: 'Updated timetables', value: stats?.recentlyUpdatedTimetables ?? 0, icon: Clock3 },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold text-primary">Institution-wide view</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Academic monitoring</h1><p className="mt-1 text-sm text-muted-foreground">Live department capacity, leadership coverage and academic workflow risk.</p></div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted"><RefreshCw className="h-4 w-4" /> Refresh data</button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Academic indicators">
        {indicators.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">{label}</span><Icon className="h-4 w-4 text-primary" /></div><strong className="mt-4 block text-2xl tabular-nums">{value}</strong></article>)}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold">Department health</h2><p className="text-xs text-muted-foreground">Current staffing, enrolment and open task load</p></div><Activity className="h-5 w-5 text-primary" /></div>
        {departments.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No active departments are configured.</div> : <div className="divide-y divide-border">{departments.map((department) => {
          const hod = department.hodUser ? `${department.hodUser.firstName} ${department.hodUser.lastName}` : department.hodName || 'HOD not assigned';
          return <article key={department.id} className="grid gap-4 px-5 py-4 transition-colors hover:bg-muted/40 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(7rem,0.5fr))] md:items-center"><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{department.name}</h3><p className="mt-1 text-xs text-muted-foreground">{department.code} · {hod}</p></div><div><p className="text-[11px] text-muted-foreground">Students</p><p className="mt-1 font-semibold tabular-nums">{department._count.students}</p></div><div><p className="text-[11px] text-muted-foreground">Faculty</p><p className="mt-1 font-semibold tabular-nums">{department._count.faculties}</p></div><div className="flex items-center gap-2">{department.activeTaskCount > 0 ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}<div><p className="text-[11px] text-muted-foreground">Open tasks</p><p className="font-semibold tabular-nums">{department.activeTaskCount}</p></div></div></article>;
        })}</div>}
      </section>

      <div className="flex justify-end"><button onClick={onOpenTasks} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-transform active:scale-[.98]">Open Task Workspace</button></div>
    </div>
  );
};
