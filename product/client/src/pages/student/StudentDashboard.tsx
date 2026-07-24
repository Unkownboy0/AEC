import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, User, CreditCard, Cpu, Briefcase, Compass, Trophy, Send,
  MessageSquare, BookOpen, Clock, CheckCircle, AlertTriangle, FileText,
  ClipboardList, HelpCircle, FileSpreadsheet, Award, CalendarDays,
  FileCode, FilePlus, TrendingUp, Book, Home, Truck, FolderGit, BadgeCheck,
  FolderOpen, Bell, Inbox, Calendar, Settings, ArrowRight, UserCheck, Shield, ChevronRight, Download
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { useDevice } from '../../context/DeviceContext';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isMobile } = useDevice();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/enterprise/students/dashboard-summary');
        if (res.data?.status === 'success') {
          setDashboardData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard details:', err);
        toast.error('Failed to load dashboard parameters from the database.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <Loading text="Loading your Enterprise Student Dashboard..." />
      </div>
    );
  }

  const student = dashboardData?.student;
  const metrics = dashboardData?.metrics || {
    attendancePercentage: 92.8,
    cgpa: 9.5,
    completedCredits: 24,
    remainingCredits: 136,
    pendingHomeworkCount: 2,
    pendingAssignmentsCount: 1,
    libraryDueCount: 0,
    leaveStatus: 'APPROVED',
    odStatus: 'APPROVED',
    placementsEligible: 'ELIGIBLE',
    internshipStatus: 'APPROVED'
  };
  const todaySlots = dashboardData?.todaySlots || [];
  const upcomingExams = dashboardData?.upcomingExams || [];
  const circulars = dashboardData?.circulars || [];
  const notifications = dashboardData?.notifications || [];
  const calendarEvents = dashboardData?.calendarEvents || [];
  const mentorMessages = dashboardData?.mentorMessages || [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 text-left">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/15 via-primary/5 to-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4.5 text-left">
            <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-2xl overflow-hidden shrink-0 border-2 border-primary/20 shadow-md">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} className="h-full w-full object-cover" alt="Student avatar" />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  Active Student
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full">
                  {student?.admissionNo}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight mt-1 text-slate-800 dark:text-white">
                Welcome back, {student?.firstName} {student?.lastName}!
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-bold">
                {student?.program?.name} · {student?.department?.name}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                Semester {student?.semester?.number} · Section {student?.section?.name} · Academic Year {student?.academicYear?.name}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigate('/student/leave-od')} className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-md hover:bg-primary/95 transition-all flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> Apply Leave/OD
            </button>
            <button onClick={() => navigate('/student/id-card')} className="px-3.5 py-2 rounded-xl border bg-card text-xs font-extrabold hover:bg-muted transition-all flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" /> View ID Card
            </button>
            <button onClick={() => navigate('/student/ai-assistant')} className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-1.5">
              <Cpu className="h-4 w-4" /> AI Assistant
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border bg-card p-4 rounded-xl shadow-sm hover:border-primary/20 transition-all">
          <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">CGPA Cumulative</span>
          <span className="text-2xl font-black block text-primary mt-1">{metrics.cgpa.toFixed(2)}</span>
          <span className="text-[9px] text-muted-foreground font-bold mt-1 block">Class Rank: 4th (CSE)</span>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm hover:border-primary/20 transition-all">
          <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">Overall Attendance</span>
          <span className={`text-2xl font-black block mt-1 ${metrics.attendancePercentage < 75 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
            {metrics.attendancePercentage}%
          </span>
          <span className="text-[9px] text-muted-foreground font-bold mt-1 block">
            {metrics.attendancePercentage < 75 ? '⚠️ Attendance Shortage' : '✓ Safe Attendance Zone'}
          </span>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm hover:border-primary/20 transition-all">
          <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">Pending Deliverables</span>
          <span className="text-2xl font-black block text-amber-500 mt-1">
            {metrics.pendingAssignmentsCount + metrics.pendingHomeworkCount}
          </span>
          <span className="text-[9px] text-muted-foreground font-bold mt-1 block">
            {metrics.pendingAssignmentsCount} Assignments · {metrics.pendingHomeworkCount} Workbooks
          </span>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm hover:border-primary/20 transition-all">
          <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">Library Issues</span>
          <span className={`text-2xl font-black block mt-1 ${metrics.libraryDueCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {metrics.libraryDueCount} Books
          </span>
          <span className="text-[9px] text-muted-foreground font-bold mt-1 block">
            {metrics.libraryDueCount > 0 ? 'Overdue books registered' : 'No library dues pending'}
          </span>
        </div>
      </div>

      {/* Dashboard Section layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timetable */}
        <div className="lg:col-span-2 border bg-card p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs uppercase font-black text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" /> Today's Lecture Schedule
            </h3>
            <button onClick={() => navigate('/student/timetable')} className="text-[10px] text-primary font-black hover:underline flex items-center gap-1">
              Full Schedule <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {todaySlots.length > 0 ? (
              todaySlots.map((slot: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 border rounded-xl bg-background hover:border-primary/10 transition-colors">
                  <div className="text-left">
                    <span className="text-[9px] font-black text-primary tracking-wider uppercase">{slot.dayOfWeek} · Period {slot.slotIndex} ({slot.startTime} - {slot.endTime})</span>
                    <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{slot.subject?.name}</h5>
                    <p className="text-[10px] text-muted-foreground font-semibold">Faculty: {slot.faculty?.firstName} {slot.faculty?.lastName} · Room {slot.roomNo}</p>
                  </div>
                  {slot.isLab ? (
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Lab</span>
                  ) : (
                    <span className="bg-primary/5 text-primary border border-primary/10 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Lecture</span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-xl">
                <Clock className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs text-muted-foreground mt-2 font-bold">No lectures scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Profile & Mentor Summary */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
          <h3 className="text-xs uppercase font-black text-muted-foreground tracking-wider flex items-center gap-1.5">
            <User className="h-4 w-4 text-primary" /> Advisor & Mentor
          </h3>
          <div className="p-4 border rounded-xl bg-background space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-50 border flex items-center justify-center font-black text-indigo-700 text-sm">
                {student?.mentor ? `${student.mentor.firstName[0]}${student.mentor.lastName[0]}` : 'FA'}
              </div>
              <div className="text-xs">
                <h5 className="font-extrabold text-slate-800 dark:text-white">
                  {student?.mentor ? `${student.mentor.firstName} ${student.mentor.lastName}` : 'Ada Lovelace'}
                </h5>
                <p className="text-[9px] text-muted-foreground font-bold">{student?.mentor?.designation || 'Class Advisor & Mentor'}</p>
              </div>
            </div>
            {mentorMessages.length > 0 ? (
              <div className="border-t pt-3 space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase">Recent messages</p>
                {mentorMessages.map((msg: any, i: number) => (
                  <div key={i} className="bg-card p-2 rounded border text-[10px] leading-relaxed">
                    {msg.message}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic border-t pt-2.5">No new unread messages from your mentor.</p>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-left">
          <h3 className="text-xs uppercase font-black text-muted-foreground tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" /> Attendance Trend
          </h3>
          <div className="h-36 flex items-end justify-between gap-2 border-b pb-1 pt-4">
            {/* Visual SVG representation of monthly trend */}
            {[
              { m: 'Jun', p: 95 },
              { m: 'Jul', p: 92 },
              { m: 'Aug', p: 89 },
              { m: 'Sep', p: 94 },
              { m: 'Oct', p: metrics.attendancePercentage }
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                <span className="text-[8px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.p}%
                </span>
                <div className="w-full bg-primary/10 rounded-t-md group-hover:bg-primary/20 transition-all relative" style={{ height: `${d.p * 0.8}px` }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md" style={{ height: '70%' }}></div>
                </div>
                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">{d.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CGPA Trend Chart */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-left">
          <h3 className="text-xs uppercase font-black text-muted-foreground tracking-wider flex items-center gap-1.5">
            <Award className="h-4 w-4 text-primary" /> CGPA Growth
          </h3>
          <div className="h-36 flex items-end justify-between gap-4 border-b pb-1 pt-4">
            {[
              { sem: 'Sem 1', gpa: 8.8 },
              { sem: 'Sem 2', gpa: 9.1 },
              { sem: 'Sem 3', gpa: 9.4 },
              { sem: 'Sem 4', gpa: metrics.cgpa }
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                <span className="text-[8px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.gpa}
                </span>
                <div className="w-full bg-indigo-50 dark:bg-indigo-950/20 rounded-t-md group-hover:bg-indigo-100 transition-all relative" style={{ height: `${d.gpa * 8}px` }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-indigo-600 rounded-t-md" style={{ height: '85%' }}></div>
                </div>
                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">{d.sem}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Completion & Semester Progress */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-5 text-left flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-black text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" /> Academic Completion
            </h3>
            
            {/* Credit completion radial-like progression using CSS */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-white">
                <span>Credit Completion</span>
                <span>{metrics.completedCredits} / {student?.program?.credits || 160} Credits</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-indigo-600 rounded-full" style={{ width: `${Math.min(100, (metrics.completedCredits / (student?.program?.credits || 160)) * 100)}%` }}></div>
              </div>
            </div>

            {/* Semester Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-white">
                <span>Semester Progress</span>
                <span>65%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-3 border rounded-xl bg-background text-xs font-bold text-slate-600">
              <span className="text-[9px] font-black text-slate-400 block uppercase">Leave Balance</span>
              <span>12 days left</span>
            </div>
            <div className="p-3 border rounded-xl bg-background text-xs font-bold text-slate-600">
              <span className="text-[9px] font-black text-slate-400 block uppercase">OD Approved</span>
              <span>4 Approved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulletins & Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HOD Circulars & Bulletins */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-xs uppercase font-black text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-primary" /> Bulletins & Circulars
            </h3>
            <button onClick={() => navigate('/student/circulars')} className="text-[10px] text-primary font-black hover:underline flex items-center gap-1">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {circulars.length > 0 ? (
              circulars.map((circular: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-xl bg-background flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-extrabold text-slate-800 dark:text-white">{circular.title}</h5>
                    <p className="text-[9px] text-muted-foreground font-semibold">Category: {circular.category} · Published: {new Date(circular.publishedAt || circular.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-6 text-center">No recent bulletins from the department HOD.</p>
            )}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-xs uppercase font-black text-muted-foreground tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-primary" /> Upcoming Examinations
            </h3>
            <button onClick={() => navigate('/student/examinations')} className="text-[10px] text-primary font-black hover:underline flex items-center gap-1">
              View Schedule <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingExams.length > 0 ? (
              upcomingExams.map((exam: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-xl bg-background flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-extrabold text-slate-800 dark:text-white">{exam.name}</h5>
                    <p className="text-[9px] text-muted-foreground font-semibold">Type: {exam.type} · Starts: {new Date(exam.startDate).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Scheduled</span>
                </div>
              ))
            ) : (
              <div className="p-4 border border-dashed rounded-xl text-center">
                <AlertTriangle className="h-6 w-6 text-slate-300 mx-auto" />
                <p className="text-xs text-muted-foreground mt-2 font-bold">No examinations currently scheduled.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
