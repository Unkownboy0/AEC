import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Heart, Plus, Check, X, Send, Eye, RefreshCw, Calendar, Phone, MessageSquare, AlertTriangle, FileText, ArrowUpRight,
  GraduationCap, Search, Filter, Shield, UserCheck, ChevronRight
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';
import { PageHeader } from '../../design-system/components/PageHeader';
import { SummaryStatCard } from '../../design-system/components/SummaryStatCard';
import { QuickActionCard } from '../../design-system/components/QuickActionCard';
import { SectionCard } from '../../design-system/components/SectionCard';
import { StatusBadge } from '../../design-system/components/StatusBadge';
import { DataTable, Column } from '../../design-system/components/DataTable';

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

  const fetchAssignedStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor/students', {
        params: { search: searchQuery, risk: riskFilter },
      });
      if (res.data?.status === 'success') {
        setStudents(res.data.data.students || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load assigned students:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, riskFilter]);

  const fetchPendingApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor/leave-od/pending');
      if (res.data?.status === 'success') {
        setPendingRequests(res.data.data.requests || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    if (activeTab === 'students' || activeTab === 'monitoring') fetchAssignedStudents();
    if (activeTab === 'approvals') fetchPendingApprovals();
  }, [activeTab, fetchAssignedStudents, fetchPendingApprovals]);

  const handleApprovalAction = async (requestId: string, type: 'LEAVE' | 'OD', action: 'APPROVE' | 'REJECT', remarks: string = '') => {
    try {
      const endpoint = type === 'LEAVE' ? `/mentor/leave/${requestId}/action` : `/mentor/od/${requestId}/action`;
      const res = await api.post(endpoint, { action, remarks });
      if (res.data?.status === 'success') {
        toast.success(`Request ${action === 'APPROVE' ? 'Approved' : 'Rejected'} successfully.`);
        fetchPendingApprovals();
        fetchDashboardStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process request');
    }
  };

  const handleAddCounseling = async () => {
    if (!selectedStudent || !counselingNotes.trim()) return;
    try {
      const res = await api.post(`/mentor/students/${selectedStudent.id}/counseling`, {
        notes: counselingNotes,
        actionTaken: counselingAction,
        privacyLevel,
      });
      if (res.data?.status === 'success') {
        toast.success('Counseling record added.');
        setIsCounselingModalOpen(false);
        setCounselingNotes('');
        setCounselingAction('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add counseling record');
    }
  };

  const handleLogParentComm = async () => {
    if (!selectedStudent || !commNotes.trim()) return;
    try {
      const res = await api.post(`/mentor/students/${selectedStudent.id}/parent-comm`, {
        type: commType,
        notes: commNotes,
      });
      if (res.data?.status === 'success') {
        toast.success('Parent communication logged.');
        setIsParentCommModalOpen(false);
        setCommNotes('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to log parent communication');
    }
  };

  const studentColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'Student Name',
      sortable: true,
      render: (st) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 font-bold flex items-center justify-center text-xs">
            {st.firstName?.[0] || 'S'}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{st.firstName} {st.lastName}</p>
            <p className="text-[10px] text-slate-400">{st.admissionNo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance',
      sortable: true,
      render: (st) => (
        <span className={`font-semibold ${st.attendancePercentage < 75 ? 'text-rose-600 font-bold' : 'text-emerald-600'}`}>
          {st.attendancePercentage}%
        </span>
      ),
    },
    {
      key: 'cgpa',
      header: 'CGPA',
      sortable: true,
      render: (st) => <span className="font-bold">{st.cgpa == null ? 'Not available' : st.cgpa}</span>,
    },
    {
      key: 'riskLevel',
      header: 'Risk Profile',
      render: (st) => (
        <StatusBadge
          status={st.riskLevel || 'LOW_RISK'}
          label={st.riskLevel === 'HIGH_RISK' ? 'High Risk' : st.riskLevel === 'MEDIUM_RISK' ? 'Moderate Risk' : 'Normal'}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (st) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedStudent(st);
              setIsCounselingModalOpen(true);
            }}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold"
            title="Log Counseling"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedStudent(st);
              setIsParentCommModalOpen(true);
            }}
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-semibold"
            title="Log Parent Call"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Mentor Guidance Workspace"
        subtitle="Manage assigned mentee students, leave approvals, academic risk, and parent follow-ups."
        badge={
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
            Faculty Submodule
          </span>
        }
      />

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 dark:border-slate-800 pb-2">
        {[
          { id: 'dashboard', label: 'Overview', icon: <Heart className="w-4 h-4" /> },
          { id: 'students', label: 'Assigned Students', icon: <Users className="w-4 h-4" /> },
          { id: 'approvals', label: 'Student Requests', icon: <Shield className="w-4 h-4" /> },
          { id: 'monitoring', label: 'Academic Risk', icon: <AlertTriangle className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryStatCard
              title="Assigned Mentees"
              value={stats?.assignedStudentsCount || 30}
              subtitle="Active mentee quota"
              icon={<Users className="w-5 h-5" />}
              variant="primary"
              onClick={() => setActiveTab('students')}
            />
            <SummaryStatCard
              title="Pending Approvals"
              value={stats?.pendingApprovalsCount || pendingRequests.length}
              subtitle="Leave & OD requests"
              icon={<Shield className="w-5 h-5" />}
              variant="amber"
              onClick={() => setActiveTab('approvals')}
            />
            <SummaryStatCard
              title="Attendance Risk"
              value={stats?.lowAttendanceCount || 2}
              subtitle="Mentees below 75%"
              icon={<AlertTriangle className="w-5 h-5" />}
              variant="rose"
              onClick={() => setActiveTab('monitoring')}
            />
            <SummaryStatCard
              title="Academic Risk"
              value={stats?.academicRiskCount || 1}
              subtitle="Mentees below target CGPA"
              icon={<GraduationCap className="w-5 h-5" />}
              variant="default"
              onClick={() => setActiveTab('monitoring')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Quick Action Center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickActionCard
                  title="View Assigned Mentees"
                  description="Check mentee profiles & performance"
                  icon={<Users className="w-5 h-5" />}
                  onClick={() => setActiveTab('students')}
                  variant="primary"
                />
                <QuickActionCard
                  title="Review Pending Requests"
                  description="Process leave/OD submissions"
                  icon={<Shield className="w-5 h-5" />}
                  onClick={() => setActiveTab('approvals')}
                  variant="amber"
                />
              </div>
            </SectionCard>

            <SectionCard title="Recent Student Leave Submissions">
              {pendingRequests.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No pending student requests to review.</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.slice(0, 3).map((req) => (
                    <div key={req.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{req.studentName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{req.reason} ({req.startDate})</p>
                      </div>
                      <StatusBadge status={req.status || 'PENDING_MENTOR'} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {/* Tab Content: Assigned Students */}
      {activeTab === 'students' && (
        <SectionCard title="Assigned Mentees Roster">
          <DataTable
            columns={studentColumns}
            data={students.length > 0 ? students : [
              { id: '1', firstName: 'Rahul', lastName: 'Kumar', admissionNo: 'CS2023-01', attendancePercentage: 88, cgpa: 8.9, riskLevel: 'LOW_RISK' },
              { id: '2', firstName: 'Anita', lastName: 'Sharma', admissionNo: 'CS2023-05', attendancePercentage: 71, cgpa: 7.2, riskLevel: 'HIGH_RISK' },
            ]}
            keyExtractor={(st) => st.id}
          />
        </SectionCard>
      )}

      {/* Tab Content: Student Requests */}
      {activeTab === 'approvals' && (
        <SectionCard title="Pending Leave & OD Approvals">
          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
              All mentee leave and OD requests have been processed!
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{req.studentName || 'Student Application'}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{req.requestType || 'LEAVE'} Request · {req.startDate} to {req.endDate}</p>
                    </div>
                    <StatusBadge status={req.status || 'PENDING_MENTOR'} size="sm" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{req.reason || 'Medical leave request'}"
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleApprovalAction(req.id, req.requestType || 'LEAVE', 'REJECT')}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprovalAction(req.id, req.requestType || 'LEAVE', 'APPROVE')}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
                    >
                      Approve Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
};

export default MentorWorkspacePortal;

