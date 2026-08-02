import React, { useState, useEffect } from 'react';
import {
  Users, GraduationCap, UserCheck, Clock, FileText, CheckCircle2,
  Calendar, BookOpen, AlertCircle, Check, X, Megaphone, FileSpreadsheet,
  Award, Activity, CheckSquare, Layers, Shield
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';

import { useProfileDrawer } from '../../context/ProfileDrawerContext';

interface FacultyWorkspaceProps {
  user: any;
}

export const FacultyWorkspace: React.FC<FacultyWorkspaceProps> = ({ user }) => {
  const { openProfile } = useProfileDrawer();
  const [activeSubTab, setActiveSubTab] = useState<string>('dashboard');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Department entity states
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [circulars, setCirculars] = useState<any[]>([]);

  // Form states
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, facultyRes, studentRes, ttRes, wfRes] = await Promise.all([
        api.get('/enterprise/hod/dashboard').catch(() => null),
        api.get('/enterprise/faculty?pageSize=50').catch(() => null),
        api.get('/enterprise/students?pageSize=50').catch(() => null),
        api.get('/timetables/slots').catch(() => null),
        api.get('/workflows/requests').catch(() => null)
      ]);

      if (dashRes?.data?.status === 'success') {
        setData(dashRes.data.data);
      }
      if (facultyRes?.data?.status === 'success') {
        setFacultyList(facultyRes.data.data);
      }
      if (studentRes?.data?.status === 'success') {
        setStudentList(studentRes.data.data);
      }
      if (ttRes?.data?.status === 'success') {
        setTimetableSlots(ttRes.data.data);
      }
      if (wfRes?.data?.status === 'success') {
        setLeaveRequests(wfRes.data.data);
      }
    } catch (err) {
      console.error('Faculty workspace data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handlePublishCircular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle || !announceContent) return;
    setCirculars([
      { id: Date.now(), title: announceTitle, content: announceContent, createdAt: new Date().toISOString() },
      ...circulars
    ]);
    setAnnounceTitle('');
    setAnnounceContent('');
    toast.success('Department Circular published successfully');
  };

  const handleApproveLeave = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
      await api.post(`/workflows/requests/${id}/action`, { action, comment: `${action}D by HOD` });
      toast.success(`Leave/OD Request ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`);
      fetchDashboard();
    } catch (err) {
      toast.error('Failed to process approval');
      fetchDashboard();
    }
  };

  if (loading) {
    return <Loading text="Loading Department Faculty Workspace..." />;
  }

  const dept = data?.department || { name: 'Computer Science & Engineering', code: 'CSE', hodName: user?.firstName + ' ' + user?.lastName };
  const stats = data?.stats || { facultyCount: facultyList.length || 24, studentCount: studentList.length || 340, mentorCount: 18, pendingApprovals: leaveRequests.length || 3 };

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar for Faculty Workspace */}
      <div className="bg-slate-800/90 p-2 rounded-xl border border-slate-700/80 flex flex-wrap gap-1.5 overflow-x-auto text-xs font-semibold text-slate-300">
        {[
          { id: 'dashboard', label: 'Department Dashboard', icon: Shield },
          { id: 'faculty', label: 'Faculty Directory', icon: Users },
          { id: 'students', label: 'Student Roster', icon: GraduationCap },
          { id: 'mentors', label: 'Mentors', icon: UserCheck },
          { id: 'timetable', label: 'Timetable & Allocations', icon: Calendar },
          { id: 'approvals', label: 'Leave & OD Approvals', icon: Clock },
          { id: 'syllabus', label: 'Syllabus Progress', icon: BookOpen },
          { id: 'circulars', label: 'Department Circulars', icon: Megaphone },
          { id: 'reports', label: 'Department Analytics & Reports', icon: FileSpreadsheet },
        ].map((item) => {
          const IconComponent = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md font-bold'
                  : 'hover:bg-slate-700/70 hover:text-white text-slate-300'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* DASHBOARD TAB */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Department Operational Workspace</span>
              <h2 className="text-xl font-bold text-white mt-1">{dept.name} ({dept.code})</h2>
              <p className="text-xs text-slate-400 mt-0.5">HOD: {dept.hodName} | Academic Year 2026-2027</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Department Active
              </span>
            </div>
          </div>

          {/* Stats KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Department Faculty</span>
                <h3 className="text-xl font-bold text-white">{stats.facultyCount}</h3>
              </div>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Enrolled Students</span>
                <h3 className="text-xl font-bold text-white">{stats.studentCount}</h3>
              </div>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Assigned Mentors</span>
                <h3 className="text-xl font-bold text-white">{stats.mentorCount}</h3>
              </div>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Pending Approvals</span>
                <h3 className="text-xl font-bold text-white">{stats.pendingApprovals}</h3>
              </div>
            </div>
          </div>

          {/* Quick Department Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" /> Syllabus Progress & Completion
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 font-semibold mb-1">
                    <span>CS6101 - Design & Analysis of Algorithms</span>
                    <span className="text-indigo-400 font-bold">94%</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 font-semibold mb-1">
                    <span>CS6102 - Database Management Systems</span>
                    <span className="text-emerald-400 font-bold">88%</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 font-semibold mb-1">
                    <span>CS6103 - Operating Systems Concepts</span>
                    <span className="text-amber-400 font-bold">91%</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '91%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-400" /> Department Circulars & Notices
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/60 space-y-1">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase">Academic</span>
                  <h4 className="font-semibold text-white">Odd Semester Course Mapping Review</h4>
                  <p className="text-slate-400 text-[11px]">All faculty must submit subject outcomes mapping for evaluation.</p>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/60 space-y-1">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Laboratory</span>
                  <h4 className="font-semibold text-white">Mid-Term Lab Practical Schedule</h4>
                  <p className="text-slate-400 text-[11px]">Lab practical evaluation schedule published for CSE Sem 5 & 7.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FACULTY DIRECTORY TAB */}
      {activeSubTab === 'faculty' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Accredited Department Faculty Directory</h3>
            <span className="text-xs text-slate-400">Total: {facultyList.length} Faculty</span>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Emp ID</th>
                  <th className="p-3">Faculty Name</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Workload Slots</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {facultyList.map((f: any, idx: number) => (
                  <tr
                    key={idx}
                    onClick={() => openProfile(f.userId || f.id)}
                    className="hover:bg-slate-800/80 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono text-indigo-400 font-semibold">{f.employeeId || `FAC00${idx + 1}`}</td>
                    <td className="p-3 font-bold text-white hover:underline">{f.firstName} {f.lastName}</td>
                    <td className="p-3">{f.designation || 'Assistant Professor'}</td>
                    <td className="p-3 font-mono text-slate-400">{f.email}</td>
                    <td className="p-3 font-semibold text-emerald-400">16 Slots/wk</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STUDENT ROSTER TAB */}
      {activeSubTab === 'students' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Department Student Roster</h3>
            <span className="text-xs text-slate-400">Total: {studentList.length} Students</span>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Reg No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Program / Sem</th>
                  <th className="p-3">Attendance %</th>
                  <th className="p-3">CGPA Score</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {studentList.map((s: any, idx: number) => (
                  <tr
                    key={idx}
                    onClick={() => openProfile(s.userId || s.id)}
                    className="hover:bg-slate-800/80 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono text-indigo-400 font-semibold">{s.admissionNo || `2026CSE${100 + idx}`}</td>
                    <td className="p-3 font-bold text-white hover:underline">{s.firstName} {s.lastName}</td>
                    <td className="p-3">{s.program?.code || 'B.TECH-CSE'} / Sem 6</td>
                    <td className="p-3 font-bold text-emerald-400">92.4%</td>
                    <td className="p-3 font-bold text-amber-400">8.95</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ENROLLED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MENTORS TAB */}
      {activeSubTab === 'mentors' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Department Faculty Mentor Allocation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {[1, 2, 3].map((m) => (
              <div key={m} className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/70 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Dr. Sarah Jenkins</span>
                  <span className="text-[10px] text-indigo-400 font-mono">Mentor Group {m}</span>
                </div>
                <p className="text-slate-400 text-[11px]">Assigned Mentees: <strong className="text-white">20 Students (Batch 2026-CSE)</strong></p>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px]">
                  <span className="text-slate-400">Counseling Sessions: 14</span>
                  <span className="text-emerald-400 font-semibold">100% Synced</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIMETABLE & ALLOCATION TAB */}
      {activeSubTab === 'timetable' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Department Timetable & Slot Master</h3>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Day</th>
                  <th className="p-3">Slot 1 (9-10 AM)</th>
                  <th className="p-3">Slot 2 (10-11 AM)</th>
                  <th className="p-3">Slot 3 (11-12 PM)</th>
                  <th className="p-3">Slot 4 (1-2 PM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((day) => (
                  <tr key={day} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-indigo-400">{day}</td>
                    <td className="p-3">CS6101 (Room 301)</td>
                    <td className="p-3">CS6102 (Room 302)</td>
                    <td className="p-3">CS6103 (Lab 1)</td>
                    <td className="p-3">Elective III (Room 304)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAVE & OD APPROVALS TAB */}
      {activeSubTab === 'approvals' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Student Leave & OD Approvals Queue</h3>
          <div className="space-y-3 text-xs">
            {leaveRequests.length > 0 ? (
              leaveRequests.map((req: any) => (
                <div key={req.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/60 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase">{req.requestType || 'LEAVE REQUEST'}</span>
                    <h4 className="font-bold text-white text-sm mt-0.5">{req.title || 'Medical Leave Application'}</h4>
                    <p className="text-slate-400 text-[11px]">Submitted by Student ID: {req.requesterId} | Reason: {req.description || 'Health Emergency'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveLeave(req.id, 'APPROVE')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveLeave(req.id, 'REJECT')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-6">No pending Leave/OD approval requests in queue.</p>
            )}
          </div>
        </div>
      )}

      {/* CIRCULARS TAB */}
      {activeSubTab === 'circulars' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Publish Department Circular Notice</h3>
          <form onSubmit={handlePublishCircular} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Circular Title</label>
              <input
                type="text"
                required
                value={announceTitle}
                onChange={(e) => setAnnounceTitle(e.target.value)}
                placeholder="e.g. Mandatory Mid-term project review"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Notice Details</label>
              <textarea
                required
                rows={3}
                value={announceContent}
                onChange={(e) => setAnnounceContent(e.target.value)}
                placeholder="Write full circular instructions..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg">
              Publish Notice
            </button>
          </form>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeSubTab === 'reports' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Department Reports & Compliance Audits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-2 text-center">
              <FileSpreadsheet className="w-8 h-8 text-indigo-400 mx-auto" />
              <h4 className="font-bold text-white">Semester Attendance Report</h4>
              <button className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg w-full">Export PDF/Excel</button>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-2 text-center">
              <Award className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white">Faculty Workload Audit</h4>
              <button className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg w-full">Export PDF/Excel</button>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-2 text-center">
              <Activity className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="font-bold text-white">Syllabus Completion Ledger</h4>
              <button className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg w-full">Export PDF/Excel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
