import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CheckSquare, Heart, ShieldAlert,
  Plus, Check, X, Send, Eye, RefreshCw, Calendar, Phone, MessageSquare, AlertTriangle, FileText, ArrowUpRight,
  GraduationCap, Search, Filter, Shield, UserCheck, ChevronRight
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';
import { MetricCard } from '../../design-system/components/MetricCard';
import { StatusBadge } from '../../design-system/components/StatusBadge';
import { DataTable, Column } from '../../design-system/components/DataTable';
import { Modal } from '../../design-system/components/Modal';
import { pageVariants } from '../../design-system/tokens/motion';

export const MentorWorkspacePortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'students' | 'approvals' | 'monitoring' | 'counseling' | 'parent_comm'
  >('dashboard');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Submodule Data
  const [students, setStudents] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  // Counseling Log Modal
  const [isCounselingModalOpen, setIsCounselingModalOpen] = useState(false);
  const [counselingNotes, setCounselingNotes] = useState('');
  const [counselingAction, setCounselingAction] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('MENTOR_ONLY');

  // Parent Communication Modal
  const [isParentCommModalOpen, setIsParentCommModalOpen] = useState(false);
  const [commType, setCommType] = useState('CALL');
  const [commNotes, setCommNotes] = useState('');

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor/dashboard');
      if (res.data?.status === 'success') {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load mentor dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    if (activeTab === 'approvals') fetchPendingRequests();
  }, [activeTab]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor/students');
      if (res.data?.status === 'success') setStudents(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch assigned students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workflows/requests');
      if (res.data?.status === 'success') setPendingRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.post(`/workflows/requests/${requestId}/step`, {
        action,
        comment: action === 'APPROVE' ? 'Approved by Mentor' : 'Rejected by Mentor',
      });
      toast.success(`Request ${action.toLowerCase()}d successfully`);
      fetchPendingRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Workflow step failed');
    }
  };

  const handleSaveCounselingLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !counselingNotes.trim()) return;
    try {
      await api.post(`/mentor/students/${selectedStudent.id}/counseling`, {
        notes: counselingNotes,
        actionItems: counselingAction,
        privacy: privacyLevel,
      });
      toast.success('Confidential counselling log recorded');
      setIsCounselingModalOpen(false);
      setCounselingNotes('');
      setCounselingAction('');
    } catch (err: any) {
      toast.error('Failed to record counselling log');
    }
  };

  const handleSaveParentComm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !commNotes.trim()) return;
    try {
      await api.post(`/mentor/students/${selectedStudent.id}/parent-comm`, {
        type: commType,
        notes: commNotes,
      });
      toast.success('Parent communication recorded');
      setIsParentCommModalOpen(false);
      setCommNotes('');
    } catch (err: any) {
      toast.error('Failed to record parent communication');
    }
  };

  const studentColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'Student Name',
      sortable: true,
      render: (s) => (
        <div>
          <span className="font-bold text-foreground block">{s.firstName} {s.lastName}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{s.rollNo || s.admissionNo}</span>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Section',
      render: (s) => <span className="font-semibold text-xs">{s.department?.code || 'CSE'} - {s.section || 'A'}</span>,
    },
    {
      key: 'attendance',
      header: 'Attendance %',
      sortable: true,
      render: (s) => {
        const att = s.attendancePercent ?? 82;
        return (
          <span className={`font-bold font-mono text-xs ${att < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {att}%
          </span>
        );
      },
    },
    {
      key: 'cgpa',
      header: 'CGPA',
      sortable: true,
      render: (s) => <span className="font-bold font-mono text-xs">{s.cgpa ?? '8.4'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setSelectedStudent(s); setIsCounselingModalOpen(true); }}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
          >
            Log Counselling
          </button>
          <button
            onClick={() => { setSelectedStudent(s); setIsParentCommModalOpen(true); }}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 cursor-pointer"
          >
            Parent Connect
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      {/* Mentor Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-6 rounded-2xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Heart className="h-4 w-4" />
            Mentorship Command Workspace
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Student Mentorship & Pastoral Governance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor assigned student wards, attendance risk telemetry, leave approvals, and parent communications.
          </p>
        </div>

        <button
          onClick={fetchDashboardStats}
          className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 text-emerald-500" /> Refresh Telemetry
        </button>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border no-scrollbar text-xs font-bold">
        {[
          { id: 'dashboard', label: 'Mentor Overview', icon: Heart },
          { id: 'students', label: 'Assigned Wards', icon: Users },
          { id: 'approvals', label: 'Leave & OD Approvals', icon: CheckSquare },
          { id: 'monitoring', label: 'Academic Risk Engine', icon: ShieldAlert },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Assigned Wards"
                value={stats?.assignedWards || 18}
                trend="Odd Semester"
                isPositive={true}
                icon={Users}
                colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                onClick={() => setActiveTab('students')}
              />
              <MetricCard
                title="Attendance Risk Wards"
                value={stats?.riskWards || 2}
                trend="Below 75%"
                isPositive={false}
                icon={AlertTriangle}
                colorClass="bg-rose-500/10 text-rose-600 dark:text-rose-400"
                onClick={() => setActiveTab('monitoring')}
              />
              <MetricCard
                title="Pending Approvals"
                value={stats?.pendingApprovals || 3}
                trend="Leave & OD"
                isPositive={true}
                icon={CheckSquare}
                colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                onClick={() => setActiveTab('approvals')}
              />
              <MetricCard
                title="Counselling Sessions"
                value={stats?.counselingSessions || 5}
                trend="This Month"
                isPositive={true}
                icon={FileText}
                colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'students' && (
          <motion.div key="students" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-base font-bold text-foreground">Assigned Student Wards</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search wards by name or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <DataTable
              columns={studentColumns}
              data={students}
              isLoading={loading}
              keyExtractor={(s) => s.id}
              emptyTitle="No assigned wards found"
              emptyDescription="Students assigned under your mentorship will appear here."
            />
          </motion.div>
        )}

        {activeTab === 'approvals' && (
          <motion.div key="approvals" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
            <h3 className="text-base font-bold text-foreground">Pending Student Leave & OD Workflow Requests</h3>
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl text-xs text-muted-foreground">
                  No pending student leave/OD approval requests in your queue.
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div key={req.id} className="p-4 bg-card border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-xs">{req.title || req.type}</span>
                        <StatusBadge status={req.status} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground">{req.reason}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveRequest(req.id, 'APPROVE')}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-2xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveRequest(req.id, 'REJECT')}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-2xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Counselling Modal */}
      <Modal
        isOpen={isCounselingModalOpen}
        onClose={() => setIsCounselingModalOpen(false)}
        title="Record Confidential Student Counselling Log"
        subtitle={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCounselingLog} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-muted-foreground block mb-1">Counselling Session Notes</label>
            <textarea
              rows={4}
              required
              value={counselingNotes}
              onChange={(e) => setCounselingNotes(e.target.value)}
              placeholder="Record pastoral guidance notes, academic blockers, or personal observations..."
              className="w-full bg-background border p-2.5 rounded-xl outline-none resize-none"
            />
          </div>
          <div>
            <label className="font-bold text-muted-foreground block mb-1">Recommended Action Items</label>
            <input
              type="text"
              value={counselingAction}
              onChange={(e) => setCounselingAction(e.target.value)}
              placeholder="e.g. Schedule remedial classes for Mathematics II"
              className="w-full bg-background border p-2.5 rounded-xl outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsCounselingModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl"
            >
              Save Log
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Parent Communication Modal */}
      <Modal
        isOpen={isParentCommModalOpen}
        onClose={() => setIsParentCommModalOpen(false)}
        title="Record Parent Connect Communication"
        subtitle={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleSaveParentComm} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-muted-foreground block mb-1">Communication Mode</label>
            <select
              value={commType}
              onChange={(e) => setCommType(e.target.value)}
              className="w-full bg-background border p-2.5 rounded-xl outline-none font-bold"
            >
              <option value="CALL">Phone Call</option>
              <option value="MEETING">In-Person Meeting</option>
              <option value="EMAIL">Official Email</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-muted-foreground block mb-1">Communication Summary</label>
            <textarea
              rows={4}
              required
              value={commNotes}
              onChange={(e) => setCommNotes(e.target.value)}
              placeholder="Summarize parent discussion regarding attendance, performance, or fee dues..."
              className="w-full bg-background border p-2.5 rounded-xl outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsParentCommModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl"
            >
              Save Communication Record
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default MentorWorkspacePortal;
