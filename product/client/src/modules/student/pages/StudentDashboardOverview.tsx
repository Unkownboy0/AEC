import React from 'react';
import { DesktopAppLayout } from '../../../layouts/DesktopAppLayout/DesktopAppLayout';
import { DashboardPattern } from '../../../design-system/patterns/DashboardPattern/DashboardPattern';
import { Calendar, Clock, FileText, Award, CreditCard, BookOpen } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export const StudentDashboardOverview: React.FC = () => {
  const { user } = useAuth();

  const metrics = [
    { id: 'm1', label: 'Overall Attendance', value: '88.5%', trend: { value: '+1.2% this month', direction: 'up' as const }, icon: <Clock /> },
    { id: 'm2', label: 'Pending Assignments', value: '2', subtitle: 'Due this week', icon: <FileText /> },
    { id: 'm3', label: 'Upcoming Exams', value: '1', subtitle: 'Mid-term in 4 days', icon: <Calendar /> },
    { id: 'm4', label: 'Fee Dues', value: '₹0', subtitle: 'All clear', icon: <CreditCard /> },
  ];

  const quickActions = [
    { id: 'a1', label: 'View Timetable', icon: <Calendar />, onClick: () => window.location.href = '/student/timetable' },
    { id: 'a2', label: 'Check Attendance', icon: <Clock />, onClick: () => window.location.href = '/student/attendance' },
    { id: 'a3', label: 'Apply Leave / OD', icon: <FileText />, onClick: () => window.location.href = '/student/leave-od' },
    { id: 'a4', label: 'View Assignments', icon: <BookOpen />, badge: 2, onClick: () => window.location.href = '/student/assignments' },
    { id: 'a5', label: 'Internal Marks', icon: <Award />, onClick: () => window.location.href = '/student/results' },
    { id: 'a6', label: 'Fee Payments', icon: <CreditCard />, onClick: () => window.location.href = '/student/fees' },
  ];

  return (
    <DesktopAppLayout>
      <DashboardPattern
        greeting="Good morning"
        userName={user?.firstName || 'Student'}
        roleTitle="Student"
        metrics={metrics}
        quickActions={quickActions}
        mainContent={
          <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-section-title font-semibold text-foreground">Today's Schedule</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-raised border border-border rounded-md">
                <div>
                  <p className="text-body font-semibold text-foreground">Data Structures & Algorithms</p>
                  <p className="text-caption-sm text-muted-foreground">09:00 AM - 10:00 AM • Room 302</p>
                </div>
                <span className="text-caption font-medium text-success bg-success-light px-2 py-0.5 rounded-pill">Completed</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface border border-primary/30 rounded-md">
                <div>
                  <p className="text-body font-semibold text-foreground">Database Management Systems</p>
                  <p className="text-caption-sm text-muted-foreground">10:15 AM - 11:15 AM • Lab 2</p>
                </div>
                <span className="text-caption font-medium text-primary bg-accent px-2 py-0.5 rounded-pill">Next Up</span>
              </div>
            </div>
          </div>
        }
        secondaryContent={
          <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-section-title font-semibold text-foreground">Announcements</h3>
            <div className="space-y-3">
              <div className="p-3 border-l-2 border-primary bg-raised rounded-r-md space-y-1">
                <p className="text-caption font-semibold text-foreground">Mid-Term Examination Schedule</p>
                <p className="text-caption-sm text-muted-foreground line-clamp-2">The mid-term exam schedule for Semester 5 has been published. Check portal.</p>
              </div>
            </div>
          </div>
        }
      />
    </DesktopAppLayout>
  );
};

export default StudentDashboardOverview;
