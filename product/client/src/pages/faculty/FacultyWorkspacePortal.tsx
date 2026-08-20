import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Clock, Users, CheckSquare, Award, FileText, Send, Calendar,
  AlertTriangle, Upload, RefreshCw, Eye, Plus, CheckCircle2, ChevronRight, MessageSquare, Download,
  Sparkles, Layers, Filter, Search, Bell, Shield, ArrowUpRight, BarChart2, Heart, UserCheck, Ban, User,
  Paperclip, X, Bus

} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { MetricCard } from '../../design-system/components/MetricCard';
import { StatusBadge } from '../../design-system/components/StatusBadge';
import { DataTable, Column } from '../../design-system/components/DataTable';
import { pageVariants } from '../../design-system/tokens/motion';
import { DepartmentAvailabilityBoard } from '../../components/department/DepartmentAvailabilityBoard';
import { MentorWorkspacePortal } from '../mentor/MentorWorkspacePortal';
import { Modal } from '../../design-system/components/Modal';

export const FacultyWorkspacePortal: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [workspaceType, setWorkspaceType] = useState<'FACULTY' | 'MENTOR'>('FACULTY');

  // Submodule Loading States
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Submodule Data
  const [timetable, setTimetable] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [circulars, setCirculars] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Attendance Module State
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [attendanceSessions, setAttendanceSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);

  // Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignSubjectAssignmentId, setAssignSubjectAssignmentId] = useState('');
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  // Assignment Submissions / Grading
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] = useState<any>(null);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [selectedSubmissionForGrading, setSelectedSubmissionForGrading] = useState<any>(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/timetable')) setActiveTab('timetable');
    else if (path.includes('/subjects')) setActiveTab('subjects');
    else if (path.includes('/attendance')) setActiveTab('attendance');
    else if (path.includes('/assignments')) setActiveTab('assignments');
    else if (path.includes('/internal-marks') || path.includes('/marks')) setActiveTab('marks');
    else if (path.includes('/leave')) setActiveTab('leave');
    else if (path.includes('/circulars')) setActiveTab('circulars');
    else if (path.includes('/tasks')) setActiveTab('tasks');
    else if (path.includes('/availability')) setActiveTab('availability');
    else if (path.includes('/mentor')) {
      setWorkspaceType('MENTOR');
      setActiveTab('dashboard');
    }
    else setActiveTab('dashboard');
  }, [location.pathname]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty/dashboard');
      if (res.data?.status === 'success' || res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load faculty stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    if (activeTab === 'timetable') fetchTimetable();
    if (activeTab === 'subjects') fetchSubjects();
    if (activeTab === 'leave') fetchLeaveRequests();
    if (activeTab === 'assignments') { fetchAssignments(); fetchSubjects(); }
    if (activeTab === 'circulars') fetchCirculars();
    if (activeTab === 'tasks') fetchTasks();
    if (activeTab === 'attendance') fetchAttendanceSessions();
  }, [activeTab]);

  const fetchAttendanceSessions = async () => {
    try {
      const res = await api.get('/faculty/attendance/sessions/today');
      setAttendanceSessions(res.data?.data || []);
    } catch { toast.error('Could not load today’s scheduled classes'); }
  };

  const openAttendanceSession = async (slotId: string) => {
    try {
      const res = await api.get(`/faculty/attendance/sessions/${slotId}`);
      setActiveSession(res.data.data);
      setAttendanceRecords(Object.fromEntries(res.data.data.students.map((student: any) => [student.id, 'PRESENT'])));
    } catch (err: any) { toast.error(err.response?.data?.message || 'Could not open this class'); }
  };

  const submitAttendance = async () => {
    if (!activeSession) return;
    try {
      setIsSubmittingAttendance(true);
      await api.post(`/faculty/attendance/sessions/${activeSession.slot.id}/submit`, { date: activeSession.slot.date, groupId: activeSession.teachingGroup?.id, records: activeSession.students.map((student: any) => ({ studentId: student.id, status: attendanceRecords[student.id] || 'PRESENT' })) });
      toast.success('Attendance submitted');
      setActiveSession(null);
      fetchDashboardStats();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Attendance submission failed'); }
    finally { setIsSubmittingAttendance(false); }
  };

  const fetchTimetable = async () => {
    try {
      const res = await api.get('/faculty/timetable');
      if (res.data?.status === 'success' || res.data?.success) setTimetable(res.data.data || []);
    } catch (err) {
      console.error('Timetable error:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/faculty/subjects');
      if (res.data?.status === 'success' || res.data?.success) setSubjects(res.data.data || []);
    } catch (err) {
      console.error('Subjects error:', err);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await api.get('/workflows/requests');
      if (res.data?.status === 'success') setLeaveRequests(res.data.data || []);
    } catch (err) {
      console.error('Leave requests error:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/assignments');
      if (res.data?.status === 'success') setAssignments(res.data.data || []);
    } catch (err) {
      console.error('Assignments error:', err);
    }
  };

  const fetchCirculars = async () => {
    try {
      const res = await api.get('/circulars');
      if (res.data?.status === 'success') setCirculars(res.data.data || []);
    } catch (err) {
      console.error('Circulars error:', err);
    }
  };

  // Tasks Module State & Actions
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<any | null>(null);
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskCommentInput, setTaskCommentInput] = useState('');
  const [isSubmittingTaskAction, setIsSubmittingTaskAction] = useState(false);
  const [taskProgressInput, setTaskProgressInput] = useState<number>(0);

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const res = await api.get('/tasks');
      const taskList = Array.isArray(res.data?.data)
        ? res.data.data
        : res.data?.data?.tasks || (Array.isArray(res.data) ? res.data : []);
      setTasks(taskList);
    } catch (err: any) {
      console.error('Tasks error:', err);
      toast.error(err.response?.data?.message || 'Could not load assigned tasks');
    } finally {
      setTasksLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string, comment?: string) => {
    try {
      setIsSubmittingTaskAction(true);
      const res = await api.patch(`/tasks/${taskId}/status`, { status, comment });
      if (res.data?.status === 'success' || res.data?.success) {
        toast.success(`Task status updated to ${status.replace(/_/g, ' ')}`);
        fetchTasks();
        if (selectedTaskForDetails && selectedTaskForDetails.id === taskId) {
          setSelectedTaskForDetails({ ...selectedTaskForDetails, status });
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setIsSubmittingTaskAction(false);
    }
  };

  const handleUpdateTaskProgress = async (taskId: string, completionPercent: number, comment?: string) => {
    try {
      setIsSubmittingTaskAction(true);
      const res = await api.patch(`/tasks/${taskId}/progress`, { completionPercent, comment });
      if (res.data?.status === 'success' || res.data?.success) {
        toast.success('Task progress updated');
        fetchTasks();
        if (selectedTaskForDetails && selectedTaskForDetails.id === taskId) {
          setSelectedTaskForDetails({ ...selectedTaskForDetails, completionPercent });
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update progress');
    } finally {
      setIsSubmittingTaskAction(false);
    }
  };

  const parseChecklist = (raw: any): any[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const handleToggleChecklistItem = async (taskId: string, itemIndex: number) => {
    const currentChecklist = parseChecklist(selectedTaskForDetails?.checklist);
    if (currentChecklist.length === 0) return;
    const updatedChecklist = currentChecklist.map((item: any, idx: number) =>
      idx === itemIndex ? { ...item, completed: !item.completed } : item
    );
    try {
      setIsSubmittingTaskAction(true);
      const res = await api.patch(`/tasks/${taskId}/checklist`, { checklist: updatedChecklist });
      if (res.data?.status === 'success' || res.data?.success) {
        setSelectedTaskForDetails({ ...selectedTaskForDetails, checklist: updatedChecklist });
        fetchTasks();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update checklist');
    } finally {
      setIsSubmittingTaskAction(false);
    }
  };

  const handleAddTaskComment = async (taskId: string) => {
    if (!taskCommentInput.trim()) return;
    try {
      setIsSubmittingTaskAction(true);
      const res = await api.post(`/tasks/${taskId}/comments`, { comment: taskCommentInput.trim() });
      if (res.data?.status === 'success' || res.data?.success) {
        toast.success('Comment posted');
        setTaskCommentInput('');
        fetchTasks();
        const detailRes = await api.get(`/tasks/${taskId}`);
        if (detailRes.data?.data) setSelectedTaskForDetails(detailRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsSubmittingTaskAction(false);
    }
  };

  const handleOpenTaskDetails = async (task: any) => {
    setSelectedTaskForDetails(task);
    setTaskProgressInput(task.completionPercent || 0);
    setIsTaskDetailsModalOpen(true);
    try {
      const res = await api.get(`/tasks/${task.id}`);
      if (res.data?.data) {
        setSelectedTaskForDetails(res.data.data);
        setTaskProgressInput(res.data.data.completionPercent || 0);
      }
    } catch (e) {
      // keep fallback task object
    }
  };

  const handleCancelLeave = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    try {
      const res = await api.post(`/workflows/requests/${requestId}/cancel`);
      if (res.data?.status === 'success' || res.data?.success) {
        toast.success('Leave application cancelled');
        fetchLeaveRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Cancellation failed');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) return;
    const selectedAssignment = subjects.find((s) => s.id === assignSubjectAssignmentId);
    if (!selectedAssignment) {
      toast.error('Please select a subject for this assignment.');
      return;
    }
    try {
      setIsCreatingAssignment(true);
      await api.post('/assignments', {
        title: assignTitle,
        description: assignDesc,
        dueDate: assignDueDate,
        subjectId: selectedAssignment.subjectId,
        sectionId: selectedAssignment.sectionId,
        semesterId: selectedAssignment.semesterId,
        academicYearId: selectedAssignment.academicYearId,
        programId: selectedAssignment.section?.programId,
        departmentId: selectedAssignment.section?.departmentId,
      });
      toast.success('Assignment created & published');
      setIsAssignModalOpen(false);
      setAssignTitle('');
      setAssignDesc('');
      setAssignDueDate('');
      setAssignSubjectAssignmentId('');
      fetchAssignments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  const handleViewSubmissions = async (assignment: any) => {
    setSelectedAssignmentForSubmissions(assignment);
    setIsSubmissionsModalOpen(true);
    setSelectedSubmissionForGrading(null);
    setIsLoadingSubmissions(true);
    try {
      const res = await api.get(`/assignments/${assignment.id}/submissions`);
      if (res.data?.status === 'success') setSubmissionsList(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to retrieve assignment submissions.');
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionForGrading) return;
    try {
      setIsSavingGrade(true);
      const res = await api.put(`/assignments/submissions/${selectedSubmissionForGrading.id}/grade`, {
        marksObtained: gradeMarks,
        feedback: gradeFeedback,
      });
      if (res.data?.status === 'success') {
        toast.success('Submission graded successfully.');
        setSelectedSubmissionForGrading(null);
        setGradeMarks('');
        setGradeFeedback('');
        if (selectedAssignmentForSubmissions) {
          const updated = await api.get(`/assignments/${selectedAssignmentForSubmissions.id}/submissions`);
          if (updated.data?.status === 'success') setSubmissionsList(updated.data.data || []);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to grade submission.');
    } finally {
      setIsSavingGrade(false);
    }
  };

  if (workspaceType === 'MENTOR') {
    return <MentorWorkspacePortal />;
  }

  return (
    <div className="space-y-6 bg-background text-foreground">
        <main className="space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-border">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                    <Sparkles className="h-4 w-4" />
                    Faculty Command Center
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                    Academic Governance & Course Operations
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live schedule telemetry, attendance controls, student coursework, and leave workflows.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/faculty/hub')}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-sm shadow-md hover:opacity-95 transition"
                  >
                    <Sparkles className="h-4 w-4" />
                    Open Cross-Dept Workload & Substitution Hub
                  </button>
                  <button
                    onClick={() => navigate('/faculty/office')}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-card border border-border hover:border-primary/50 text-foreground font-bold text-sm shadow-sm transition"
                  >
                    <Layers className="h-4 w-4 text-primary" />
                    Open Campus Office Suite (Docs / Sheets / Drive)
                  </button>
                  <button
                    onClick={() => navigate('/faculty/transport')}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-card border border-border hover:border-indigo-500 text-foreground font-bold text-sm shadow-sm transition"
                  >
                    <Bus className="h-4 w-4 text-indigo-500" />
                    Campus Bus & Live Tracking
                  </button>
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Today's Classes"
                    value={stats?.metrics?.todayClassesCount ?? 0}
                    trend="Schedule Active"
                    isPositive={true}
                    icon={Clock}
                    colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    onClick={() => setActiveTab('timetable')}
                  />
                  <MetricCard
                    title="Assigned Subjects"
                    value={stats?.metrics?.assignedSubjectsCount ?? 0}
                    trend="Odd Semester"
                    isPositive={true}
                    icon={BookOpen}
                    colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    onClick={() => setActiveTab('subjects')}
                  />
                  <MetricCard
                    title="Mentorship Wards"
                    value={stats?.metrics?.mentorStudentsCount ?? 0}
                    trend="Active Students"
                    isPositive={true}
                    icon={Heart}
                    colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    onClick={() => { setWorkspaceType('MENTOR'); setActiveTab('students'); }}
                  />
                  <MetricCard
                    title="Leave & Substitution"
                    value={stats?.metrics?.pendingLeaveReviewsCount ?? 0}
                    trend="Apply with Auto-Detect"
                    isPositive={true}
                    icon={Calendar}
                    colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    onClick={() => navigate('/faculty/hub?tab=leave')}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'timetable' && (
              <motion.div key="timetable" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-foreground">Weekly Lecture Schedule</h3>
                  <button onClick={fetchTimetable} className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </button>
                </div>
                {timetable.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-xl text-xs text-muted-foreground">
                    No timetable slots have been assigned to you yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
                      .map((day) => ({
                        day,
                        slots: timetable
                          .filter((slot) => slot.dayOfWeek === day)
                          .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0)),
                      }))
                      .filter(({ slots }) => slots.length > 0)
                      .map(({ day, slots }) => (
                        <div key={day} className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-2">
                          <h4 className="font-bold text-xs uppercase text-primary border-b border-border pb-1">{day.charAt(0) + day.slice(1).toLowerCase()}</h4>
                          {slots.map((slot) => (
                            <div key={slot.id} className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                              <span className="font-bold text-foreground block">{slot.subject?.name || 'Untitled Subject'}</span>
                              <span className="text-muted-foreground block text-[11px]">
                                {slot.section?.name || 'Section N/A'} • {slot.roomNo || 'Room N/A'} • {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'subjects' && (
              <motion.div key="subjects" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <h3 className="text-base font-bold text-foreground">Assigned Coursework & Subjects</h3>
                {subjects.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-xl text-xs text-muted-foreground">
                    No subjects have been assigned to you yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map((assignment) => (
                      <div key={assignment.id} className="p-4 bg-card border border-border rounded-xl shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary font-mono text-xs font-bold rounded">
                            {assignment.subject?.code || 'N/A'}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">{assignment.subject?.credits ?? 0} Credits</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-sm">{assignment.subject?.name || 'Untitled Subject'}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{assignment.section?.name || 'Section N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'attendance' && (
              <motion.div key="attendance" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border p-4 rounded-xl">
                  <div>
                    <h3 className="text-base font-bold text-foreground">Student Attendance Marker</h3>
                    <p className="text-xs text-muted-foreground">Select class period and record daily attendance status.</p>
                  </div>
                  {!activeSession && <span className="text-xs text-muted-foreground">Open a scheduled class below</span>}
                </div>
                {!activeSession ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {attendanceSessions.map((slot) => (
                      <button key={slot.id} onClick={() => openAttendanceSession(slot.id)} className="text-left rounded-xl border border-border bg-card p-4 transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <span className="block font-semibold">{slot.subject?.name}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">Period {slot.slotIndex} · {slot.section?.name} · {slot.roomNo} · {slot.startTime}–{slot.endTime}</span>
                      </button>
                    ))}
                    {attendanceSessions.length === 0 && <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground sm:col-span-2">No scheduled classes today.</div>}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                      <div><h4 className="font-semibold">{activeSession.slot.subject.name}</h4><p className="text-xs text-muted-foreground">{activeSession.slot.section.name} · Period {activeSession.slot.period} · {activeSession.slot.room}</p></div>
                      <button onClick={submitAttendance} disabled={isSubmittingAttendance} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{isSubmittingAttendance ? 'Submitting…' : 'Submit attendance'}</button>
                    </div>
                    <div className="divide-y">{activeSession.students.map((student: any) => <div key={student.id} className="flex items-center justify-between gap-3 p-3"><div><p className="text-sm font-medium">{student.name}</p><p className="text-xs text-muted-foreground">{student.admissionNo}</p></div><button onClick={() => setAttendanceRecords((current) => ({ ...current, [student.id]: current[student.id] === 'ABSENT' ? 'PRESENT' : 'ABSENT' }))} className={`min-w-24 rounded-lg px-3 py-2 text-xs font-semibold ${attendanceRecords[student.id] === 'ABSENT' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{attendanceRecords[student.id] || 'PRESENT'}</button></div>)}</div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'assignments' && (
              <motion.div key="assignments" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-foreground">Assignments & Student Homework</h3>
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Create Assignment
                  </button>
                </div>

                <div className="space-y-3">
                  {assignments.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl text-xs text-muted-foreground">
                      No assignments published yet. Click "Create Assignment" to assign coursework.
                    </div>
                  ) : (
                    assignments.map((a) => (
                      <div key={a.id} className="p-4 bg-card border rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <h4 className="font-bold text-foreground text-xs">{a.title}</h4>
                          <p className="text-xs text-muted-foreground">{a.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {a.subject?.name || a.targetSubject || 'Subject N/A'} · {a.section?.name || a.targetClass || 'Class N/A'} · {a._count?.submissions ?? 0} submission{(a._count?.submissions ?? 0) === 1 ? '' : 's'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={a.status || 'PUBLISHED'} size="sm" />
                          <button
                            onClick={() => handleViewSubmissions(a)}
                            className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-[11px] font-bold flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Submissions
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'leave' && (
              <motion.div key="leave" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-foreground">Leave & OD Requests</h3>
                  <button
                    onClick={() => navigate('/faculty/leave-od')}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                  >
                    Apply Leave / OD
                  </button>
                </div>

                <div className="space-y-3">
                  {leaveRequests.map((req) => (
                    <div key={req.id} className="p-4 bg-card border border-border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-xs">{req.title || req.type}</span>
                          <StatusBadge status={req.status} size="sm" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{req.reason}</p>
                      </div>
                      {req.status?.includes('PENDING') && (
                        <button
                          onClick={(e) => handleCancelLeave(req.id, e)}
                          className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold flex items-center gap-1"
                        >
                          <Ban className="h-3.5 w-3.5" /> Cancel Request
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'circulars' && (
              <motion.div key="circulars" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <h3 className="text-base font-bold text-foreground">Institutional & Department Circulars</h3>
                <div className="space-y-3">
                  {circulars.map((c) => (
                    <div key={c.id} className="p-4 bg-card border rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">{c.title}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.content}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div key="tasks" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                {/* Header & KPI Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
                  <div>
                    <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-primary" /> Assigned Tasks Workspace
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Review, manage, and complete administrative and academic directives from Department HOD & Deans.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchTasks}
                      disabled={tasksLoading}
                      className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted/50 text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${tasksLoading ? 'animate-spin text-primary' : ''}`} />
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Directives</p>
                      <p className="text-xl font-black text-foreground mt-0.5">{tasks.length}</p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <CheckSquare className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending Action</p>
                      <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                        {tasks.filter((t) => ['NOT_SEEN', 'PENDING', 'SEEN'].includes(t.status)).length}
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">In Progress</p>
                      <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {tasks.filter((t) => ['ACCEPTED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'SUBMITTED'].includes(t.status)).length}
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <Layers className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Completed</p>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {tasks.filter((t) => t.status === 'COMPLETED').length}
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                  <div className="flex items-center gap-1.5 p-1 bg-muted/40 border border-border rounded-xl">
                    {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((filterKey) => (
                      <button
                        key={filterKey}
                        onClick={() => setTaskFilter(filterKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          taskFilter === filterKey
                            ? 'bg-card text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {filterKey === 'ALL' && `All (${tasks.length})`}
                        {filterKey === 'PENDING' && `Pending (${tasks.filter((t) => ['NOT_SEEN', 'PENDING', 'SEEN'].includes(t.status)).length})`}
                        {filterKey === 'IN_PROGRESS' && `Active (${tasks.filter((t) => ['ACCEPTED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'SUBMITTED'].includes(t.status)).length})`}
                        {filterKey === 'COMPLETED' && `Done (${tasks.filter((t) => t.status === 'COMPLETED').length})`}
                      </button>
                    ))}
                  </div>

                  <div className="relative min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search tasks, ID, or department…"
                      value={taskSearchQuery}
                      onChange={(e) => setTaskSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-xl outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Task Cards List */}
                <div className="space-y-3">
                  {tasksLoading && tasks.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      Loading assigned directives…
                    </div>
                  ) : tasks.filter((t) => {
                    if (taskFilter === 'PENDING' && !['NOT_SEEN', 'PENDING', 'SEEN'].includes(t.status)) return false;
                    if (taskFilter === 'IN_PROGRESS' && !['ACCEPTED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'SUBMITTED'].includes(t.status)) return false;
                    if (taskFilter === 'COMPLETED' && t.status !== 'COMPLETED') return false;
                    if (taskSearchQuery.trim()) {
                      const q = taskSearchQuery.toLowerCase();
                      const matchTitle = t.title?.toLowerCase().includes(q);
                      const matchDesc = t.description?.toLowerCase().includes(q);
                      const matchNum = t.taskNumber?.toLowerCase().includes(q);
                      const matchDept = t.department?.name?.toLowerCase().includes(q);
                      if (!matchTitle && !matchDesc && !matchNum && !matchDept) return false;
                    }
                    return true;
                  }).length === 0 ? (
                    <div className="py-14 border border-dashed border-border rounded-2xl text-center flex flex-col items-center justify-center p-6 bg-card/40">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-sm text-foreground">No Directives Found</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mt-1">
                        {taskSearchQuery
                          ? 'No assigned tasks match your current search criteria.'
                          : 'You currently have no tasks matching this status filter. New directives from HOD or Dean will appear here.'}
                      </p>
                    </div>
                  ) : (
                    tasks
                      .filter((t) => {
                        if (taskFilter === 'PENDING' && !['NOT_SEEN', 'PENDING', 'SEEN'].includes(t.status)) return false;
                        if (taskFilter === 'IN_PROGRESS' && !['ACCEPTED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'SUBMITTED'].includes(t.status)) return false;
                        if (taskFilter === 'COMPLETED' && t.status !== 'COMPLETED') return false;
                        if (taskSearchQuery.trim()) {
                          const q = taskSearchQuery.toLowerCase();
                          const matchTitle = t.title?.toLowerCase().includes(q);
                          const matchDesc = t.description?.toLowerCase().includes(q);
                          const matchNum = t.taskNumber?.toLowerCase().includes(q);
                          const matchDept = t.department?.name?.toLowerCase().includes(q);
                          if (!matchTitle && !matchDesc && !matchNum && !matchDept) return false;
                        }
                        return true;
                      })
                      .map((t) => {
                        const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED';
                        const checklist = parseChecklist(t.checklist);
                        const priorityColors: Record<string, string> = {
                          URGENT: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                          HIGH: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                          MEDIUM: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                          LOW: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
                        };

                        return (
                          <div
                            key={t.id}
                            className="p-4 bg-card border border-border hover:border-primary/40 rounded-xl transition-all shadow-xs space-y-3"
                          >
                            {/* Card Top Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 bg-muted/60 text-muted-foreground font-mono text-[10px] font-bold rounded">
                                  {t.taskNumber || 'TSK'}
                                </span>
                                {t.priority && (
                                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${priorityColors[t.priority] || priorityColors.MEDIUM}`}>
                                    {t.priority}
                                  </span>
                                )}
                                {t.department?.name && (
                                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                                    • {t.department.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {t.dueDate && (
                                  <span className={`text-[10px] font-bold flex items-center gap-1 ${
                                    isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                                  }`}>
                                    <Clock className="h-3 w-3" />
                                    Due: {new Date(t.dueDate).toLocaleDateString('en-IN')}
                                    {isOverdue && <span className="px-1.5 py-0.2 bg-rose-500/10 text-[9px] rounded font-black">OVERDUE</span>}
                                  </span>
                                )}
                                <StatusBadge status={t.status || 'ASSIGNED'} size="sm" />
                              </div>
                            </div>

                            {/* Title & Description */}
                            <div>
                              <h4 className="font-bold text-sm text-foreground">{t.title}</h4>
                              {t.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                  {t.description}
                                </p>
                              )}
                            </div>

                            {/* Progress & Checklist Summary */}
                            {(t.completionPercent > 0 || checklist.length > 0) && (
                              <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                                <div>
                                  <div className="flex justify-between text-[10px] text-muted-foreground font-bold mb-1">
                                    <span>Progress</span>
                                    <span>{t.completionPercent || 0}%</span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full transition-all duration-300"
                                      style={{ width: `${t.completionPercent || 0}%` }}
                                    />
                                  </div>
                                </div>
                                {checklist.length > 0 && (
                                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 sm:justify-end">
                                    <CheckSquare className="h-3.5 w-3.5 text-primary" />
                                    <span>
                                      Checklist: {checklist.filter((c: any) => c.completed).length} / {checklist.length} items
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                              <div className="text-[11px] text-muted-foreground">
                                {t.createdBy && (
                                  <span>Assigned by: <strong className="text-foreground">{t.createdBy.firstName} {t.createdBy.lastName}</strong></span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {['NOT_SEEN', 'PENDING', 'SEEN'].includes(t.status) && (
                                  <button
                                    onClick={() => handleUpdateTaskStatus(t.id, 'IN_PROGRESS')}
                                    disabled={isSubmittingTaskAction}
                                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                                  >
                                    Accept & Start Task
                                  </button>
                                )}
                                {['ACCEPTED', 'IN_PROGRESS'].includes(t.status) && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateTaskStatus(t.id, 'COMPLETED')}
                                      disabled={isSubmittingTaskAction}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleOpenTaskDetails(t)}
                                  className="px-3 py-1.5 border border-border text-foreground hover:bg-muted text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <Eye className="h-3.5 w-3.5" /> View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'availability' && (
              <motion.div key="availability" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <DepartmentAvailabilityBoard />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      {/* Task Details & Action Modal */}
      <Modal
        isOpen={isTaskDetailsModalOpen}
        onClose={() => { setIsTaskDetailsModalOpen(false); setSelectedTaskForDetails(null); }}
        title={selectedTaskForDetails ? `Directive: ${selectedTaskForDetails.title}` : 'Task Details'}
        subtitle={selectedTaskForDetails?.taskNumber ? `Directive Code: ${selectedTaskForDetails.taskNumber}` : undefined}
        maxWidth="2xl"
      >
        {selectedTaskForDetails && (
          <div className="space-y-5 text-xs">
            {/* Meta tags */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 border border-border rounded-xl">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedTaskForDetails.status || 'ASSIGNED'} size="sm" />
                {selectedTaskForDetails.priority && (
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 text-[10px] font-extrabold uppercase rounded">
                    {selectedTaskForDetails.priority} Priority
                  </span>
                )}
                {selectedTaskForDetails.department?.name && (
                  <span className="text-[11px] text-muted-foreground">
                    {selectedTaskForDetails.department.name}
                  </span>
                )}
              </div>
              {selectedTaskForDetails.dueDate && (
                <span className="text-muted-foreground font-bold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Due: {new Date(selectedTaskForDetails.dueDate).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Description & Guidelines</label>
              <div className="p-3.5 bg-card border border-border rounded-xl text-foreground text-xs whitespace-pre-wrap leading-relaxed">
                {selectedTaskForDetails.description || 'No additional instructions provided for this task.'}
              </div>
            </div>

            {/* Progress Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Execution Progress ({taskProgressInput}%)</label>
                <button
                  onClick={() => handleUpdateTaskProgress(selectedTaskForDetails.id, taskProgressInput)}
                  disabled={isSubmittingTaskAction}
                  className="px-3 py-1 bg-primary text-primary-foreground font-bold text-[10px] rounded-lg disabled:opacity-50"
                >
                  Save Progress
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={taskProgressInput}
                onChange={(e) => setTaskProgressInput(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
            </div>

            {/* Interactive Checklist */}
            {parseChecklist(selectedTaskForDetails.checklist).length > 0 && (
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1.5">
                  Checklist Items ({parseChecklist(selectedTaskForDetails.checklist).filter((c: any) => c.completed).length}/{parseChecklist(selectedTaskForDetails.checklist).length})
                </label>
                <div className="space-y-1.5 border border-border rounded-xl p-3 bg-card">
                  {parseChecklist(selectedTaskForDetails.checklist).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => handleToggleChecklistItem(selectedTaskForDetails.id, idx)}
                      className="flex items-center gap-2 p-2 hover:bg-muted/40 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(item.completed)}
                        onChange={() => {}}
                        className="h-4 w-4 rounded accent-primary cursor-pointer"
                      />
                      <span className={`text-xs ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                        {item.text || item.title || item.label || `Step ${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Quick Transitions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
              <span className="text-[11px] text-muted-foreground font-semibold">Change Directive Status:</span>
              <div className="flex items-center gap-2">
                {selectedTaskForDetails.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleUpdateTaskStatus(selectedTaskForDetails.id, 'IN_PROGRESS')}
                    disabled={isSubmittingTaskAction}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg"
                  >
                    Start Task
                  </button>
                )}
                {selectedTaskForDetails.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleUpdateTaskStatus(selectedTaskForDetails.id, 'COMPLETED')}
                    disabled={isSubmittingTaskAction}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
                  </button>
                )}
              </div>
            </div>

            {/* Comments Thread */}
            <div className="pt-3 border-t border-border space-y-3">
              <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                Discussion & Activity Notes ({selectedTaskForDetails.comments?.length || 0})
              </label>

              {selectedTaskForDetails.comments && selectedTaskForDetails.comments.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedTaskForDetails.comments.map((cm: any) => (
                    <div key={cm.id} className="p-2.5 bg-muted/30 border border-border/60 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-foreground">
                          {cm.author?.firstName ? `${cm.author.firstName} ${cm.author.lastName}` : 'Faculty/Staff'}
                        </span>
                        <span className="text-muted-foreground">
                          {cm.createdAt ? new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{cm.comment || cm.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a progress update note or query…"
                  value={taskCommentInput}
                  onChange={(e) => setTaskCommentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddTaskComment(selectedTaskForDetails.id); }}
                  className="flex-1 px-3 py-2 text-xs bg-background border border-border rounded-xl outline-none focus:border-primary"
                />
                <button
                  onClick={() => handleAddTaskComment(selectedTaskForDetails.id)}
                  disabled={isSubmittingTaskAction || !taskCommentInput.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="h-3 w-3" /> Post
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Create New Student Assignment"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-muted-foreground block mb-1">Subject & Class</label>
            <select
              required
              value={assignSubjectAssignmentId}
              onChange={(e) => setAssignSubjectAssignmentId(e.target.value)}
              className="w-full bg-background border p-2.5 rounded-xl outline-none"
            >
              <option value="">-- Select assigned subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject?.code ? `${s.subject.code} — ` : ''}{s.subject?.name || 'Untitled Subject'} ({s.section?.name || 'Section N/A'})
                </option>
              ))}
            </select>
            {subjects.length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">No subjects are assigned to you yet, so an assignment cannot be published.</p>
            )}
          </div>
          <div>
            <label className="font-bold text-muted-foreground block mb-1">Assignment Title</label>
            <input
              type="text"
              required
              value={assignTitle}
              onChange={(e) => setAssignTitle(e.target.value)}
              placeholder="e.g. Lab Exercise 4: Tree Traversal Algorithms"
              className="w-full bg-background border p-2.5 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="font-bold text-muted-foreground block mb-1">Instructions & Guidelines</label>
            <textarea
              rows={3}
              value={assignDesc}
              onChange={(e) => setAssignDesc(e.target.value)}
              placeholder="Provide assignment submission guidelines..."
              className="w-full bg-background border p-2.5 rounded-xl outline-none resize-none"
            />
          </div>
          <div>
            <label className="font-bold text-muted-foreground block mb-1">Due Date</label>
            <input
              type="date"
              required
              value={assignDueDate}
              onChange={(e) => setAssignDueDate(e.target.value)}
              className="w-full bg-background border p-2.5 rounded-xl outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingAssignment || subjects.length === 0}
              className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50"
            >
              {isCreatingAssignment ? 'Publishing…' : 'Publish Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Submissions & Grading Modal */}
      <Modal
        isOpen={isSubmissionsModalOpen}
        onClose={() => { setIsSubmissionsModalOpen(false); setSelectedAssignmentForSubmissions(null); setSelectedSubmissionForGrading(null); }}
        title="Evaluate Submissions"
        subtitle={selectedAssignmentForSubmissions?.title}
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          {isLoadingSubmissions ? (
            <div className="text-center py-10 text-muted-foreground">Loading submissions…</div>
          ) : submissionsList.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">
              No solutions have been submitted yet for this assignment.
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-[10px] uppercase text-muted-foreground font-bold">
                      <th className="p-3">Student</th>
                      <th className="p-3">File</th>
                      <th className="p-3">Submitted</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionsList.map((sub: any) => (
                      <tr key={sub.id} className="border-b border-border/60 hover:bg-muted/20">
                        <td className="p-3">
                          <p className="font-bold text-foreground">{sub.student?.firstName} {sub.student?.lastName}</p>
                          <p className="text-[10px] text-muted-foreground">{sub.student?.admissionNo}</p>
                        </td>
                        <td className="p-3">
                          {sub.fileUrl ? (
                            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold block max-w-[140px] truncate">
                              {sub.fileName || 'Download File'}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">No file</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="p-3">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                            sub.status === 'GRADED' ? 'bg-emerald-500/10 text-emerald-600' :
                            sub.status === 'LATE' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-blue-500/10 text-blue-600'
                          }`}>{sub.status}</span>
                        </td>
                        <td className="p-3">
                          {sub.status === 'GRADED' ? (
                            <div>
                              <p className="font-bold text-foreground">{sub.marksObtained}/{selectedAssignmentForSubmissions?.maxMarks ?? 100}</p>
                              {sub.feedback && <p className="text-[10px] text-emerald-600 italic">"{sub.feedback}"</p>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Ungraded</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => { setSelectedSubmissionForGrading(sub); setGradeMarks(String(sub.marksObtained ?? '')); setGradeFeedback(sub.feedback || ''); }}
                            className="px-2.5 py-1 bg-primary text-primary-foreground rounded text-[10px] font-bold"
                          >
                            Grade
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedSubmissionForGrading && (
            <form onSubmit={handleGradeSubmission} className="border-t border-border pt-4 space-y-3 bg-muted/20 p-4 rounded-xl">
              <h4 className="font-bold text-foreground uppercase text-[10px]">
                Grade submission for {selectedSubmissionForGrading.student?.firstName} {selectedSubmissionForGrading.student?.lastName}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Marks (Max: {selectedAssignmentForSubmissions?.maxMarks ?? 100})</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={selectedAssignmentForSubmissions?.maxMarks ?? 100}
                    value={gradeMarks}
                    onChange={(e) => setGradeMarks(e.target.value)}
                    className="h-9 border border-border rounded-lg bg-background px-3"
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Feedback</label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      placeholder="e.g. Excellent solution structure and analysis."
                      className="h-9 border border-border rounded-lg bg-background px-3 flex-1"
                    />
                    <button type="submit" disabled={isSavingGrade} className="px-4 bg-primary text-primary-foreground font-bold h-9 rounded-lg disabled:opacity-50">
                      {isSavingGrade ? 'Saving…' : 'Save Grade'}
                    </button>
                    <button type="button" onClick={() => setSelectedSubmissionForGrading(null)} className="px-3 border border-border font-bold h-9 rounded-lg">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default FacultyWorkspacePortal;
