import React, { useState, useEffect } from 'react';
import {
  Users, CheckSquare, Heart, ShieldAlert,
  Plus, Check, X, Send, Eye, RefreshCw, Calendar, Phone, MessageSquare, AlertTriangle, FileText, ArrowUpRight
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';
import { DepartmentAvailabilityBoard } from '../../components/department/DepartmentAvailabilityBoard';

export const MentorWorkspacePortal: React.FC = () => {
  const { user, switchWorkspace } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'students' | 'approvals' | 'monitoring' | 'counseling' | 'parent_comm' | 'availability'
  >('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Submodule Data
  const [students, setStudents] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Counseling Modal
  const [isCounselingModalOpen, setIsCounselingModalOpen] = useState(false);
  const [counselingNotes, setCounselingNotes] = useState('');
  const [counselingAction, setCounselingAction] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('MENTOR_ONLY');

  // Parent Communication Modal
  const [isParentCommModalOpen, setIsParentCommModalOpen] = useState(false);
  const [commType, setCommType] = useState('CALL');
  const [commNotes, setCommNotes] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    if (activeTab === 'approvals') fetchPendingRequests();
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor/dashboard');
      if (res.data?.status === 'success') {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load mentor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor/students');
      if (res.data?.status === 'success') setStudents(res.data.data);
    } catch (err) {
      toast.error('Failed to load mentor student roster');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor/leave-od');
      if (res.data?.status === 'success') setPendingRequests(res.data.data);
    } catch (err) {
      toast.error('Failed to load pending leave/OD requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async (requestId: string, action: 'APPROVE' | 'REJECT', remarks?: string) => {
    try {
      const res = await api.post(`/mentor/leave-od/${requestId}/review`, {
        action,
        remarks,
      });
      if (res.data?.status === 'success') {
        toast.success(action === 'APPROVE' ? 'Approved and forwarded to Department HOD!' : 'Request rejected.');
        fetchPendingRequests();
        fetchDashboardStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to review request');
    }
  };

  const handleAddCounseling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !counselingNotes.trim()) return;
    try {
      const res = await api.post(`/mentor/students/${selectedStudent.id}/counseling`, {
        notes: counselingNotes,
        actionTaken: counselingAction,
        privacyLevel,
      });
      if (res.data?.status === 'success') {
        toast.success('Confidential counseling record saved!');
        setIsCounselingModalOpen(false);
        setCounselingNotes('');
        setCounselingAction('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add counseling note');
    }
  };

  const handleLogParentComm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !commNotes.trim()) return;
    toast.success(`Logged ${commType} communication record with parent of ${selectedStudent.name}`);
    setIsParentCommModalOpen(false);
    setCommNotes('');
  };

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {/* 1. Header Banner & Workspace Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-card border rounded-2xl p-6 shadow-xs gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
            Mentor Module
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-1.5">Mentor Responsibilities</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage assigned students, Leave/OD requests and counselling • Department of {stats?.mentorInfo?.departmentName || 'Computer Science and Engineering'}
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={fetchDashboardStats}
            className="h-9 px-3.5 border rounded-xl text-xs font-extrabold hover:bg-muted flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
          </button>
        </div>
      </div>

      {/* 2. Structured Tabs */}
      <div className="flex border-b gap-2 overflow-x-auto pb-1">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Heart },
          { id: 'students', label: 'My Mentor Students', icon: Users },
          { id: 'approvals', label: 'Leave / OD Approvals', icon: CheckSquare, badge: stats?.metrics?.pendingLeaveOdApprovals },
          { id: 'monitoring', label: 'Attendance Risk Alerts', icon: ShieldAlert },
          { id: 'availability', label: 'Department Board', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
          {/* Clickable Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Assigned Students', val: stats?.metrics?.totalAssignedStudents || 0, sub: 'Active mentees', target: 'students', color: 'text-primary' },
              { label: 'Pending Approvals', val: stats?.metrics?.pendingLeaveOdApprovals || 0, sub: 'Leave & OD', target: 'approvals', color: 'text-amber-600' },
              { label: 'Students On Leave', val: stats?.metrics?.studentsOnLeaveToday || 0, sub: 'Today', target: 'availability', color: 'text-muted-foreground' },
              { label: 'Students On OD', val: stats?.metrics?.studentsOnOdToday || 0, sub: 'Approved OD', target: 'availability', color: 'text-emerald-600' },
            ].map((card, idx) => (
              <div
                key={idx}
                onClick={() => setActiveTab(card.target as any)}
                className="p-4 bg-card border rounded-2xl shadow-xs hover:border-primary/50 transition-all cursor-pointer space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.label}</span>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className={`text-2xl font-black ${card.color}`}>{card.val}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Mentor Quick Actions Bar */}
          <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground border-b pb-2">Mentor Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Review Leave & OD', action: () => setActiveTab('approvals'), icon: CheckSquare },
                { label: 'View Mentor Students', action: () => setActiveTab('students'), icon: Users },
                { label: 'Attendance Risk Alerts', action: () => setActiveTab('monitoring'), icon: ShieldAlert },
                { label: 'Department Board', action: () => setActiveTab('availability'), icon: Calendar },
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <button
                    key={i}
                    onClick={act.action}
                    className="p-3 border rounded-xl bg-muted/10 hover:bg-primary/10 hover:border-primary/30 transition-all flex items-center gap-2 cursor-pointer group"
                  >
                    <Icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-extrabold text-foreground">{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Student Roster */}
          <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold">Recent Mentor Student Roster</h3>
            {!stats?.recentStudents || stats.recentStudents.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No assigned students found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stats.recentStudents.map((s: any) => (
                  <div key={s.id} className="p-3.5 border rounded-xl bg-muted/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-foreground block">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Admission: {s.admissionNo}</span>
                      <span className="text-[10px] text-muted-foreground block">Parent: {s.parentName} ({s.parentPhone})</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStudent(s);
                        setIsCounselingModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-extrabold rounded-lg hover:bg-primary/20"
                    >
                      Counseling Note
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY STUDENTS ROSTER */}
      {activeTab === 'students' && (
        <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold">Assigned Mentor Student Directory</h3>
          {students.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">No students assigned to your mentorship.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 border-b text-[10px] font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Admission No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Parent Contact</th>
                    <th className="p-3">Attendance Rate</th>
                    <th className="p-3">Risk Alert</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/10">
                      <td className="p-3 font-mono font-bold">{s.admissionNo}</td>
                      <td className="p-3 font-extrabold">{s.name}</td>
                      <td className="p-3">
                        <span className="font-semibold block">{s.parentName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{s.parentPhone}</span>
                      </td>
                      <td className="p-3 font-black text-xs font-mono">{s.attendancePercentage}%</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          s.riskLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20' :
                          s.riskLevel === 'WARNING' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-700'
                        }`}>
                          {s.riskLevel}
                        </span>
                      </td>
                      <td className="p-3 flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setIsCounselingModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-extrabold rounded-lg hover:bg-primary/20"
                        >
                          Counseling
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setIsParentCommModalOpen(true);
                          }}
                          className="px-2.5 py-1 border text-[10px] font-bold rounded-lg hover:bg-muted"
                        >
                          Log Parent Call
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LEAVE & OD APPROVALS DESK */}
      {activeTab === 'approvals' && (
        <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold">Student Leave & OD Approval Desk</h3>
          {pendingRequests.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No pending student leave or OD applications.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((r) => (
                <div key={r.id} className="p-4 border rounded-2xl bg-muted/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold">{r.studentName} ({r.admissionNo})</span>
                      <span className="text-[10px] text-muted-foreground block font-mono">Req: {r.requestNumber}</span>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                      {r.type === 'ON_DUTY' ? 'ON-DUTY (OD)' : 'LEAVE'}
                    </span>
                  </div>

                  <p className="text-xs text-foreground font-medium">Reason: {r.reason}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Duration: {new Date(r.startDate).toLocaleDateString('en-IN')} to {new Date(r.endDate).toLocaleDateString('en-IN')}
                  </p>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleReviewRequest(r.id, 'REJECT', 'Rejected by Mentor')}
                      className="px-3 py-1.5 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReviewRequest(r.id, 'APPROVE', 'Approved and forwarded to HOD')}
                      className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl hover:bg-primary/95"
                    >
                      Approve & Forward to HOD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RISK MONITORING */}
      {activeTab === 'monitoring' && (
        <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-rose-600 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Low Attendance Risk Monitoring (&lt; 75%)
          </h3>
          <p className="text-xs text-muted-foreground">
            Automated threshold alerts for students requiring immediate mentor intervention and parent alerts.
          </p>

          <div className="divide-y border rounded-xl overflow-hidden">
            {students.filter(s => s.attendancePercentage < 75).length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">No students currently below the 75% attendance threshold.</p>
            ) : (
              students.filter(s => s.attendancePercentage < 75).map(s => (
                <div key={s.id} className="p-3.5 flex items-center justify-between hover:bg-muted/10">
                  <div>
                    <span className="text-xs font-extrabold text-foreground">{s.name} ({s.admissionNo})</span>
                    <span className="text-[10px] text-muted-foreground block">Parent: {s.parentName} ({s.parentPhone})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-rose-600 font-mono">{s.attendancePercentage}%</span>
                    <span className="text-[9px] uppercase font-bold text-rose-700 bg-rose-500/10 px-2 py-0.5 rounded block mt-0.5">
                      CRITICAL RISK
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AVAILABILITY BOARD */}
      {activeTab === 'availability' && (
        <DepartmentAvailabilityBoard />
      )}

      {/* Counseling Modal */}
      {isCounselingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold">Add Counseling Note for {selectedStudent?.name}</h3>
              <button onClick={() => setIsCounselingModalOpen(false)} className="text-xs text-muted-foreground">✕</button>
            </div>
            <form onSubmit={handleAddCounseling} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Confidentiality Scope</label>
                <select
                  value={privacyLevel}
                  onChange={(e) => setPrivacyLevel(e.target.value)}
                  className="w-full h-9 border rounded-xl bg-background px-3 text-xs font-bold"
                >
                  <option value="MENTOR_ONLY">Mentor Only (Strict Private)</option>
                  <option value="MENTOR_AND_HOD">Mentor & Department HOD</option>
                  <option value="AUTHORIZED_SENIOR_ROLES">Senior Welfare Team</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Counseling Notes & Observations</label>
                <textarea
                  rows={4}
                  required
                  value={counselingNotes}
                  onChange={(e) => setCounselingNotes(e.target.value)}
                  placeholder="Enter notes regarding student's academic or attendance progress..."
                  className="w-full border rounded-xl bg-background p-3 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Action Taken / Handover</label>
                <input
                  type="text"
                  value={counselingAction}
                  onChange={(e) => setCounselingAction(e.target.value)}
                  placeholder="e.g. Scheduled parent meeting / Assigned tutoring"
                  className="w-full h-9 border rounded-xl bg-background px-3 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsCounselingModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parent Comm Modal */}
      {isParentCommModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold">Log Parent Communication for {selectedStudent?.name}</h3>
              <button onClick={() => setIsParentCommModalOpen(false)} className="text-xs text-muted-foreground">✕</button>
            </div>
            <form onSubmit={handleLogParentComm} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Communication Channel</label>
                <select
                  value={commType}
                  onChange={(e) => setCommType(e.target.value)}
                  className="w-full h-9 border rounded-xl bg-background px-3 text-xs font-bold"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="MEETING">In-Person Meeting</option>
                  <option value="SMS">SMS / WhatsApp</option>
                  <option value="EMAIL">Email Alert</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Summary & Minutes</label>
                <textarea
                  rows={3}
                  required
                  value={commNotes}
                  onChange={(e) => setCommNotes(e.target.value)}
                  placeholder="Enter call summary or meeting decisions..."
                  className="w-full border rounded-xl bg-background p-3 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsParentCommModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl">Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar for Mentor */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-2 flex justify-around items-center z-40">
        {[
          { id: 'dashboard', label: 'Home', icon: Heart },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'approvals', label: 'Requests', icon: CheckSquare },
          { id: 'monitoring', label: 'Alerts', icon: ShieldAlert },
          { id: 'availability', label: 'Board', icon: Calendar },
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

export default MentorWorkspacePortal;
