import React, { useEffect, useState } from 'react';
import { Layers, Users, BookOpen, Clock, AlertTriangle, Send, FileBarChart, Award, TrendingUp, CheckCircle, HelpCircle } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';

export const DepartmentOverview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data?.status === 'success') {
          setStats(res.data.data.metrics);
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

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight uppercase">Department Overview</h2>
        <p className="text-xs text-muted-foreground font-semibold">Executive Command Center & Department Statistics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border bg-card p-5 rounded-2xl shadow-sm text-center border-l-4 border-l-primary space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Department Faculty</span>
          <span className="text-2xl font-black text-primary block">18 Faculty</span>
          <span className="text-[9px] text-muted-foreground font-semibold block">Accredited Staff</span>
        </div>
        <div className="border bg-card p-5 rounded-2xl shadow-sm text-center border-l-4 border-l-emerald-500 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Total Students</span>
          <span className="text-2xl font-black text-emerald-500 block">120 Students</span>
          <span className="text-[9px] text-muted-foreground font-semibold block">CSE Enrolled</span>
        </div>
        <div className="border bg-card p-5 rounded-2xl shadow-sm text-center border-l-4 border-l-indigo-500 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Syllabus Completion</span>
          <span className="text-2xl font-black text-indigo-500 block">92.5%</span>
          <span className="text-[9px] text-muted-foreground font-semibold block">Current Semester</span>
        </div>
        <div className="border bg-card p-5 rounded-2xl shadow-sm text-center border-l-4 border-l-amber-500 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Pass Percentage</span>
          <span className="text-2xl font-black text-amber-500 block">94.2%</span>
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
                <span className="text-emerald-500 font-bold">89.4%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '89.4%' }}></div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span>Faculty Lecture Completion Rate</span>
                <span className="text-indigo-500 font-bold">98.0%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span>Laboratory Outcome Auditing</span>
                <span className="text-primary font-bold">100% Complete</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">NBA Compliance Score</span>
              <span className="text-foreground font-bold">4.8 / 5.0</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Research Publications</span>
              <span className="text-foreground font-bold">12 Selected</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Faculty Workload (Avg)</span>
              <span className="text-foreground font-bold">16.4 Hrs/Wk</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Counseling Sessions</span>
              <span className="text-foreground font-bold">14 Conducted</span>
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
            <div className="flex justify-between items-center p-3 border rounded-xl bg-background">
              <div>
                <span className="text-[9px] font-bold text-primary tracking-wider uppercase">UG · 4 Years</span>
                <h5 className="text-xs font-bold text-foreground">Bachelor of Technology in Computer Science & Engineering</h5>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-xl bg-background">
              <div>
                <span className="text-[9px] font-bold text-primary tracking-wider uppercase">PG · 2 Years</span>
                <h5 className="text-xs font-bold text-foreground">Master of Technology in Computer Science & Engineering</h5>
              </div>
            </div>
          </div>
        </div>

        {/* Bulletins */}
        <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
          <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Department Bulletins & Circulars</h4>
          <div className="space-y-3 text-xs font-semibold">
            <div className="border-b last:border-b-0 pb-2.5 last:pb-0 space-y-1">
              <div className="flex justify-between items-center">
                <h5 className="text-xs font-bold text-foreground">Odd Semester Course Mapping Review</h5>
                <span className="text-[9px] text-muted-foreground">2026-07-12</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                All faculty must submit their subject outcomes mapping for evaluation by the curriculum committee.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentOverview;
