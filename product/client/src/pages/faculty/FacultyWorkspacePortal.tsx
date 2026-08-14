import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Clock, Users, CheckSquare, Award, FileText, Send, Calendar,
  AlertTriangle, Upload, RefreshCw, Eye, Plus, CheckCircle2, ChevronRight, MessageSquare, Download,
  Sparkles, Layers, Filter, Search, Bell, Shield, ArrowUpRight, BarChart2, Heart, UserCheck, Ban, User,
  Paperclip, X
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
    if (activeTab === 'assignments') fetchAssignments();
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

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      if (res.data?.status === 'success') setTasks(res.data.data?.tasks || res.data.data || []);
    } catch (err) {
      console.error('Tasks error:', err);
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
    try {
      await api.post('/assignments', {
        title: assignTitle,
        description: assignDesc,
        dueDate: assignDueDate,
      });
      toast.success('Assignment created & published');
      setIsAssignModalOpen(false);
      setAssignTitle('');
      setAssignDesc('');
      fetchAssignments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                    <div key={day} className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-2">
                      <h4 className="font-bold text-xs uppercase text-primary border-b border-border pb-1">{day}</h4>
                      <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                        <span className="font-bold text-foreground block">Data Structures & Algorithms</span>
                        <span className="text-muted-foreground block text-[11px]">CSE-A • Room 302 • 09:30 AM - 10:30 AM</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'subjects' && (
              <motion.div key="subjects" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <h3 className="text-base font-bold text-foreground">Assigned Coursework & Subjects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { code: 'CS301', name: 'Data Structures & Algorithms', sem: 'Semester III', sec: 'Sec A', students: 64, load: '4 Hrs/Wk' },
                    { code: 'CS304', name: 'Database Management Systems', sem: 'Semester III', sec: 'Sec B', students: 58, load: '3 Hrs/Wk' },
                    { code: 'CS502', name: 'Web Application Development', sem: 'Semester V', sec: 'Sec A', students: 62, load: '4 Hrs/Wk' },
                  ].map((sub) => (
                    <div key={sub.code} className="p-4 bg-card border border-border rounded-xl shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary font-mono text-xs font-bold rounded">
                          {sub.code}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">{sub.sem}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{sub.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{sub.sec} • {sub.students} Enrolled Students</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                      <div key={a.id} className="p-4 bg-card border rounded-xl flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-foreground text-xs">{a.title}</h4>
                          <p className="text-xs text-muted-foreground">{a.description}</p>
                        </div>
                        <StatusBadge status={a.status || 'PUBLISHED'} size="sm" />
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
              <motion.div key="tasks" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                <h3 className="text-base font-bold text-foreground">Assigned Tasks</h3>
                <div className="space-y-3">
                  {tasks.map((t) => (
                    <div key={t.id} className="p-4 bg-card border rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-xs text-foreground">{t.title}</h4>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                      <StatusBadge status={t.status || 'ASSIGNED'} size="sm" />
                    </div>
                  ))}
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

      {/* Create Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Create New Student Assignment"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
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
              className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl"
            >
              Publish Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FacultyWorkspacePortal;
