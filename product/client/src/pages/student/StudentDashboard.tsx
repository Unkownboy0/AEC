import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Clock, BookOpen, FileCheck, Calendar, Award,
  CheckCircle2, Bell, AlertCircle, ChevronRight, FileText,
  Sparkles, DollarSign, Megaphone, ArrowUpRight, Bus, Home,
  ShieldCheck, HelpCircle, GraduationCap, CreditCard, Layers
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../design-system/components/PageHeader';
import { QuickActionCard } from '../../design-system/components/QuickActionCard';
import { SummaryStatCard } from '../../design-system/components/SummaryStatCard';
import { SectionCard } from '../../design-system/components/SectionCard';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/enterprise/students/dashboard-summary');
        if (res.data?.status === 'success' || res.data?.success) {
          setDashboardData(res.data.data ?? res.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard details:', err);
        toast.error('Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loading text="Loading student workspace..." />
      </div>
    );
  }

  const student = dashboardData?.student;
  const metrics = dashboardData?.metrics || {};
  const todaySlots = dashboardData?.todaySlots || [];
  const nextClass = dashboardData?.nextClass || (todaySlots.length > 0 ? todaySlots[0] : null);
  const upcomingExams = dashboardData?.upcomingExams || [];
  const circulars = dashboardData?.circulars || [];
  const notifications = dashboardData?.notifications || [];

  const isTransportEligible = metrics.isTransportEligible || Boolean(student?.transportRouteId || student?.transportStopId);
  const isHostelEligible = metrics.isHostelEligible || Boolean(student?.hostelId || student?.roomNo);

  const studentName = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : (user?.firstName || 'Student');
  const programText = student?.program?.name ? `${student.program.name}` : (student?.department?.name || 'Academic Program');
  const semText = student?.semester?.number ? `Semester ${student.semester.number}` : (student?.semester?.name || '');

  return (
    <main className="mx-auto max-w-[1440px] space-y-5 pb-24 text-left sm:space-y-7 sm:pb-14 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${studentName}! 👋`}
        subtitle={`${programText} ${semText ? `· ${semText}` : ''}`}
        badge={
          student?.admissionNo ? (
            <span className="px-3 py-1 text-xs font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200/50">
              Admission No: {student.admissionNo}
            </span>
          ) : null
        }
      />

      {/* Immediate Attention Card: "What does the student need right now?" */}
      <section aria-label="Current status highlight" className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-400/20 text-indigo-200 border border-indigo-400/30">
                <Sparkles className="w-3 h-3 text-amber-300" /> Right Now
              </span>
              {nextClass && (
                <span className="text-xs text-indigo-200 font-medium">
                  {nextClass.startTime ? `Starts at ${nextClass.startTime}` : 'Next scheduled session'}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">
              {nextClass ? (
                <>Next Class: <span className="text-indigo-200 font-extrabold">{nextClass.subjectName || nextClass.subject?.name || nextClass.subjectCode || 'Lecture Session'}</span></>
              ) : (
                <>No More Scheduled Classes Today</>
              )}
            </h2>
            <p className="text-xs text-slate-300">
              {nextClass ? (
                <>{nextClass.facultyName ? `Faculty: ${nextClass.facultyName} · ` : ''}Room: {nextClass.roomNo || 'TBD'} · Period {nextClass.period || nextClass.slotIndex || 1}</>
              ) : (
                <>All scheduled lectures for today are complete. Work on assignments or review course materials.</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/student/id-card')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
            >
              <CreditCard className="w-4 h-4 text-indigo-300" />
              <span>Digital ID</span>
            </button>
            <button
              onClick={() => navigate('/student/timetable')}
              className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md"
            >
              <span>Full Schedule</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Primary Academic KPIs */}
      <section aria-label="Academic summary" className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <SummaryStatCard
          title="Overall Attendance"
          value={metrics.attendancePercentage !== null && metrics.attendancePercentage !== undefined ? `${metrics.attendancePercentage}%` : 'N/A'}
          subtitle="Requirement: >75%"
          trend={metrics.attendancePercentage >= 75 ? { value: 'Above requirement', isPositive: true } : { value: 'Shortage alert', isPositive: false }}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant={metrics.attendancePercentage >= 75 ? 'success' : 'amber'}
          onClick={() => navigate('/student/attendance')}
        />
        <SummaryStatCard
          title="Academic Performance"
          value={metrics.cgpa !== null && metrics.cgpa !== undefined ? `CGPA ${metrics.cgpa}` : 'Results Published'}
          subtitle={metrics.completedCredits ? `${metrics.completedCredits} credits earned` : 'Internal marks & GPA'}
          icon={<Award className="w-5 h-5" />}
          variant="primary"
          onClick={() => navigate('/student/results')}
        />
        <SummaryStatCard
          title="Pending Submissions"
          value={(metrics.pendingAssignmentsCount || 0) + (metrics.pendingHomeworkCount || 0)}
          subtitle="Assignments & Homework"
          icon={<BookOpen className="w-5 h-5" />}
          variant="amber"
          onClick={() => navigate('/student/assignments')}
        />
        <SummaryStatCard
          title="Fee Dues Balance"
          value={metrics.feeDuesAmount ? `₹${metrics.feeDuesAmount.toLocaleString('en-IN')}` : 'Clear'}
          subtitle={metrics.feeDuesAmount ? 'Pending balance payment' : 'No outstanding fees'}
          icon={<DollarSign className="w-5 h-5" />}
          variant={metrics.feeDuesAmount ? 'amber' : 'success'}
          onClick={() => navigate('/student/fees')}
        />
      </section>

      {/* Full Feature Workspace Bento Grid */}
      <section aria-label="Student services" className="space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          Student Workspace Services
        </h3>
        
        <div className="grid grid-cols-2 gap-3 min-[540px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-4">
          <button
            onClick={() => navigate('/student/id-card')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-slate-800 dark:text-white">Digital ID</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Verification QR</span>
          </button>

          <button
            onClick={() => navigate('/student/timetable')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-slate-800 dark:text-white">Today's Classes</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Live timetable</span>
          </button>

          <button
            onClick={() => navigate('/student/attendance')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-slate-800 dark:text-white">Attendance</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Period logs</span>
          </button>

          <button
            onClick={() => navigate('/student/assignments')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-slate-800 dark:text-white">Assignments</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Course submissions</span>
          </button>

          <button
            onClick={() => navigate('/student/results')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-slate-800 dark:text-white">Internal Marks</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Semester results</span>
          </button>

          <button
            onClick={() => navigate('/student/leave-od')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-slate-800 dark:text-white">Leave & OD</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Apply & track</span>
          </button>

          <button
            onClick={() => navigate('/student/fees')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-slate-800 dark:text-white">Fee Receipts</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Pay & receipts</span>
          </button>

          <button
            onClick={() => navigate('/student/certificates')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-slate-800 dark:text-white">Documents</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Request & Vault</span>
          </button>

          <button
            onClick={() => navigate('/student/achievements')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-slate-800 dark:text-white">Achievements</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Verified showcase</span>
          </button>

          <button
            onClick={() => navigate('/student/placements')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-slate-800 dark:text-white">Placements</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Drives & Career</span>
          </button>

          <button
            onClick={() => navigate('/student/circulars')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <Megaphone className="w-5 h-5" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-slate-800 dark:text-white">Circulars</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Campus notices</span>
          </button>

          <button
            onClick={() => navigate('/student/notifications')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-slate-800 dark:text-white">Notifications</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Alerts & messages</span>
          </button>

          {/* Conditional Transport Card (ONLY IF ELIGIBLE) */}
          {isTransportEligible && (
            <button
              onClick={() => navigate('/student/transport')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:shadow-md transition-all text-center group"
            >
              <div className="p-3 rounded-xl bg-indigo-600 text-white group-hover:scale-110 transition-transform">
                <Bus className="w-5 h-5" />
              </div>
              <span className="mt-2.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">Transport</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">Bus route & tracking</span>
            </button>
          )}

          {/* Conditional Hostel Card (ONLY IF ELIGIBLE) */}
          {isHostelEligible && (
            <button
              onClick={() => navigate('/student/hostel')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:shadow-md transition-all text-center group"
            >
              <div className="p-3 rounded-xl bg-emerald-600 text-white group-hover:scale-110 transition-transform">
                <Home className="w-5 h-5" />
              </div>
              <span className="mt-2.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">Hostel</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Room & Warden</span>
            </button>
          )}
        </div>
      </section>

      {/* Main Timetable & Circulars Grid */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3 xl:gap-6">
        <div className="space-y-5 xl:col-span-2 xl:space-y-6">
          <SectionCard
            title="Today's Timetable"
            subtitle="Your scheduled lectures and lab sessions"
            action={
              <button
                onClick={() => navigate('/student/timetable')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 inline-flex items-center gap-1"
              >
                <span>Full Schedule</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            {todaySlots.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50 text-indigo-500" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No Classes Scheduled Today</p>
                <p className="mt-1 text-slate-400">Enjoy your free day or work on pending submissions!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySlots.map((slot: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg text-center min-w-[64px]">
                        Period {slot.period || slot.slotIndex || idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {slot.subjectName || slot.subject?.name || slot.subjectCode || 'Lecture Session'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {slot.facultyName || (slot.faculty ? `${slot.faculty.firstName} ${slot.faculty.lastName}` : 'Faculty')} · Room {slot.roomNo || 'TBD'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                      {slot.startTime || '09:00'} - {slot.endTime || '10:00'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* COE Examinations Schedule */}
          <SectionCard
            title="COE Examination Schedule"
            subtitle="Authoritative Controller of Examinations published schedule & seat allocation"
            action={
              <button
                onClick={() => navigate('/student/examinations')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View Hall Allotment
              </button>
            }
          >
            {upcomingExams.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No upcoming exam dates published by COE.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingExams.slice(0, 3).map((exam: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {exam.subjectName || exam.name || exam.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {exam.type || exam.examType || 'End-Semester Exam'} · Max Marks: {exam.maxMarks || 100}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                        {exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'TBD'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar: Circulars & Announcements */}
        <div className="space-y-6">
          <SectionCard
            title="Important Circulars"
            subtitle="Latest announcements from Dean & Institution"
            action={
              <button
                onClick={() => navigate('/student/circulars')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                All Notices
              </button>
            }
          >
            {circulars.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <Megaphone className="w-6 h-6 mx-auto mb-2 text-indigo-500 opacity-60" />
                No new circulars.
              </div>
            ) : (
              <div className="space-y-3">
                {circulars.slice(0, 4).map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/student/circulars`)}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 hover:border-indigo-300 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {c.category || c.broadcastLevel || 'Notice'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.publishedAt || c.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {c.title}
                    </h5>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </section>
    </main>
  );
};

export default StudentDashboard;
