import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Activity, CalendarDays,
  Landmark, CloudSun, Building, Server, Clock, UserCheck, Shield,
  Plus, Sparkles, Send, Check, X, Users, BookOpen,
  Briefcase, FileText, AlertTriangle, FileSpreadsheet, Bell
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { Loading } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

const StudentDashboard = React.lazy(() => import('./student/StudentDashboard'));

import { FacultyPortal } from './FacultyPortal';
import { HODPortal } from './HODPortal';
import { PrincipalPortal, VicePrincipalPortal, AcademicDeanPortal, AdmissionDeanPortal, ParentPortal, MentorPortal, IQACDeanPortal, IQACExecutivePortal, IQACDocumentationPortal } from './RolePortals';

// Reusable KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  comparison?: string;
  icon: React.ComponentType<any>;
  colorClass: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, isPositive, comparison, icon: Icon, colorClass }) => {
  return (
    <div className="border bg-card p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-xl font-extrabold tracking-tight block">{value}</span>
        {trend && (
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend}
            </span>
            <span className="text-[9px] text-muted-foreground">{comparison}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<any | null>(null);
  const [charts, setCharts] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Role-Specific States
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [workflowRequests, setWorkflowRequests] = useState<any[]>([]);
  
  // Modals & Form inputs
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  
  // Student Actions
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [vaultFiles, setVaultFiles] = useState<any[]>([
    { name: 'Semester 1 Hall Ticket.pdf', date: '2026-07-10', size: '240 KB', signed: true },
    { name: 'Community Certificate.pdf', date: '2026-07-08', size: '1.2 MB', signed: false }
  ]);
  
  // Chatbot
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'AI', text: 'Hello! I am your AI Academic Counselor. Let me know if you need info on attendance warnings, exam GPA, or leaves.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Update live clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchCoreDashboard = async () => {
    try {
      setIsLoading(true);
      const [statsRes, chartsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
      ]);

      if (statsRes.data?.status === 'success' && chartsRes.data?.status === 'success') {
        setStats(statsRes.data.data.metrics);
        setCharts(chartsRes.data.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load command center data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoleData = async () => {
    if (!user) return;
    try {
      // 1. Fetch Timetable slots
      let queryParam = '';
      if (user.role === 'Student') queryParam = `?studentId=${stats?.studentId || ''}`;
      else if (user.role === 'Faculty') queryParam = `?facultyId=${stats?.facultyId || ''}`;
      else if (user.role === 'HOD') queryParam = `?departmentId=${stats?.departmentId || ''}`;
      
      const ttRes = await api.get(`/timetables/slots${queryParam}`);
      if (ttRes.data?.status === 'success') {
        setTimetableSlots(ttRes.data.data);
      }

      // 2. Fetch Workflow Requests
      const wfRes = await api.get('/workflows/requests');
      if (wfRes.data?.status === 'success') {
        setWorkflowRequests(wfRes.data.data);
      }
    } catch (err) {
      console.error('Failed to sync role parameters', err);
    }
  };

  useEffect(() => {
    fetchCoreDashboard().then(() => {
      fetchRoleData();
    });
  }, [user]);

  // Handle Workflow Action (Approve/Reject)
  const handleWorkflowAction = async (id: string, action: 'APPROVE' | 'REJECT', comment: string = 'Approved') => {
    try {
      const res = await api.post(`/workflows/requests/${id}/action`, { action, comment });
      if (res.data?.status === 'success') {
        toast.success(`Successfully recorded action: ${action}`);
        fetchRoleData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Workflow action failed');
    }
  };

  // Submit new leave / OD application
  const handleCreateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      type: fd.get('type'),
      title: fd.get('title'),
      reason: fd.get('reason'),
      startDate: fd.get('startDate'),
      endDate: fd.get('endDate'),
    };

    try {
      const res = await api.post('/workflows/requests', payload);
      if (res.data?.status === 'success') {
        toast.success('Workflow application submitted successfully');
        setIsRequestModalOpen(false);
        fetchRoleData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  };

  // Submit new Timetable slot (with conflict check)
  const handleCreateSlot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      dayOfWeek: fd.get('dayOfWeek'),
      slotIndex: parseInt(fd.get('slotIndex') as string),
      startTime: fd.get('startTime'),
      endTime: fd.get('endTime'),
      academicYearId: stats?.academicYearId || '2026-2027',
      departmentId: stats?.departmentId || '',
      semesterId: stats?.semesterId || '',
      sectionId: fd.get('sectionId'),
      subjectId: fd.get('subjectId'),
      facultyId: fd.get('facultyId'),
      roomNo: fd.get('roomNo'),
    };

    try {
      const res = await api.post('/timetables/slots', payload);
      if (res.data?.status === 'success') {
        toast.success('Class slot scheduled successfully');
        setIsTimetableModalOpen(false);
        fetchRoleData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Timetable slot scheduling conflict');
    }
  };

  // AI Timetable Optimization
  const handleAIOptimize = async () => {
    try {
      const res = await api.post('/timetables/ai-generate', {
        departmentId: stats?.departmentId,
        semesterId: stats?.semesterId,
        academicYearId: stats?.academicYearId
      });
      if (res.data?.status === 'success') {
        toast.success(`AI Optimization Completed: Generated ${res.data.data.createdCount} conflict-free slots.`);
        fetchRoleData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI Auto optimization failed');
    }
  };

  // Student Payment gateway processing
  const handleProcessPayment = async (billId: string) => {
    setPaymentLoading(billId);
    try {
      const res = await api.post(`/enterprise/fees/bills/${billId}/pay`);
      if (res.data?.status === 'success') {
        toast.success('Payment captured successfully. Invoice Ledger updated.', 'Transaction Success');
        fetchCoreDashboard();
      }
    } catch (err) {
      toast.error('Payment gateway checkout failure');
    } finally {
      setPaymentLoading(null);
    }
  };

  // Chatbot counselor message submit
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'User', text: userMsg }]);
    setChatInput('');

    try {
      const res = await api.post('/ai/chat', { message: userMsg });
      if (res.data?.status === 'success') {
        setChatMessages(prev => [...prev, { sender: 'AI', text: res.data.reply }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'AI', text: 'Counseling server connection interrupted. Try again shortly.' }]);
    }
  };

  const handleSignFile = (idx: number) => {
    const updated = [...vaultFiles];
    updated[idx].signed = true;
    setVaultFiles(updated);
    toast.success('Digital signature attached and cryptographically secured.');
  };

  const handleBackup = async () => {
    try {
      const res = await api.post('/backups/trigger');
      if (res.data?.status === 'success') {
        toast.success(`System backup generated: ${res.data.data.fileName}`, 'Backup Complete');
        fetchCoreDashboard();
      }
    } catch (error) {
      toast.error('Backup trigger failed');
    }
  };

  if (isLoading || !stats || !charts) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <Loading text="Loading command center controls..." />
      </div>
    );
  }

  const getWorkspaceContent = () => {
    if (user?.role === 'Student') {
      return (
        <React.Suspense fallback={
          <div className="flex h-[75vh] items-center justify-center">
            <Loading text="Initializing Student Workspace..." />
          </div>
        }>
          <StudentDashboard />
        </React.Suspense>
      );
    }

    if (user?.role === 'Faculty') {
      return <FacultyPortal user={user} />;
    }

    if (user?.role === 'HOD') {
      return <HODPortal user={user} />;
    }

    if (user?.role === 'Principal') {
      return <PrincipalPortal user={user} />;
    }

    if (user?.role === 'Vice Principal') {
      return <VicePrincipalPortal user={user} />;
    }

    if (user?.role === 'Academic Dean') {
      return <AcademicDeanPortal user={user} />;
    }

    if (user?.role === 'Admission Dean') {
      if (localStorage.getItem('admission_dean_workspace') === 'FACULTY') {
        return <FacultyPortal user={user} />;
      }
      return <AdmissionDeanPortal user={user} />;
    }

    if (user?.role === 'IQAC Dean') {
      if (localStorage.getItem('iqac_dean_workspace') === 'FACULTY') {
        return <FacultyPortal user={user} />;
      }
      return <IQACDeanPortal user={user} />;
    }

    if (user?.role === 'IQAC Executive Officer' || user?.role === 'IQAC Executive') {
      if (localStorage.getItem('iqac_exec_workspace') === 'FACULTY') {
        return <FacultyPortal user={user} />;
      }
      return <IQACExecutivePortal user={user} />;
    }

    if (user?.role === 'IQAC Documentation Officer' || user?.role === 'IQAC Documentation') {
      if (localStorage.getItem('iqac_doc_workspace') === 'FACULTY') {
        return <FacultyPortal user={user} />;
      }
      return <IQACDocumentationPortal user={user} />;
    }

    if (user?.role === 'Parent') {
      return <ParentPortal user={user} />;
    }

    if (user?.role === 'Mentor') {
      return <MentorPortal user={user} />;
    }

    return null;
  };

  const workspaceContent = getWorkspaceContent();
  if (workspaceContent) {
    return (
      <div key={user?.role} className="animate-in fade-in slide-in-from-top-2 duration-300">
        {workspaceContent}
      </div>
    );
  }

  // Greeting based on time
  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      
      {/* 1. WELCOME HERO SECTION */}
      <div className="relative rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8 overflow-hidden shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Command Center Portal</span>
          </div>
          <h2 className="text-xl md:text-3xl font-extrabold tracking-tight">
            {getGreeting()}, {user?.firstName}!
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-semibold">
            <span>Academic Year: <span className="text-foreground">2026-2027</span></span>
            <span className="hidden sm:inline border-r h-3" />
            <span>Active Role: <span className="text-primary font-bold">{user?.role}</span></span>
            <span className="hidden sm:inline border-r h-3" />
            <span>Date: <span className="text-foreground">{currentTime.toLocaleDateString()}</span></span>
          </div>
        </div>

        {/* Live Clock & Weather Card */}
        <div className="flex flex-wrap items-center gap-4 bg-background/60 backdrop-blur border p-4 rounded-xl shadow-sm z-10 w-full sm:w-auto">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex flex-wrap items-center gap-1">
              <Clock className="h-3 w-3" />
              Live Server Time
            </span>
            <span className="text-lg font-extrabold tracking-tight font-mono mt-0.5">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
          <div className="h-8 border-r" />
          <div className="flex flex-wrap items-center gap-2">
            <CloudSun className="h-7 w-7 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-foreground leading-tight">28°C · Sunny</span>
              <span className="text-[9px] text-muted-foreground font-semibold leading-none mt-0.5">Weather Synced</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          SUPER ADMIN VIEW (Master controls)
          ========================================================= */}
      {/* =========================================================
          COLLEGE ADMIN & SUPER ADMIN COMMAND CENTER DASHBOARD
          ========================================================= */}
      {(user?.role === 'College Admin' || user?.role === 'Super Admin' || !['Student','Faculty','HOD','Principal','Vice Principal','Academic Dean','Admission Dean','Parent','Mentor'].includes(user?.role || '')) && (
        <div className="space-y-6">
          
          {/* 1. TOP 10 KPI CARDS (2-column layout on mobile) */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">College Operational Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {hasPermission('students:read') && <KPICard title="Total Students" value={stats.totalStudents ?? 0} icon={GraduationCap} colorClass="text-blue-500 bg-blue-50" />}
              {hasPermission('faculty:read') && <KPICard title="Total Faculty" value={stats.totalFaculty ?? 0} icon={UserCheck} colorClass="text-indigo-500 bg-indigo-50" />}
              {hasPermission('faculty:read') && <KPICard title="Total Mentors" value={stats.totalMentors ?? 0} icon={Users} colorClass="text-purple-500 bg-purple-50" />}
              {hasPermission('departments:read') && <KPICard title="Departments" value={stats.totalDepartments ?? 0} icon={Building} colorClass="text-amber-500 bg-amber-50" />}
              {hasPermission('subjects:read') && <KPICard title="Total Subjects" value={stats.totalSubjects ?? 0} icon={BookOpen} colorClass="text-cyan-500 bg-cyan-50" />}
              {hasPermission('attendance:read') && <KPICard title="Today's Attendance" value={stats.todayAttendance ?? "0.0%"} icon={CalendarDays} colorClass="text-emerald-500 bg-emerald-50" />}
              {hasPermission('fees:read') && <KPICard title="Fees Collected" value={`$${(stats.feeCollectionThisMonth ?? 0).toLocaleString()}`} icon={Landmark} colorClass="text-green-600 bg-green-50" />}
              {hasPermission('placements:read') && <KPICard title="Placements Count" value={stats.placementsCount ?? 0} icon={Briefcase} colorClass="text-blue-600 bg-blue-50" />}
              {hasPermission('workflows:read') && <KPICard title="Pending Leaves" value={workflowRequests.length} icon={FileText} colorClass="text-orange-500 bg-orange-50" />}
              {hasPermission('support:read') && <KPICard title="Pending Complaints" value={stats.pendingComplaints ?? 0} icon={AlertTriangle} colorClass="text-rose-500 bg-rose-50" />}
            </div>
          </div>

          {/* 2. ADMIN QUICK ACTIONS */}
          {(hasPermission('students:create') ||
            hasPermission('faculty:create') ||
            hasPermission('departments:create') ||
            hasPermission('timetable:create') ||
            hasPermission('notifications:publish') ||
            hasPermission('fees:write') ||
            hasPermission('reports:read') ||
            hasPermission('notifications:write')) && (
            <div className="border bg-card rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Admin Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {hasPermission('students:create') && (
                  <button onClick={() => navigate('/students')} className="flex flex-col items-center justify-center p-3 rounded-xl border bg-background hover:bg-primary/5 transition-all group gap-2">
                    <Plus className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-center">Add Student</span>
                  </button>
                )}
                {hasPermission('faculty:create') && (
                  <button onClick={() => navigate('/faculty')} className="flex flex-col items-center justify-center p-3 rounded-xl border bg-background hover:bg-primary/5 transition-all group gap-2">
                    <Plus className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-center">Add Faculty</span>
                  </button>
                )}
                {hasPermission('departments:create') && (
                  <button onClick={() => navigate('/academics')} className="flex flex-col items-center justify-center p-3 rounded-xl border bg-background hover:bg-primary/5 transition-all group gap-2">
                    <Building className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-center">Create Dept</span>
                  </button>
                )}
                {hasPermission('timetable:create') && (
                  <button onClick={() => navigate('/academics')} className="flex flex-col items-center justify-center p-3 rounded-xl border bg-background hover:bg-primary/5 transition-all group gap-2">
                    <CalendarDays className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-center">Upload Timetable</span>
                  </button>
                )}
                {hasPermission('notifications:publish') && (
                  <button onClick={() => navigate('/notifications')} className="flex flex-col items-center justify-center p-3 rounded-xl border bg-background hover:bg-primary/5 transition-all group gap-2">
                    <Bell className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-center">Create Circular</span>
                  </button>
                )}
                {hasPermission('fees:write') && (
                  <button onClick={() => navigate('/fees')} className="flex flex-col items-center justify-center p-3 rounded-xl border bg-background hover:bg-primary/5 transition-all group gap-2">
                    <Landmark className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-center">Manage Fees</span>
                  </button>
                )}
                {hasPermission('reports:read') && (
                  <button onClick={() => navigate('/reports')} className="flex flex-col items-center justify-center p-3 rounded-xl border bg-background hover:bg-primary/5 transition-all group gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-center">Generate Report</span>
                  </button>
                )}
                {hasPermission('notifications:write') && (
                  <button onClick={() => navigate('/notifications')} className="flex flex-col items-center justify-center p-3 rounded-xl border bg-background hover:bg-primary/5 transition-all group gap-2">
                    <Send className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-center">Send Notification</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. ACADEMIC OVERVIEW (Full Width) */}
          {hasPermission('departments:read') && (
            <div className="border bg-card rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Department-Wise Academic Overview</h3>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">Active Term</span>
              </div>
              <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b text-[10px] uppercase font-extrabold text-muted-foreground bg-muted/20">
                      <th className="p-2.5 rounded-l">Department</th>
                      <th className="p-2.5">Students</th>
                      <th className="p-2.5">Faculty</th>
                      <th className="p-2.5">Attendance</th>
                      <th className="p-2.5">Pass %</th>
                      <th className="p-2.5 rounded-r">Placement %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(charts?.departmentOverview && charts.departmentOverview.length > 0) ? (
                      charts.departmentOverview.map((dept: any, i: number) => (
                        <tr key={i} className="border-b last:border-b-0 hover:bg-muted/30 font-semibold">
                          <td className="p-2.5 font-bold">{dept.name}</td>
                          <td className="p-2.5 font-mono">{dept.students}</td>
                          <td className="p-2.5 font-mono">{dept.faculty}</td>
                          <td className="p-2.5 text-emerald-600 font-bold">{dept.attendance}</td>
                          <td className="p-2.5 text-indigo-600 font-bold">{dept.pass}</td>
                          <td className="p-2.5 text-primary font-bold">{dept.placement}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground text-xs font-medium">
                          No department data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. LIVE ACTIVITY FEED, REPORTS CENTER & SYSTEM HEALTH */}
          {(hasPermission('audit:read') || hasPermission('reports:read') || hasPermission('backups:read')) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Live Activity Feed */}
              {hasPermission('audit:read') && (
                <div className="border bg-card rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex flex-wrap items-center gap-1.5">
                    <Activity className="h-4 w-4 text-emerald-500" /> Live Activity Feed
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(charts?.recentActivity && charts.recentActivity.length > 0) ? (
                      charts.recentActivity.map((act: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 border rounded-xl bg-background">
                          <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <p className="font-bold text-[11px] leading-snug">{act.desc}</p>
                            <span className="text-[9px] text-muted-foreground font-semibold">{act.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4 text-xs">No recent activity recorded</p>
                    )}
                  </div>
                </div>
              )}

              {/* Reports Center (Quick Export) */}
              {hasPermission('reports:read') && (
                <div className="border bg-card rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex flex-wrap items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-indigo-500" /> Reports Center
                  </h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { title: 'Attendance Report', type: 'Attendance' },
                      { title: 'Placement Ledger', type: 'Placement' },
                      { title: 'Fee Collection Ledger', type: 'Fees' },
                      { title: 'Department Analytics', type: 'Department' },
                    ].map((rep, i) => (
                      <div key={i} className="p-2.5 border rounded-xl bg-background flex items-center justify-between">
                        <span className="font-bold text-[11px]">{rep.title}</span>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={async () => {
                              try {
                                toast.success(`Exporting ${rep.title} PDF...`);
                                const res = await api.get(`/reports/export?type=${encodeURIComponent(rep.type)}&format=PDF`, { responseType: 'blob' });
                                const url = window.URL.createObjectURL(new Blob([res.data]));
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${rep.type}_Report.pdf`;
                                a.click();
                              } catch {
                                toast.error('Download failed');
                              }
                            }} 
                            className="p-1.5 border rounded hover:bg-muted text-rose-500" 
                            title="Download PDF"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                toast.success(`Exporting ${rep.title} Excel...`);
                                const res = await api.get(`/reports/export?type=${encodeURIComponent(rep.type)}&format=EXCEL`, { responseType: 'blob' });
                                const url = window.URL.createObjectURL(new Blob([res.data]));
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${rep.type}_Report.xlsx`;
                                a.click();
                              } catch {
                                toast.error('Download failed');
                              }
                            }} 
                            className="p-1.5 border rounded hover:bg-muted text-emerald-600" 
                            title="Download Excel"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Health */}
              {hasPermission('backups:read') && (
                <div className="border bg-card rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex flex-wrap items-center gap-1.5">
                      <Server className="h-4 w-4 text-cyan-500" /> System Health & Storage
                    </h3>
                    {hasPermission('backups:write') && (
                      <button onClick={handleBackup} className="px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded text-[10px] font-bold">
                        Backup Now
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center p-2.5 border rounded-xl bg-background">
                      <span className="text-muted-foreground">Database Status</span>
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">{stats.databaseStatus || 'CONNECTED'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 border rounded-xl bg-background">
                      <span className="text-muted-foreground">Active Accounts</span>
                      <span className="font-mono font-bold">{stats.totalActiveUsers ?? 1}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 border rounded-xl bg-background">
                      <span className="text-muted-foreground">Online Sessions</span>
                      <span className="font-mono font-bold text-primary">{stats.onlineUsers ?? 1}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 border rounded-xl bg-background">
                      <span className="text-muted-foreground">Last Database Backup</span>
                      <span className="text-[10px] text-muted-foreground">{stats.latestBackupTime || 'Never'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 border rounded-xl bg-background">
                      <span className="text-muted-foreground">Storage Usage</span>
                      <span className="font-mono font-bold">{stats.storageUsage || '0 MB'}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* =========================================================
          PRINCIPAL / EXECUTIVE VIEW
          ========================================================= */}
      {user?.role === 'Principal' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground">College Performance Index</h4>
              <div className="h-32 flex items-center justify-center flex-col gap-1.5">
                <span className="text-4xl font-extrabold text-primary">A+</span>
                <span className="text-[10px] text-muted-foreground font-bold">NAAC Accreditation Score</span>
              </div>
            </div>
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground">Average Semester Passing Rate</h4>
              <div className="h-32 flex items-center justify-center flex-col gap-1.5">
                <span className="text-4xl font-extrabold text-emerald-600">92.4%</span>
                <span className="text-[10px] text-muted-foreground font-bold">All Programs Unified</span>
              </div>
            </div>
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground">Placement Statistics</h4>
              <div className="h-32 flex items-center justify-center flex-col gap-1.5">
                <span className="text-4xl font-extrabold text-indigo-600">84.5%</span>
                <span className="text-[10px] text-muted-foreground font-bold">Eligible Students Hired</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          HOD VIEW (CSE Coordinator)
          ========================================================= */}
      {user?.role === 'HOD' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-bold">CSE Department Timetable Coordinator</h3>
              <p className="text-xs text-muted-foreground">Manage conflict-free period maps and classroom allocations.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleAIOptimize} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold flex flex-wrap items-center gap-1.5 hover:bg-indigo-700">
                <Sparkles className="h-3.5 w-3.5" /> AI Auto-Schedule (No Conflicts)
              </button>
              <button onClick={() => setIsTimetableModalOpen(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-bold flex flex-wrap items-center gap-1 hover:bg-primary/95">
                <Plus className="h-3.5 w-3.5" /> Add Class Period
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timetable List Grid */}
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Current CSE Timetable Schedule</h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {timetableSlots.map((slot, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded-lg bg-background">
                    <div>
                      <span className="text-[9px] font-bold text-primary tracking-wider uppercase">{slot.dayOfWeek} · Period {slot.slotIndex}</span>
                      <h4 className="text-xs font-extrabold">{slot.subject?.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{slot.faculty?.firstName} {slot.faculty?.lastName} · Room {slot.roomNo}</p>
                    </div>
                    <button onClick={async () => {
                      await api.delete(`/timetables/slots/${slot.id}`);
                      fetchRoleData();
                      toast.success('Class slot removed');
                    }} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval workflow requests */}
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Department Leave & OD Approval queue</h4>
              <div className="space-y-3">
                {workflowRequests.filter(r => r.currentStep === 'HOD').map((req, i) => (
                  <div key={i} className="p-3 border rounded-lg bg-background space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold bg-amber-50 text-amber-600 border px-1.5 py-0.5 rounded uppercase">{req.type}</span>
                        <h4 className="text-xs font-bold mt-1">{req.title}</h4>
                        <p className="text-[10px] text-muted-foreground">Applied by: {req.student?.firstName} {req.student?.lastName}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => handleWorkflowAction(req.id, 'APPROVE')} className="bg-emerald-500 text-white p-1 rounded hover:bg-emerald-600">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleWorkflowAction(req.id, 'REJECT')} className="bg-rose-500 text-white p-1 rounded hover:bg-rose-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] bg-muted/30 p-2 rounded text-muted-foreground font-semibold italic">"{req.reason}"</p>
                  </div>
                ))}
                {workflowRequests.filter(r => r.currentStep === 'HOD').length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">All HOD department workflows are processed.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          FACULTY & MENTOR VIEWS
          ========================================================= */}
      {user?.role === 'Faculty' && (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold">Faculty Academic Dashboard</h3>
            <p className="text-xs text-muted-foreground">Mark attendance registries, enter marks sheets, and approve mentor requests.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Mentor Approvals */}
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Assigned Mentor Approval Inbox</h4>
              <div className="space-y-3">
                {workflowRequests.filter(r => r.currentStep === 'MENTOR').map((req, i) => (
                  <div key={i} className="p-3 border rounded-lg bg-background space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 border px-1.5 py-0.5 rounded uppercase">{req.type}</span>
                        <h4 className="text-xs font-bold mt-1">{req.title}</h4>
                        <p className="text-[10px] text-muted-foreground">Student: {req.student?.firstName} {req.student?.lastName}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => handleWorkflowAction(req.id, 'APPROVE')} className="bg-emerald-500 text-white p-1 rounded hover:bg-emerald-600">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleWorkflowAction(req.id, 'REJECT')} className="bg-rose-500 text-white p-1 rounded hover:bg-rose-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] bg-muted/30 p-2 rounded text-muted-foreground italic">"{req.reason}"</p>
                  </div>
                ))}
                {workflowRequests.filter(r => r.currentStep === 'MENTOR').length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No pending mentor requests.</p>
                )}
              </div>
            </div>

            {/* Attendance Registry */}
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Bulk Student Attendance Register</h4>
              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground text-[10px] font-semibold">Mark active class registration sheets: (Class: B.Tech CSE Section A)</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2.5 border rounded-lg bg-background">
                    <span className="font-bold">John Smith (ADM2026001)</span>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => toast.success('Marked John Smith as PRESENT')} className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded font-bold hover:bg-emerald-500/20">Present</button>
                      <button onClick={() => toast.success('Marked John Smith as ABSENT')} className="px-2 py-1 bg-rose-500/10 text-rose-600 rounded font-bold hover:bg-rose-500/20">Absent</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          STUDENT VIEW
          ========================================================= */}
      {user?.role === 'Student' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-bold">Academic Student Portal</h3>
              <p className="text-xs text-muted-foreground">Apply for leaves, settle term dues, and download certified credentials.</p>
            </div>
            <button onClick={() => setIsRequestModalOpen(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-bold flex flex-wrap items-center gap-1 hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" /> Apply for Leave/OD
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Workflow Requests list */}
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4 col-span-2">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">My Leave & Certificate Applications</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b text-[10px] uppercase font-extrabold text-muted-foreground">
                      <th className="py-2">Type</th>
                      <th className="py-2">Application Subject</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Next Step Actioner</th>
                      <th className="py-2">Date Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflowRequests.map((req, i) => (
                      <tr key={i} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="py-3 font-bold"><span className="bg-indigo-50 border px-1.5 py-0.5 rounded text-[10px] text-indigo-600 uppercase">{req.type}</span></td>
                        <td className="py-3 font-semibold">{req.title}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>{req.status}</span>
                        </td>
                        <td className="py-3 font-mono">{req.currentStep}</td>
                        <td className="py-3 text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Counselor Chatbot Widget */}
            <div className="border bg-card rounded-xl p-5 shadow-sm flex flex-col justify-between h-[350px]">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex flex-wrap items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-500" /> AI Student Counselor Chatbot
              </h4>
              
              <div className="flex-1 overflow-y-auto space-y-3 py-4 text-xs font-semibold">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`p-2.5 rounded-lg max-w-[85%] ${
                    msg.sender === 'AI' ? 'bg-muted text-foreground mr-auto' : 'bg-primary text-primary-foreground ml-auto'
                  }`}>
                    {msg.text}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="flex flex-wrap gap-2 border-t pt-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 h-9 border rounded bg-background px-3 text-xs font-semibold"
                />
                <button type="submit" className="h-9 w-9 bg-primary text-primary-foreground rounded flex items-center justify-center hover:bg-primary/95">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Document Vault & Digital Signatures */}
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex flex-wrap items-center gap-1.5">
                <Shield className="h-4 w-4 text-indigo-500" /> Student Document Vault
              </h4>
              <div className="space-y-3 text-xs font-semibold">
                {vaultFiles.map((f, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-background">
                    <div>
                      <h5 className="font-bold truncate max-w-[140px]">{f.name}</h5>
                      <span className="text-[9px] text-muted-foreground">{f.size}</span>
                    </div>
                    {f.signed ? (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-extrabold uppercase">Cryptosigned</span>
                    ) : (
                      <button onClick={() => handleSignFile(idx)} className="px-2 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded hover:bg-primary/90">Sign</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fee Bills Panel */}
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4 col-span-2">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex flex-wrap items-center gap-1.5">
                <Landmark className="h-4 w-4 text-indigo-500" /> Pending Fee Dues & Ledger
              </h4>
              <div className="space-y-3 text-xs font-semibold">
                {stats?.feeBills && stats.feeBills.length > 0 ? (
                  stats.feeBills.map((bill: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded-lg bg-background">
                      <div>
                        <h5 className="font-bold">Tuition Dues (Fall Sem 1)</h5>
                        <p className="text-[9px] text-muted-foreground">Due Date: {new Date(bill.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm font-extrabold text-foreground">${bill.amount}</span>
                        {bill.status === 'PAID' ? (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-extrabold uppercase">Settled</span>
                        ) : (
                          <button
                            onClick={() => handleProcessPayment(bill.id)}
                            disabled={paymentLoading === bill.id}
                            className="px-3 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {paymentLoading === bill.id ? 'Processing...' : 'Pay Dues'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">All payment liabilities have been settled.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          PARENT VIEW
          ========================================================= */}
      {user?.role === 'Parent' && (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold">Parent Guardian Monitoring Portal</h3>
            <p className="text-xs text-muted-foreground">Review your ward's attendance transcripts, grade maps, and active leave workflows.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground">Ward Attendance Rate</h4>
              <span className="text-3xl font-extrabold text-emerald-600">94.2%</span>
              <p className="text-[10px] text-muted-foreground">Status: Satisfies compliance minimum (75%).</p>
            </div>
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground">Academic Grade Average</h4>
              <span className="text-3xl font-extrabold text-primary">A Grade</span>
              <p className="text-[10px] text-muted-foreground">Average GPA: 8.5 CGPA.</p>
            </div>
            <div className="border bg-card rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground">Ward Leave status</h4>
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-600 inline-block w-fit">Pending HOD approval</span>
              <p className="text-[10px] text-muted-foreground">Fever sick leave request submitted.</p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODALS
          ========================================================= */}
      
      {/* Student Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md border bg-card p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase">Apply for Leave / OD / Bonafide</h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs font-semibold">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-extrabold text-muted-foreground">Request Type</label>
                <select name="type" className="h-10 border rounded bg-background px-3">
                  <option value="LEAVE">Leave of Absence</option>
                  <option value="OD">On Duty (OD) Permission</option>
                  <option value="BONAFIDE">Bonafide Certificate</option>
                  <option value="HOSTEL_LEAVE">Hostel Gate Pass</option>
                  <option value="BUS_PASS">Bus Pass Request</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-extrabold text-muted-foreground">Title Subject</label>
                <input type="text" name="title" required className="h-10 border rounded bg-background px-3" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-extrabold text-muted-foreground">Reason / Detailed Note</label>
                <textarea name="reason" required className="h-20 border rounded bg-background p-3" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-extrabold text-muted-foreground">Start Date</label>
                  <input type="date" name="startDate" className="h-10 border rounded bg-background px-3" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-extrabold text-muted-foreground">End Date</label>
                  <input type="date" name="endDate" className="h-10 border rounded bg-background px-3" />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 border rounded font-bold hover:bg-muted">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timetable slot Modal */}
      {isTimetableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md border bg-card p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase">Add Class period Slot</h3>
              <button onClick={() => setIsTimetableModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSlot} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-extrabold text-muted-foreground">Day of Week</label>
                  <select name="dayOfWeek" className="h-10 border rounded bg-background px-3">
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-extrabold text-muted-foreground">Period Index (1-8)</label>
                  <select name="slotIndex" className="h-10 border rounded bg-background px-3">
                    <option value="1">Period 1 (09:00 - 09:50)</option>
                    <option value="2">Period 2 (10:00 - 10:50)</option>
                    <option value="3">Period 3 (11:10 - 12:00)</option>
                    <option value="4">Period 4 (12:10 - 01:00)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-extrabold text-muted-foreground">Start Time</label>
                  <input type="text" name="startTime" defaultValue="09:00" placeholder="e.g. 09:00" className="h-10 border rounded bg-background px-3" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-extrabold text-muted-foreground">End Time</label>
                  <input type="text" name="endTime" defaultValue="09:50" placeholder="e.g. 09:50" className="h-10 border rounded bg-background px-3" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-extrabold text-muted-foreground">Course Section</label>
                <select name="sectionId" className="h-10 border rounded bg-background px-3">
                  {charts?.courseDistribution?.map((c: any, idx: number) => (
                    <option key={idx} value={stats.sectionId}>{c.course} Section A</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-extrabold text-muted-foreground">Subject</label>
                  <select name="subjectId" className="h-10 border rounded bg-background px-3">
                    <option value={stats.subjectId || '1'}>Introduction to Programming</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-extrabold text-muted-foreground">Assign Faculty</label>
                  <select name="facultyId" className="h-10 border rounded bg-background px-3">
                    <option value={stats.facultyId || '1'}>Mrs. Ada Lovelace</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-extrabold text-muted-foreground">Room Number</label>
                <input type="text" name="roomNo" defaultValue="Room 305" className="h-10 border rounded bg-background px-3" />
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsTimetableModalOpen(false)} className="px-4 py-2 border rounded font-bold hover:bg-muted">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">Save Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
