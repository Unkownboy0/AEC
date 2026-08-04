import React, { useState, useEffect } from 'react';
import {
  BookOpen, Clock, Users, CheckSquare, Award, FileText, Send, Calendar,
  AlertTriangle, Upload, RefreshCw, Eye, Plus, CheckCircle2, ChevronRight, MessageSquare, Download,
  Sparkles, Layers, Filter, Search, Bell, Shield, ArrowUpRight, BarChart2, Heart
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';
import { DepartmentAvailabilityBoard } from '../../components/department/DepartmentAvailabilityBoard';
import { MentorWorkspacePortal } from '../mentor/MentorWorkspacePortal';

export const FacultyWorkspacePortal: React.FC = () => {
  const { user, switchWorkspace } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'timetable' | 'subjects' | 'attendance' | 'assignments' | 'marks' | 'students' | 'leave' | 'tasks' | 'availability' | 'ai_assistant' | 'mentor'
  >('dashboard');

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/timetable')) setActiveTab('timetable');
    else if (path.includes('/subjects')) setActiveTab('subjects');
    else if (path.includes('/attendance')) setActiveTab('attendance');
    else if (path.includes('/assignments')) setActiveTab('assignments');
    else if (path.includes('/internal-marks') || path.includes('/marks')) setActiveTab('marks');
    else if (path.includes('/availability')) setActiveTab('availability');
    else if (path.includes('/ai_assistant')) setActiveTab('ai_assistant');
    else if (path.includes('/mentor')) setActiveTab('mentor');
    else if (path.includes('/dashboard') || path === '/faculty') setActiveTab('dashboard');
  }, [location.pathname]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [showAllQuickActions, setShowAllQuickActions] = useState(false);

  // Submodule Data
  const [timetable, setTimetable] = useState<any[]>([]);
  const [timetableMode, setTimetableMode] = useState<'today' | 'week' | 'list'>('today');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attendanceSheet, setAttendanceSheet] = useState<any>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);

  // Assignment Creation Form
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDue, setAssignDue] = useState('');
  const [assignMaxMarks, setAssignMaxMarks] = useState('100');

  // Leave Form
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // AI Prompt Assistant
  const [aiTopic, setAiTopic] = useState('');
  const [aiGeneratedOutput, setAiGeneratedOutput] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'timetable') fetchTimetable();
    if (activeTab === 'subjects') fetchSubjects();
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty/dashboard');
      if (res.data?.status === 'success') {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    try {
      const res = await api.get('/faculty/timetable');
      if (res.data?.status === 'success') setTimetable(res.data.data);
    } catch (err) {
      console.error('Failed to load timetable:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/faculty/subjects');
      if (res.data?.status === 'success') {
        setSubjects(res.data.data);
        if (res.data.data.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const fetchAttendanceSheet = async (subjectId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/faculty/attendance?subjectId=${subjectId}`);
      if (res.data?.status === 'success') {
        setAttendanceSheet(res.data.data);
        const initial: Record<string, string> = {};
        res.data.data.students.forEach((s: any) => {
          initial[s.studentId] = s.status;
        });
        setAttendanceRecords(initial);
      }
    } catch (err) {
      toast.error('Failed to load attendance sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttendance = async () => {
    if (!attendanceSheet) return;
    try {
      setIsSubmittingAttendance(true);
      const recordsPayload = Object.keys(attendanceRecords).map((studentId) => ({
        studentId,
        status: attendanceRecords[studentId],
      }));

      const res = await api.post('/faculty/attendance', {
        subjectId: attendanceSheet.subjectId,
        date: attendanceSheet.date,
        records: recordsPayload,
      });

      if (res.data?.status === 'success') {
        toast.success(`Attendance saved successfully for ${recordsPayload.length} students!`);
        fetchDashboardStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/faculty/assignments', {
        title: assignTitle,
        description: assignDesc,
        subjectId: selectedSubjectId || subjects[0]?.id,
        dueDate: assignDue,
        maxMarks: Number(assignMaxMarks),
      });
      if (res.data?.status === 'success') {
        toast.success('Assignment published to section students!');
        setIsAssignModalOpen(false);
        setAssignTitle('');
        setAssignDesc('');
        fetchDashboardStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const userRole = typeof user?.role === 'object' ? (user?.role as any)?.name : user?.role;
  const isExecutiveUser = 
    ['HOD', 'Head of Department', 'Academic Dean', 'Admission Dean', 'IQAC Dean', 'Vice Principal'].includes(userRole || '') || 
    (userRole || '').toLowerCase().includes('dean') ||
    (userRole || '').toLowerCase().includes('hod') ||
    (userRole || '').toLowerCase().includes('principal') ||
    user?.activeWorkspace === 'HOD' || 
    (user as any)?.isHod || 
    stats?.facultyInfo?.isHod ||
    Boolean(user?.firstName?.includes('Head of Department') || user?.lastName?.includes('Head of Department'));

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/faculty/leave', {
        type: leaveType,
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: leaveReason,
      });
      if (res.data?.status === 'success') {
        toast.success(isExecutiveUser ? 'Leave Request submitted directly to Principal / Acting Principal!' : 'Faculty Leave Request submitted to HOD!');
        setIsLeaveModalOpen(false);
        setLeaveReason('');
        fetchDashboardStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const handleGenerateAiPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    setAiGeneratedOutput(
      `AI Generated Lesson Plan for: ${aiTopic}\n\n1. Learning Objectives:\n- Understand core concepts of ${aiTopic}.\n- Apply theoretical models in practical lab exercises.\n\n2. Key Topics & Allocations:\n- Introduction & Background (15 mins)\n- Architectural Blueprint & Deep Dive (25 mins)\n- Interactive Q&A (10 mins)\n\n3. Quiz Question:\n- Explain the primary advantage of decoupled database architectures in ERP applications.`
    );
  };

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {/* 1. Header Banner & Workspace Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-card border rounded-2xl p-6 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
              Faculty Workspace Portal
            </span>
            <span className="text-[10px] font-bold text-muted-foreground border px-2 py-0.5 rounded-full">
              AY {stats?.academicContext?.academicYear || '2026-2027'} • {stats?.academicContext?.semester || 'Odd Semester'}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1.5">Welcome, Dr. {user?.firstName} {user?.lastName}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Faculty Member • Department of {stats?.facultyInfo?.departmentName || 'Computer Science and Engineering'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="h-9 px-3.5 border rounded-xl text-xs font-extrabold hover:bg-muted transition-all"
          >
            Apply Leave
          </button>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="h-9 px-3.5 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl shadow-xs hover:bg-primary/95 transition-all flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create Assignment
          </button>
        </div>
      </div>

      {/* 2. Structured Navigation Bar */}
      <div className="flex border-b gap-2 overflow-x-auto pb-1">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
          { id: 'timetable', label: 'My Timetable', icon: Clock },
          { id: 'subjects', label: 'My Subjects', icon: Award },
          { id: 'attendance', label: 'Period Attendance', icon: CheckSquare, badge: stats?.metrics?.attendancePendingCount },
          { id: 'assignments', label: 'Assignments', icon: FileText, badge: stats?.metrics?.submissionsPendingReviewCount },
          { id: 'mentor', label: 'Mentor Module', icon: Heart, badge: stats?.metrics?.mentorRequestsPending },
          { id: 'ai_assistant', label: 'AI Tools', icon: Sparkles },
          { id: 'availability', label: 'Department Board', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                navigate(`/faculty/${tab.id}`);
              }}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="ml-1 px-1.5 py-0.2 text-[9px] font-black rounded-full bg-rose-500 text-white">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD COMMAND CENTER */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* 1. Clickable Live Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: "Today's Classes", val: stats?.metrics?.todayClassesCount || 0, sub: `${stats?.metrics?.teachingHoursToday || 0} hrs`, target: 'timetable', color: 'text-primary' },
              { label: 'Attendance Pending', val: stats?.metrics?.attendancePendingCount || 0, sub: 'Needs entry', target: 'attendance', color: 'text-amber-600' },
              { label: 'Attendance Posted', val: stats?.metrics?.attendancePostedCount || 0, sub: 'Completed today', target: 'attendance', color: 'text-emerald-600' },
              { label: 'Active Assignments', val: stats?.metrics?.assignmentsActiveCount || 0, sub: 'Published', target: 'assignments', color: 'text-foreground' },
              { label: 'Submissions Pending', val: stats?.metrics?.submissionsPendingReviewCount || 0, sub: 'Needs grading', target: 'assignments', color: 'text-rose-600' },
              { label: 'Syllabus Progress', val: `${stats?.metrics?.syllabusCompletionPercent || 78}%`, sub: 'On track', target: 'subjects', color: 'text-indigo-600' },
              { label: 'Mentor Requests', val: stats?.metrics?.mentorRequestsPending || 0, sub: 'Pending review', target: 'dashboard', color: 'text-amber-600' },
              { label: 'Tasks Due', val: stats?.metrics?.tasksDueCount || 0, sub: 'Assigned to you', target: 'dashboard', color: 'text-rose-600' },
              { label: 'Students On Leave', val: stats?.metrics?.studentsOnLeaveToday || 0, sub: 'Today', target: 'availability', color: 'text-muted-foreground' },
              { label: 'Students On OD', val: stats?.metrics?.studentsOnOdToday || 0, sub: 'Approved OD', target: 'availability', color: 'text-emerald-600' },
              { label: 'Leave Balance', val: `${stats?.metrics?.casualLeaveBalance || 12} CL`, sub: 'Remaining', target: 'dashboard', color: 'text-foreground' },
              { label: 'Profile Score', val: `${stats?.metrics?.profileCompletionPercent || 90}%`, sub: 'Complete', target: 'dashboard', color: 'text-emerald-600' },
            ].map((card, idx) => (
              <div
                key={idx}
                onClick={() => setActiveTab(card.target as any)}
                className="p-3.5 bg-card border rounded-2xl shadow-xs hover:border-primary/50 transition-all cursor-pointer space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">{card.label}</span>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className={`text-xl font-black ${card.color}`}>{card.val}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* 2. Quick Action Bar */}
          <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Faculty Quick Actions</h3>
              <button
                onClick={() => setShowAllQuickActions(!showAllQuickActions)}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                {showAllQuickActions ? 'Show Initial 6' : 'View All Actions'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { label: 'Take Attendance', action: () => setActiveTab('attendance'), icon: CheckSquare },
                { label: 'Create Assignment', action: () => setIsAssignModalOpen(true), icon: Plus },
                { label: 'Enter Marks', action: () => setActiveTab('marks' as any), icon: Award },
                { label: 'Open Timetable', action: () => setActiveTab('timetable'), icon: Clock },
                { label: 'Review Submissions', action: () => setActiveTab('assignments'), icon: FileText },
                { label: 'Apply Leave/OD', action: () => setIsLeaveModalOpen(true), icon: Calendar },
                ...(showAllQuickActions
                  ? [
                      { label: 'AI Lesson Plan', action: () => setActiveTab('ai_assistant'), icon: Sparkles },
                      { label: 'Upload Notes', action: () => setActiveTab('subjects'), icon: Upload },
                      { label: 'Department Board', action: () => setActiveTab('availability'), icon: Users },
                      { label: 'Refresh Data', action: fetchDashboardStats, icon: RefreshCw },
                    ]
                  : []),
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <button
                    key={i}
                    onClick={act.action}
                    className="p-3 border rounded-xl bg-muted/10 hover:bg-primary/10 hover:border-primary/30 transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer group"
                  >
                    <Icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-extrabold text-foreground">{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Two Column Working Area: Schedule & Prominent Pending Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Today's Schedule Card */}
            <div className="md:col-span-2 bg-card border rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Today's Teaching Schedule ({stats?.metrics?.currentDayOfWeek})
                </h3>
                <span className="text-xs font-bold text-muted-foreground">{stats?.metrics?.todayClassesCount || 0} Periods Scheduled</span>
              </div>

              {!stats?.todaySchedule || stats.todaySchedule.length === 0 ? (
                <div className="p-8 border border-dashed rounded-2xl text-center space-y-2">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground font-bold">No teaching sessions scheduled for today.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.todaySchedule.map((slot: any) => (
                    <div
                      key={slot.id}
                      className={`p-4 border rounded-2xl space-y-2 transition-all ${
                        slot.status === 'CURRENT'
                          ? 'bg-primary/5 border-primary shadow-xs'
                          : 'bg-muted/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-black ${
                            slot.status === 'CURRENT' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                          }`}>
                            Period {slot.slotIndex}
                          </span>
                          <h4 className="text-xs font-black text-foreground">{slot.subjectName} ({slot.subjectCode})</h4>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-muted-foreground">{slot.startTime} - {slot.endTime}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span>Section: <strong className="text-foreground">{slot.sectionName}</strong> • Room: <strong className="text-foreground">{slot.roomNo}</strong></span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedSubjectId(slot.subjectId || subjects[0]?.id);
                              fetchAttendanceSheet(slot.subjectId || subjects[0]?.id);
                              setActiveTab('attendance');
                            }}
                            className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-extrabold rounded-lg hover:bg-primary/95"
                          >
                            Mark Attendance
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prominent Pending Actions Area */}
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold flex items-center gap-2 border-b pb-3 text-rose-600">
                <AlertTriangle className="h-4 w-4" /> Pending Action Center
              </h3>

              {!stats?.pendingActions || stats.pendingActions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">All pending actions cleared!</p>
              ) : (
                <div className="space-y-3">
                  {stats.pendingActions.map((pa: any) => (
                    <div key={pa.id} className="p-3.5 border rounded-xl bg-rose-500/5 border-rose-500/20 space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-500/10 px-2 py-0.5 rounded">
                        {pa.priority} PRIORITY
                      </span>
                      <p className="text-xs font-bold text-foreground leading-snug">{pa.title}</p>
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => setActiveTab(pa.targetTab)}
                          className="px-3 py-1 bg-rose-600 text-white text-[10px] font-extrabold rounded-lg shadow-xs hover:bg-rose-700"
                        >
                          {pa.actionText} →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <h3 className="text-sm font-extrabold">Weekly Teaching Schedule</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimetableMode('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${timetableMode === 'today' ? 'bg-primary text-primary-foreground' : 'border'}`}
              >
                Today
              </button>
              <button
                onClick={() => setTimetableMode('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${timetableMode === 'week' ? 'bg-primary text-primary-foreground' : 'border'}`}
              >
                Full Week
              </button>
            </div>
          </div>

          {timetable.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No timetable slots assigned.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {timetable.map((slot) => (
                <div key={slot.id} className="p-3.5 border rounded-xl bg-muted/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">{slot.dayOfWeek} • Period {slot.slotIndex}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{slot.startTime} - {slot.endTime}</span>
                  </div>
                  <p className="text-xs font-extrabold">{slot.subjectName}</p>
                  <p className="text-[10px] text-muted-foreground">{slot.sectionName} • Room {slot.roomNo}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUBJECTS & SYLLABUS PROGRESS */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((sub) => (
            <div key={sub.id} className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                  {sub.code}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">Sem {sub.semesterNumber}</span>
              </div>
              <h3 className="text-sm font-extrabold text-foreground">{sub.name}</h3>
              <p className="text-[11px] text-muted-foreground">Credits: {sub.credits} • Theory: {sub.theoryHours}h/wk</p>
              
              {/* Syllabus Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span>Syllabus Completion</span>
                  <span className="text-primary">{sub.syllabusCompletionPercent || 75}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${sub.syllabusCompletionPercent || 75}%` }} />
                </div>
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedSubjectId(sub.id);
                    fetchAttendanceSheet(sub.id);
                    setActiveTab('attendance');
                  }}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl"
                >
                  Mark Attendance
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: PERIOD ATTENDANCE WITH AUTOMATIC LEAVE/OD OVERLAY */}
      {activeTab === 'attendance' && (
        <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="text-sm font-extrabold">Period Attendance Entry Desk</h3>
              <p className="text-xs text-muted-foreground">
                Approved student Leave and OD applications automatically overlay on this attendance sheet.
              </p>
            </div>
            {subjects.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    fetchAttendanceSheet(e.target.value);
                  }}
                  className="bg-background border text-xs font-bold p-2 rounded-xl focus:outline-none"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
                <button
                  onClick={() => fetchAttendanceSheet(selectedSubjectId || subjects[0]?.id)}
                  className="px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-xs"
                >
                  Load Sheet
                </button>
              </div>
            )}
          </div>

          {!attendanceSheet ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Select a subject above to load student attendance sheet.</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 border-b text-[10px] font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3">Admission No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Leave / OD Status</th>
                      <th className="p-3">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attendanceSheet.students.map((s: any) => (
                      <tr key={s.studentId} className="hover:bg-muted/10">
                        <td className="p-3 font-mono font-bold">{s.admissionNo}</td>
                        <td className="p-3 font-extrabold">{s.name}</td>
                        <td className="p-3">
                          {s.autoOverlayStatus ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              s.autoOverlayStatus === 'APPROVED_OD' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                            }`}>
                              {s.autoOverlayStatus === 'APPROVED_OD' ? 'ON DUTY (OD)' : 'ON LEAVE'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Regular</span>
                          )}
                        </td>
                        <td className="p-3">
                          <select
                            disabled={Boolean(s.autoOverlayStatus)}
                            value={attendanceRecords[s.studentId] || 'PRESENT'}
                            onChange={(e) => setAttendanceRecords({ ...attendanceRecords, [s.studentId]: e.target.value })}
                            className="bg-background border text-xs font-bold p-1.5 rounded-lg focus:outline-none disabled:opacity-60"
                          >
                            <option value="PRESENT">PRESENT</option>
                            <option value="ABSENT">ABSENT</option>
                            <option value="LATE">LATE</option>
                            <option value="APPROVED_LEAVE">APPROVED LEAVE</option>
                            <option value="APPROVED_OD">APPROVED OD</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  disabled={isSubmittingAttendance}
                  onClick={handleSubmitAttendance}
                  className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl shadow-xs hover:bg-primary/95"
                >
                  {isSubmittingAttendance ? 'Saving Attendance...' : 'Save & Lock Attendance'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AI TOOLS */}
      {activeTab === 'ai_assistant' && (
        <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-extrabold">AI Teaching Assistant & Question Generator</h3>
          </div>

          <form onSubmit={handleGenerateAiPlan} className="space-y-3 max-w-xl">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Lecture Topic / Module Title</label>
              <input
                type="text"
                required
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Distributed Database Transactions & Two-Phase Commit Protocol"
                className="w-full h-9 border rounded-xl bg-background px-3 text-xs font-bold"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate AI Lesson Plan & Quiz
            </button>
          </form>

          {aiGeneratedOutput && (
            <div className="p-4 border rounded-2xl bg-muted/20 whitespace-pre-wrap text-xs text-foreground font-mono leading-relaxed">
              {aiGeneratedOutput}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AVAILABILITY BOARD */}
      {activeTab === 'availability' && (
        <DepartmentAvailabilityBoard />
      )}

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold">Create New Student Assignment</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-xs text-muted-foreground">✕</button>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Unit 2 Mini Project Report"
                  className="w-full h-9 border rounded-xl bg-background px-3 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Instructions</label>
                <textarea
                  rows={3}
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  placeholder="Enter assignment guidelines..."
                  className="w-full border rounded-xl bg-background p-3 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Due Date</label>
                  <input
                    type="date"
                    required
                    value={assignDue}
                    onChange={(e) => setAssignDue(e.target.value)}
                    className="w-full h-9 border rounded-xl bg-background px-3 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Max Marks</label>
                  <input
                    type="number"
                    value={assignMaxMarks}
                    onChange={(e) => setAssignMaxMarks(e.target.value)}
                    className="w-full h-9 border rounded-xl bg-background px-3 text-xs font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl">Publish Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Leave Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold">Apply Faculty Leave</h3>
              <button onClick={() => setIsLeaveModalOpen(false)} className="text-xs text-muted-foreground">✕</button>
            </div>
            <form onSubmit={handleApplyLeave} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full h-9 border rounded-xl bg-background px-3 text-xs font-bold"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="MEDICAL">Medical Leave (ML)</option>
                  <option value="ON_DUTY">On Duty (OD)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full h-9 border rounded-xl bg-background px-3 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full h-9 border rounded-xl bg-background px-3 text-xs font-bold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Reason / Purpose</label>
                <textarea
                  rows={3}
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Enter reason for leave..."
                  className="w-full border rounded-xl bg-background p-3 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsLeaveModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl">
                  {isExecutiveUser ? 'Submit to Principal / Acting Principal' : 'Submit to HOD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB MENTOR MODULE */}
      {activeTab === 'mentor' && (
        <MentorWorkspacePortal />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-2 flex justify-around items-center z-40">
        {[
          { id: 'dashboard', label: 'Home', icon: BookOpen },
          { id: 'timetable', label: 'Classes', icon: Clock },
          { id: 'attendance', label: 'Attendance', icon: CheckSquare },
          { id: 'assignments', label: 'Tasks', icon: FileText },
          { id: 'subjects', label: 'More', icon: Layers },
        ].map((nav) => {
          const Icon = nav.icon;
          const isActive = activeTab === nav.id;
          return (
            <button
              key={nav.id}
              onClick={() => setActiveTab(nav.id as any)}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{nav.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FacultyWorkspacePortal;
