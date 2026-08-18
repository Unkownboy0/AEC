import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserCheck, UserX, AlertTriangle, FileText, CheckCircle2,
  Calendar, ArrowUpRight, MessageSquare, Megaphone, Clock, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useRealtimeSync } from '../../../hooks/useRealtimeSync';
import { PageHeader } from '../../../design-system/components/PageHeader';
import { SummaryStatCard } from '../../../design-system/components/SummaryStatCard';
import { SectionCard } from '../../../design-system/components/SectionCard';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { pageVariants } from '../../../design-system/tokens/motion';

export const ClassAdviserDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch Class Adviser section data scoped strictly to assigned section
  const { data: syncData, isLoading, error: syncError, refetch } = useRealtimeSync(
    ['class-adviser-dashboard-summary', user?.id || ''],
    '/faculty/class-adviser/dashboard',
    { intervalMs: 12000 }
  );

  const data: any = syncData;

  if (isLoading && !data) {
    return <Skeleton variant="card" count={4} />;
  }

  if (syncError && !data) {
    return (
      <ErrorState
        title="Class Adviser Workspace Error"
        message={syncError.message || 'Unable to load assigned section data.'}
        onRetry={refetch}
      />
    );
  }

  const assignedSection = data?.assignedSection || {
    name: 'Class Section Adviser',
    code: 'SEC-A',
    department: user?.department || 'Department',
    totalStudents: data?.classStrength || data?.totalStudents || 42,
    presentToday: data?.presentToday || 38,
    absentToday: data?.absentToday || 4,
    attendancePending: data?.attendancePending || 0,
    attendanceRiskCount: data?.attendanceRiskCount || 3,
    academicRiskCount: data?.academicRiskCount || 2,
  };

  const pendingLeaveRequests = data?.pendingSectionLeaves || [];
  const upcomingEvents = data?.upcomingEvents || [];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 pb-12"
    >
      {/* Class Adviser Page Header */}
      <PageHeader
        title="Class Adviser Command Center"
        subtitle={`Class Advisement & Student Governance · ${assignedSection.name} (${assignedSection.code})`}
        primaryAction={{
          label: `Class Roster (${assignedSection.totalStudents})`,
          onClick: () => navigate('/class-adviser/students'),
          icon: <Users className="w-4 h-4" />,
        }}
      />

      {/* Class/Section Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryStatCard
          title="Class Strength"
          value={assignedSection.totalStudents}
          subtitle="Enrolled students"
          iconName="students"
          variant="blue"
          onClick={() => navigate('/class-adviser/students')}
        />
        <SummaryStatCard
          title="Present Today"
          value={assignedSection.presentToday}
          subtitle={`${assignedSection.absentToday} absent today`}
          iconName="faculty"
          variant="success"
          onClick={() => navigate('/class-adviser/attendance')}
        />
        <SummaryStatCard
          title="Attendance Risk (<75%)"
          value={assignedSection.attendanceRiskCount}
          subtitle="Requires parent notification"
          iconName="leaveOd"
          variant="amber"
          onClick={() => navigate('/class-adviser/students')}
        />
        <SummaryStatCard
          title="Academic Risk"
          value={assignedSection.academicRiskCount}
          subtitle="Students needing intervention"
          iconName="institution"
          variant="purple"
          onClick={() => navigate('/class-adviser/academics')}
        />
      </div>

      {/* Class Adviser Quick Action Pills */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['My Class Roster', '/class-adviser/students', Users],
          ['Class Attendance', '/class-adviser/attendance', UserCheck],
          ['Student Leave / OD', '/class-adviser/leave-od', FileText],
          ['Academic Progress', '/class-adviser/academics', Award],
        ].map(([title, route, Icon]: any) => (
          <button
            key={title}
            onClick={() => navigate(route)}
            className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl text-left text-xs font-bold text-foreground hover:border-primary/50 transition-all shadow-xs"
          >
            <span className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary" />
              {title}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Section Leave & OD Requests */}
      <SectionCard
        title="Class Student Leave & OD Requests"
        subtitle="Incoming leave applications for your assigned section"
        action={
          <button
            onClick={() => navigate('/class-adviser/leave-od')}
            className="text-xs font-semibold text-primary hover:underline"
          >
            View All Approvals
          </button>
        }
      >
        {pendingLeaveRequests.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/80" />
            No pending leave or OD requests for your class.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingLeaveRequests.slice(0, 4).map((req: any) => (
              <div
                key={req.id}
                onClick={() => navigate(`/class-adviser/leave-od/${req.id}`)}
                className="p-3.5 bg-muted/40 rounded-xl border border-border hover:border-primary/40 cursor-pointer transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    {req.applicantName || req.student?.user?.firstName || 'Student'}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {req.leaveType || 'Leave'} · {req.reason || 'Personal'} ({req.startDate})
                  </p>
                </div>
                <StatusBadge status={req.status || 'PENDING'} size="sm" />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Class Notices & Upcoming Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Class Announcements" subtitle="Notices and circulars for your section">
          <div className="space-y-2">
            <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-3">
              <Megaphone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-foreground">Mid-Semester Mark Entry Deadline</h5>
                <p className="text-[11px] text-muted-foreground mt-0.5">Ensure all subject faculty have updated internal marks.</p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Parent Follow-up Required" subtitle="Students requiring advisor-parent contact">
          <div className="space-y-2">
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3">
              <MessageSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-foreground">Attendance Shortage Warnings</h5>
                <p className="text-[11px] text-muted-foreground mt-0.5">3 students below 75% aggregate attendance threshold.</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
};

export default ClassAdviserDashboardPage;
