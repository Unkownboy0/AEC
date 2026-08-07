import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Clock, BookOpen, FileCheck, Calendar, Award,
  CheckCircle2, Bell, AlertCircle, ChevronRight, FileText,
  Sparkles, DollarSign, Megaphone, ArrowUpRight
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../design-system/components/PageHeader';
import { QuickActionCard } from '../../design-system/components/QuickActionCard';
import { SummaryStatCard } from '../../design-system/components/SummaryStatCard';
import { SectionCard } from '../../design-system/components/SectionCard';
import { StatusBadge } from '../../design-system/components/StatusBadge';

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
        if (res.data?.status === 'success') {
          setDashboardData(res.data.data);
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
        <Loading text="Loading student portal..." />
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
  };
  const todaySlots = dashboardData?.todaySlots || [];
  const upcomingExams = dashboardData?.upcomingExams || [];
  const circulars = dashboardData?.circulars || [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${student?.firstName || user?.firstName || 'Student'}! 👋`}
        subtitle={`${student?.program?.name || 'Academic Program'} · ${student?.department?.name || 'Department'} (Sem ${student?.semester?.number || 1})`}
        badge={
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full">
            Roll: {student?.admissionNo || 'STU-101'}
          </span>
        }
      />

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        <QuickActionCard
          title="Timetable"
          description="View today's schedule"
          icon={<Clock className="w-5 h-5" />}
          to="/student/timetable"
          variant="primary"
        />
        <QuickActionCard
          title="Attendance"
          description="Check period logs"
          icon={<CheckCircle2 className="w-5 h-5" />}
          to="/student/attendance"
          variant="success"
        />
        <QuickActionCard
          title="Leave & OD"
          description="Apply or track requests"
          icon={<FileCheck className="w-5 h-5" />}
          to="/student/requests"
          variant="amber"
        />
        <QuickActionCard
          title="Assignments"
          description="View pending tasks"
          icon={<BookOpen className="w-5 h-5" />}
          to="/student/assignments"
        />
      </div>

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryStatCard
          title="Overall Attendance"
          value={`${metrics.attendancePercentage}%`}
          subtitle="Requirement: >75%"
          trend={{ value: 'Above target', isPositive: true }}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
          onClick={() => navigate('/student/attendance')}
        />
        <SummaryStatCard
          title="Academic CGPA"
          value={metrics.cgpa}
          subtitle={`${metrics.completedCredits} credits earned`}
          icon={<Award className="w-5 h-5" />}
          variant="primary"
          onClick={() => navigate('/student/results')}
        />
        <SummaryStatCard
          title="Pending Submissions"
          value={metrics.pendingAssignmentsCount + metrics.pendingHomeworkCount}
          subtitle="1 Assignment, 2 Homeworks"
          icon={<BookOpen className="w-5 h-5" />}
          variant="amber"
          onClick={() => navigate('/student/assignments')}
        />
        <SummaryStatCard
          title="Leave / OD Status"
          value={metrics.leaveStatus || 'Active'}
          subtitle="Recent request decision"
          icon={<FileCheck className="w-5 h-5" />}
          variant="default"
          onClick={() => navigate('/student/requests')}
        />
      </div>

      {/* Main Grid: Today's Schedule & Circulars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
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
                <p className="mt-1 text-slate-400">Enjoy your free day or work on assignments!</p>
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
                        Period {slot.period || idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {slot.subjectName || slot.subjectCode || 'Lecture Session'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {slot.facultyName || 'Faculty'} · Room {slot.roomNo || 'TBD'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {slot.startTime || '09:00'} - {slot.endTime || '10:00'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Upcoming Examinations */}
          <SectionCard
            title="Upcoming Examinations"
            subtitle="Scheduled internal and end-semester exams"
          >
            {upcomingExams.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No upcoming exam dates published.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingExams.map((exam: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {exam.subjectName || exam.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {exam.examType || 'Internal Test'} · Max Marks: {exam.maxMarks || 100}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                        {exam.date || 'TBD'}
                      </span>
                      <span className="text-[10px] text-slate-400">{exam.time || '10:00 AM'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar: Circulars & Alerts (1 Column) */}
        <div className="space-y-6">
          <SectionCard
            title="Important Circulars"
            subtitle="Latest notice updates from college"
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
                    onClick={() => navigate(`/student/circulars/${c.id}`)}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 hover:border-indigo-300 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {c.category || 'General'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt || Date.now()).toLocaleDateString()}
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
      </div>
    </div>
  );
};

export default StudentDashboard;
