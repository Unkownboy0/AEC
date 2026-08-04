import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, AlertCircle, FileText, User,
  Filter, Search, Download, Printer, Eye, CornerUpLeft, MessageSquare,
  Paperclip, Calendar, CheckSquare, Users, Building, ArrowRight, Upload,
  ChevronRight, Sparkles, Award
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import { PrincipalHeaderStatusControl } from '../../modules/delegation/PrincipalHeaderStatusControl';
import { PrincipalStatusBadge } from '../../modules/delegation/components/PrincipalStatusBadge';
import { HandoverSummaryCard } from '../../modules/delegation/components/HandoverSummaryCard';

export const PrincipalApprovalCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('PENDING');

  // Action Form State
  const [remarks, setRemarks] = useState('');
  const [actionFile, setActionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workflows/requests');
      if (res.data?.status === 'success') {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch approval requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const recordAuditLog = (action: string, reqId: string) => {
    const log = {
      id: Date.now().toString(),
      requestId: reqId,
      action,
      timestamp: new Date().toLocaleString(),
      userRole: 'Principal'
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleOpenDetail = (req: any) => {
    setSelectedReq(req);
    recordAuditLog('VIEWED', req.id);
  };

  const handlePrincipalAction = async (action: 'APPROVE' | 'REJECT' | 'RETURN' | 'CLARIFICATION') => {
    if (!selectedReq) return;
    try {
      setIsSubmitting(true);
      const res = await api.post(`/workflows/requests/${selectedReq.id}/action`, {
        action,
        comment: remarks || `Action ${action} taken by Principal`
      });

      if (res.data?.status === 'success') {
        toast.success(`Request ${action} completed successfully.`);
        recordAuditLog(action, selectedReq.id);
        setSelectedReq(null);
        setRemarks('');
        fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch workflow action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDocument = (docName: string) => {
    if (selectedReq) recordAuditLog('DOWNLOADED', selectedReq.id);
    toast.success(`Downloading ${docName}...`);
  };

  const handlePrintRequest = () => {
    if (selectedReq) recordAuditLog('PRINTED', selectedReq.id);
    window.print();
  };

  // Helper status checkers
  const isPendingStatus = (s: string) => !s || s === 'PENDING' || s.startsWith('PENDING');
  const isApprovedStatus = (s: string) => s === 'APPROVED' || s === 'APPROVED_PRINCIPAL';
  const isRejectedStatus = (s: string) => s === 'REJECTED' || s === 'REJECTED_PRINCIPAL';

  // Category filtering
  const filteredRequests = requests.filter((r) => {
    // Search matching
    const searchLower = searchQuery.toLowerCase();
    const firstName = r.requester?.firstName || r.faculty?.firstName || r.student?.firstName || '';
    const lastName = r.requester?.lastName || r.faculty?.lastName || r.student?.lastName || '';
    const nameMatch = `${firstName} ${lastName}`.toLowerCase().includes(searchLower);
    const titleMatch = (r.title || r.reason || '').toLowerCase().includes(searchLower);
    const idMatch = (r.id || r.requestNumber || '').toLowerCase().includes(searchLower);
    if (searchQuery && !nameMatch && !titleMatch && !idMatch) return false;

    // Sub-tab matching
    const rType = (r.requestType || r.type || '').toUpperCase();
    if (activeTab === 'STUDENT_LEAVE' && rType !== 'STUDENT_LEAVE' && rType !== 'LEAVE') return false;
    if (activeTab === 'STUDENT_OD' && rType !== 'STUDENT_OD' && rType !== 'ON_DUTY' && rType !== 'OD') return false;
    if (activeTab === 'FACULTY_LEAVE' && rType !== 'FACULTY_LEAVE' && !rType.includes('LEAVE')) return false;
    if (activeTab === 'FACULTY_OD' && rType !== 'FACULTY_OD' && !rType.includes('OD')) return false;
    if (activeTab === 'DEAN_LEAVE' && rType !== 'DEAN_LEAVE') return false;
    if (activeTab === 'VP_LEAVE' && rType !== 'VP_LEAVE') return false;

    // Status filter
    const statusVal = r.status || 'PENDING';
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'PENDING' && !isPendingStatus(statusVal)) return false;
      if (filterStatus === 'APPROVED' && !isApprovedStatus(statusVal)) return false;
      if (filterStatus === 'REJECTED' && !isRejectedStatus(statusVal)) return false;
    }

    // Role filter
    if (filterRole !== 'ALL') {
      const roleVal = (r.requesterRole || r.role || '').toLowerCase();
      if (!roleVal.includes(filterRole.toLowerCase())) return false;
    }

    // Department filter
    if (filterDept !== 'ALL') {
      const deptCode = (r.department?.code || r.department?.name || '').toUpperCase();
      if (!deptCode.includes(filterDept.toUpperCase())) return false;
    }

    return true;
  });

  // Dynamic KPI Calculations
  const pendingLeaveCount = requests.filter((r) => isPendingStatus(r.status) && ((r.requestType || r.type || '').toUpperCase().includes('LEAVE'))).length;
  const pendingOdCount = requests.filter((r) => isPendingStatus(r.status) && ((r.requestType || r.type || '').toUpperCase().includes('OD') || r.type === 'ON_DUTY')).length;
  const pendingCount = requests.filter((r) => isPendingStatus(r.status)).length;
  const approvedCount = requests.filter((r) => isApprovedStatus(r.status)).length;
  const rejectedCount = requests.filter((r) => isRejectedStatus(r.status)).length;

  if (loading) {
    return <Loading text="Loading Principal Approval Center..." />;
  }

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-violet-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Principal Governance Control
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Principal Executive Approval Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">Centralized authorization engine for Student, Faculty, Dean & Leadership Requests</p>
        </div>
        <div className="flex items-center gap-2">
          <PrincipalStatusBadge />
          <PrincipalHeaderStatusControl />
          <span className="px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> {pendingCount} Pending Authorization
          </span>
        </div>
      </div>

      {/* Handover Summary - shown when Principal returns to Online */}
      <HandoverSummaryCard />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-medium">
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
          <span className="text-slate-400">Pending Leave Requests</span>
          <h3 className="text-2xl font-bold text-amber-400">{pendingLeaveCount} Requests</h3>
        </div>
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
          <span className="text-slate-400">Pending OD Requests</span>
          <h3 className="text-2xl font-bold text-indigo-400">{pendingOdCount} Requests</h3>
        </div>
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
          <span className="text-slate-400">Approved Today</span>
          <h3 className="text-2xl font-bold text-emerald-400">{approvedCount} Requests</h3>
        </div>
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
          <span className="text-slate-400">Rejected Today</span>
          <h3 className="text-2xl font-bold text-rose-400">{rejectedCount} Requests</h3>
        </div>
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
          <span className="text-slate-400">Overdue SLA</span>
          <h3 className="text-2xl font-bold text-slate-400">0 Requests</h3>
        </div>
      </div>

      {/* Sidebar Categories Bar */}
      <div className="bg-slate-800/90 p-2 rounded-xl border border-slate-700/80 flex flex-wrap gap-1.5 overflow-x-auto text-xs font-bold text-slate-300">
        {[
          { id: 'ALL', label: 'All Requests' },
          { id: 'STUDENT_LEAVE', label: 'Student Leave' },
          { id: 'STUDENT_OD', label: 'Student OD' },
          { id: 'FACULTY_LEAVE', label: 'Faculty Leave' },
          { id: 'FACULTY_OD', label: 'Faculty OD' },
          { id: 'DEAN_LEAVE', label: 'Dean Leave' },
          { id: 'VP_LEAVE', label: 'Vice Principal Leave' },
          { id: 'CIRCULAR', label: 'Circular Approval' },
          { id: 'DOCUMENT', label: 'Document Approval' },
          { id: 'TASK', label: 'Task Approval' },
          { id: 'MEETING', label: 'Meeting Approval' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-md font-extrabold'
                : 'hover:bg-slate-700/70 hover:text-white text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 flex flex-wrap gap-3 text-xs">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Employee/Student Name, ID, Department, Roll No..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 font-semibold"
        >
          <option value="ALL">All Departments</option>
          <option value="CSE">Computer Science & Engineering</option>
          <option value="ECE">Electronics & Communication</option>
          <option value="MECH">Mechanical Engineering</option>
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 font-semibold"
        >
          <option value="ALL">All Applicant Roles</option>
          <option value="Student">Student</option>
          <option value="Faculty">Faculty</option>
          <option value="HOD">HOD</option>
          <option value="Dean">Dean</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 font-semibold"
        >
          <option value="PENDING">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ALL">All Statuses</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Authorization Queue ({filteredRequests.length})
        </h3>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Request ID</th>
                <th className="p-3">Applicant Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Department</th>
                <th className="p-3">Type</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRequests.map((r) => {
                const reqName = `${r.requester?.firstName || r.faculty?.firstName || r.student?.firstName || 'User'} ${r.requester?.lastName || r.faculty?.lastName || r.student?.lastName || ''}`.trim();
                const deptName = r.department?.name || r.department?.code || r.faculty?.department?.name || r.student?.department?.name || 'Academic Department';
                const dateStr = r.startDate && r.endDate 
                  ? `${new Date(r.startDate).toLocaleDateString()} - ${new Date(r.endDate).toLocaleDateString()}` 
                  : new Date(r.createdAt).toLocaleDateString();

                return (
                  <tr key={r.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="p-3 font-mono text-violet-400 font-bold">{r.requestNumber || r.id.substring(0, 8)}</td>
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-600/30 text-violet-300 flex items-center justify-center text-[10px] font-bold">
                        {reqName[0] || 'U'}
                      </div>
                      {reqName}
                    </td>
                    <td className="p-3 font-semibold text-slate-300">{r.requesterRole || 'Faculty'}</td>
                    <td className="p-3 font-semibold text-indigo-400">{deptName}</td>
                    <td className="p-3 font-bold text-amber-400">{(r.requestType || r.type || 'LEAVE').replace(/_/g, ' ')}</td>
                    <td className="p-3 truncate max-w-[180px] text-slate-400">{r.reason || r.title}</td>
                    <td className="p-3 text-slate-300 text-[11px] font-medium">{dateStr}</td>
                    <td className="p-3 font-mono text-[11px] text-emerald-400 font-bold">Principal Level</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === 'APPROVED' || r.status === 'APPROVED_PRINCIPAL' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        r.status === 'REJECTED' || r.status === 'REJECTED_PRINCIPAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenDetail(r)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-all"
                      >
                        View & Process
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No matching requests in Principal Approval queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL REQUEST DETAILS MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 text-xs text-slate-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-violet-400 font-mono font-bold text-xs">
                  Request ID: {selectedReq.id}
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  {selectedReq.title || `${selectedReq.requestType || selectedReq.type} Approval`}
                </h2>
                <p className="text-slate-400 text-[11px]">Applied Date: {new Date(selectedReq.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg"
              >
                Close
              </button>
            </div>

            {/* Applicant Profile & History */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Applicant Details</span>
                <h4 className="font-bold text-white text-sm">{selectedReq.requester?.firstName} {selectedReq.requester?.lastName}</h4>
                <p className="text-slate-400 text-[11px]">Role: <strong className="text-slate-200">{selectedReq.requesterRole || 'Faculty'}</strong></p>
                <p className="text-slate-400 text-[11px]">Department: <strong className="text-slate-200">CSE</strong></p>
              </div>
              <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-4 pt-2 md:pt-0">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Attendance & Leave Balance</span>
                <p className="text-emerald-400 font-bold text-sm">Attendance: 96.4%</p>
                <p className="text-slate-300 text-[11px]">Casual Leave Balance: <strong>8 Days Remaining</strong></p>
              </div>
              <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-4 pt-2 md:pt-0">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Previous History</span>
                <p className="text-slate-300 text-[11px]">Approved Requests: <strong className="text-emerald-400">4 Approved</strong></p>
                <p className="text-slate-300 text-[11px]">Rejected Requests: <strong className="text-slate-400">0 Rejected</strong></p>
              </div>
            </div>

            {/* Workflow Timeline */}
            <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              <h4 className="font-bold text-white text-xs uppercase flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" /> Multi-Tier Approval Workflow Timeline
              </h4>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-center text-[11px] pt-2">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700/60 w-full md:w-1/3">
                  <span className="text-slate-400 font-bold block">Stage 1: Faculty / Mentor</span>
                  <span className="text-emerald-400 font-bold block mt-1">✔ Submitted</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 hidden md:block" />
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700/60 w-full md:w-1/3">
                  <span className="text-slate-400 font-bold block">Stage 2: HOD Verification</span>
                  <span className="text-emerald-400 font-bold block mt-1">✔ HOD Approved</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 hidden md:block" />
                <div className="p-3 bg-violet-950/40 rounded-lg border border-violet-500/50 w-full md:w-1/3">
                  <span className="text-violet-300 font-bold block">Stage 3: Principal Approval</span>
                  <span className="text-amber-400 font-bold block mt-1">⏳ Pending Authorization</span>
                </div>
              </div>
            </div>

            {/* Supporting Attachments */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase">Supporting Documents & Medical Certificates</h4>
              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Medical_Certificate_Proof.pdf</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadDocument('Medical_Certificate_Proof.pdf')}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>

            {/* Principal Actions Form */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <h4 className="font-bold text-white text-xs uppercase">Principal Remarks & Authorization Decision</h4>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Write official Principal remarks or instructions for applicant..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
              />
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  disabled={isSubmitting}
                  onClick={() => handlePrincipalAction('RETURN')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <CornerUpLeft className="w-4 h-4" /> Return for Revision
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => handlePrincipalAction('REJECT')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject Request
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => handlePrincipalAction('APPROVE')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
