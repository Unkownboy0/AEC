import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Clock,
  CheckSquare,
  AlertCircle,
  Users,
  Crown,
  PenTool,
  Megaphone,
  Bell,
  PlusCircle,
  Calendar,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  FileText,
  UserCheck,
  Award
} from 'lucide-react';
import { FacultySidebar } from './FacultySidebar';

export const FacultyDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/faculty/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch faculty dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-400">Loading Faculty Dashboard...</span>
        </div>
      </div>
    );
  }

  const faculty = data?.faculty;
  const metrics = data?.metrics || {};
  const todaySchedule = data?.todaySchedule || [];
  const pendingActions = data?.pendingActions || [];

  const facultyName = faculty ? `Dr. ${faculty.firstName} ${faculty.lastName}` : 'Dr. Arun Kumar';
  const deptName = faculty?.department?.name || 'Computer Science & Engineering';
  const employeeId = faculty?.employeeId || 'EMP-CS-2024-042';
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Rebuilt Faculty Sidebar */}
      <FacultySidebar isMentor={metrics.isMentor} />

      {/* Main Content Area */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-violet-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
              <BookOpen className="w-4 h-4" /> Academic Faculty Operations
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Good Morning, {facultyName}</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {employeeId} • Assistant Professor • Department of {deptName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-violet-400" /> {currentDate}
            </span>
            <button className="relative p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition-colors">
              <Bell className="w-4 h-4" />
              {metrics.unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {metrics.unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-violet-500/40 transition-all cursor-pointer">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-bold">Today's Classes</span>
              <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400"><Clock className="w-4 h-4" /></div>
            </div>
            <h3 className="text-2xl font-extrabold text-white">{metrics.todayClassesCount} Lectures</h3>
            <span className="text-[10px] text-emerald-400 font-bold block">{metrics.completedClassesCount} Completed Today</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-amber-500/40 transition-all cursor-pointer">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-bold">Pending Attendance</span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400"><CheckSquare className="w-4 h-4" /></div>
            </div>
            <h3 className="text-2xl font-extrabold text-amber-400">{metrics.pendingAttendanceCount} Period</h3>
            <span className="text-[10px] text-slate-400 font-bold block">Requires Period Mark</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-indigo-500/40 transition-all cursor-pointer">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-bold">Assigned Subjects</span>
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400"><BookOpen className="w-4 h-4" /></div>
            </div>
            <h3 className="text-2xl font-extrabold text-indigo-300">{metrics.assignedSubjectsCount} Subjects</h3>
            <span className="text-[10px] text-slate-400 font-bold block">Active Semester Courses</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-rose-500/40 transition-all cursor-pointer">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-bold">Unread Circulars</span>
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400"><Megaphone className="w-4 h-4" /></div>
            </div>
            <h3 className="text-2xl font-extrabold text-rose-400">{metrics.unreadCircularsCount} Circulars</h3>
            <span className="text-[10px] text-slate-400 font-bold block">Campus Notices</span>
          </div>

        </div>

        {/* Schedule Timeline & Pending Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          
          {/* Today's Schedule */}
          <div className="lg:col-span-2 bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" /> Today's Lecture Schedule
              </h3>
              <span className="text-[11px] text-violet-400 font-bold hover:underline cursor-pointer">View Timetable</span>
            </div>

            <div className="space-y-2.5">
              {todaySchedule.map((slot: any) => (
                <div
                  key={slot.id}
                  className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-950/60 text-violet-300 font-mono font-bold text-xs border border-violet-500/30">
                      P{slot.period}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">{slot.subject} ({slot.code})</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{slot.section} • Room {slot.room} • {slot.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                      slot.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {slot.status}
                    </span>
                    <button className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[11px] rounded-lg transition-all">
                      Mark Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Actions */}
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Pending Action Items
            </h3>

            <div className="space-y-2.5">
              {pendingActions.map((act: any) => (
                <div key={act.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {act.category}
                    </span>
                    <span className="text-[10px] font-bold text-amber-400">{act.dueDate}</span>
                  </div>
                  <h4 className="font-bold text-white text-xs leading-snug">{act.title}</h4>
                  <button className="text-[11px] font-bold text-violet-400 hover:underline flex items-center gap-1">
                    Process Action <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Quick Actions Bar */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Faculty Quick Actions</h3>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <button className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-md">
              <CheckSquare className="w-4 h-4" /> Mark Attendance
            </button>
            <button className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-indigo-400" /> Create Assignment
            </button>
            <button className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> Enter Internal Marks
            </button>
            <button className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" /> Apply Leave / OD
            </button>
            <button className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-rose-400" /> Send Announcement
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};
