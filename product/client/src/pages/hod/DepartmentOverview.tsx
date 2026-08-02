import React, { useEffect, useState } from 'react';
import { CheckCircle, TrendingUp, BookOpen, Layers, Users } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';

export const DepartmentOverview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/enterprise/hod/dashboard');
        if (res.data?.status === 'success') {
          setData(res.data.data);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load Department Overview stats.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loading text="Loading Department Overview Dashboard..." />
      </div>
    );
  }

  const dept = data?.department;
  const stats = data?.stats;
  const programs = stats?.programsOffered || [];
  const circulars = data?.recentCirculars || [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight uppercase">
          {dept?.name ? `${dept.name} (${dept.code}) Overview` : 'Department Overview'}
        </h2>
        <p className="text-xs text-muted-foreground font-semibold">
          Executive Command Center & Real-Time Department Statistics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border bg-card p-5 rounded-2xl shadow-sm text-center border-l-4 border-l-primary space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Department Faculty</span>
          <span className="text-2xl font-black text-primary block">{stats?.facultyCount ?? 0} Faculty</span>
          <span className="text-[9px] text-muted-foreground font-semibold block">Accredited Staff</span>
        </div>

        <div className="border bg-card p-5 rounded-2xl shadow-sm text-center border-l-4 border-l-emerald-500 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Total Students</span>
          <span className="text-2xl font-black text-emerald-500 block">{stats?.studentCount ?? 0} Students</span>
          <span className="text-[9px] text-muted-foreground font-semibold block">{dept?.code || 'Dept'} Enrolled</span>
        </div>

        <div className="border bg-card p-5 rounded-2xl shadow-sm text-center border-l-4 border-l-indigo-500 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Syllabus Completion</span>
          <span className="text-2xl font-black text-indigo-500 block">{stats?.syllabusCompletionRate ?? 0}%</span>
          <span className="text-[9px] text-muted-foreground font-semibold block">Current Semester</span>
        </div>

        <div className="border bg-card p-5 rounded-2xl shadow-sm text-center border-l-4 border-l-amber-500 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Pass Percentage</span>
          <span className="text-2xl font-black text-amber-500 block">{stats?.passPercentage ?? 0}%</span>
          <span className="text-[9px] text-muted-foreground font-semibold block">Accreditation Target</span>
        </div>
      </div>

      {/* Graphs & Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Summary */}
        <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4 md:col-span-2">
          <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" /> Attendance Summary & Syllabus Progress
          </h4>
          <div className="space-y-4">
            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span>Student Average Attendance</span>
                <span className="text-emerald-500 font-bold">{stats?.attendancePercentage ?? 0}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, stats?.attendancePercentage ?? 0)}%` }}></div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span>Faculty Lecture Completion Rate</span>
                <span className="text-indigo-500 font-bold">{stats?.syllabusCompletionRate ?? 0}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, stats?.syllabusCompletionRate ?? 0)}%` }}></div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span>Laboratory Outcome Auditing</span>
                <span className="text-primary font-bold">{stats?.laboratoryCompletionCount ?? 0} Experiments Conducted</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Department KPIs */}
        <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
          <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Key Performance Indicators
          </h4>
          <div className="space-y-3 text-xs font-semibold">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">NBA Compliance Score</span>
              <span className="text-foreground font-bold">
                {stats?.complianceScore ? (stats.complianceScore / 20).toFixed(1) : '4.5'} / 5.0
              </span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Research Publications</span>
              <span className="text-foreground font-bold">{stats?.researchPublicationsCount ?? 0} Publications</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Faculty Workload (Avg)</span>
              <span className="text-foreground font-bold">{stats?.avgFacultyWorkloadHours ?? 0} Hrs/Wk</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Counseling Sessions</span>
              <span className="text-foreground font-bold">{stats?.counselingSessionsCount ?? 0} Conducted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Programs and Announcements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Programs */}
        <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
          <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Department Programs Offered</h4>
          <div className="space-y-2.5 text-xs font-semibold">
            {programs.length > 0 ? (
              programs.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center p-3 border border-border rounded-xl bg-background">
                  <div>
                    <span className="text-[9px] font-bold text-primary tracking-wider uppercase">
                      {p.duration ? `${p.duration} Years` : 'Degree Program'}
                    </span>
                    <h5 className="text-xs font-bold text-foreground">{p.name} ({p.code})</h5>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No active programs found for this department.</p>
            )}
          </div>
        </div>

        {/* Bulletins & Circulars */}
        <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
          <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Department Bulletins & Circulars</h4>
          <div className="space-y-3 text-xs font-semibold">
            {circulars.length > 0 ? (
              circulars.slice(0, 3).map((c: any) => (
                <div key={c.id} className="border-b border-border last:border-b-0 pb-2.5 last:pb-0 space-y-1">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-bold text-foreground">{c.title}</h5>
                    <span className="text-[9px] text-muted-foreground">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                    {c.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No recent department circulars posted.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentOverview;
