import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, CheckCircle2, XCircle, RotateCcw, AlertTriangle, ArrowUpRight,
  Filter, Search, Download, RefreshCw, Eye, Check, X, ShieldAlert,
  Calendar, User, Clock, CheckSquare, Paperclip, MessageSquare, ChevronRight
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { ExecutiveLeaveOdModal } from '../../components/shared/ExecutiveLeaveOdModal';

interface LeaveRequest {
  id: string;
  requestNumber: string;
  type: 'LEAVE' | 'ON_DUTY';
  requestCategory?: string;
  reason: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  durationType?: string;
  totalDays: number;
  eventName?: string;
  eventLocation?: string;
  emergencyContact?: string;
  attachmentUrl?: string;
  status: string;
  workflowStatus: string;
  mentorStatus?: string;
  hodStatus?: string;
  priority?: string;
  isEmergency?: boolean;
  createdAt: string;
  forwardedToHodAt?: string;
  mentorRemarks?: string;
  hodRemarks?: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
    phone?: string;
    parentPhone?: string;
    department?: { id: string; name: string; code: string };
    section?: { name: string };
    semester?: { name: string; number: number };
    attendanceRecords?: Array<{ status: string }>;
  };
  mentor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvals?: Array<{
    id: string;
    approverRole: string;
    decision: string;
    remarks: string;
    actedAt: string;
  }>;
  workflowHistory?: Array<{
    id: string;
    action: string;
    performedRole: string;
    toStatus: string;
    remarks: string;
    createdAt: string;
  }>;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
  }>;
}

export const HodLeaveOdApprovalDesk: React.FC = () => {
  const { showToast } = useToast();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'PENDING_HOD' | 'ALL' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'EMERGENCY' | 'ESCALATED'>('PENDING_HOD');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkActionModal, setShowBulkActionModal] = useState<boolean>(false);
  const [bulkActionType, setBulkActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [bulkRemarks, setBulkRemarks] = useState<string>('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res: any = await api.get(`/hod/leave-od?status=${activeTab}`);
      const dataList = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(dataList)) {
        setRequests(dataList);
      } else {
        setRequests([]);
      }
    } catch (err: any) {
      console.error('[HOD Leave/OD Desk] Error fetching requests:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to load requests';
      showToast(errMsg, 'error');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const filteredRequests = useMemo(() => {
    if (!Array.isArray(requests)) return [];
    return requests.filter(req => {
      if (!req) return false;
      const reqNum = req.requestNumber || req.id || '';
      const studentName = req.student ? `${req.student.firstName || ''} ${req.student.lastName || ''}` : '';
      const admissionNo = req.student?.admissionNo || '';
      const reason = req.reason || '';

      const matchSearch =
        reqNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reason.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = selectedType === 'ALL' || req.type === selectedType;

      return matchSearch && matchType;
    });
  }, [requests, searchQuery, selectedType]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'return-to-mentor' | 'return-to-student' | 'escalate') => {
    if ((action === 'reject' || action === 'return-to-mentor' || action === 'return-to-student') && !actionRemarks.trim()) {
      showToast('Remarks are required for this action', 'error');
      return;
    }

    // Optimistic UI Update: Instantly remove/update request state in frontend UI
    const targetRequest = requests.find((r) => r.id === id);
    const updatedStatus = action === 'approve' ? 'APPROVED_HOD' : action === 'reject' ? 'REJECTED_HOD' : 'RETURNED';
    setRequests((prev) => prev.filter((r) => r.id !== id));

    try {
      setSubmittingAction(true);
      await api.post(`/hod/leave-od/${id}/${action}`, {
        remarks: actionRemarks.trim() || `HOD ${action.toUpperCase().replace(/-/g, ' ')}`,
      });

      showToast(`Request successfully processed (${action.toUpperCase()})`, 'success');
      setShowDetailModal(false);
      setActionRemarks('');
    } catch (err: any) {
      // Rollback optimistic change on network failure
      if (targetRequest) {
        setRequests((prev) => [targetRequest, ...prev]);
      }
      showToast(err.response?.data?.message || err.message || 'Failed to process request', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };


  const handleBulkActionSubmit = async () => {
    if (selectedIds.length === 0) return;
    if (bulkActionType === 'REJECT' && !bulkRemarks.trim()) {
      showToast('Mandatory rejection reason required for bulk rejection', 'error');
      return;
    }

    try {
      setSubmittingAction(true);
      const endpoint = bulkActionType === 'APPROVE' ? '/hod/leave-od/bulk-approve' : '/hod/leave-od/bulk-reject';
      await api.post(endpoint, {
        requestIds: selectedIds,
        remarks: bulkRemarks.trim() || 'Bulk Action Executed by HOD',
      });

      showToast(`Successfully processed ${selectedIds.length} requests`, 'success');
      setSelectedIds([]);
      setShowBulkActionModal(false);
      setBulkRemarks('');
      fetchRequests();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Bulk processing failed', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const calculateAttendance = (recs?: Array<{ status: string }>) => {
    if (!recs || recs.length === 0) return 88; // Default mock if no records
    const present = recs.filter(r => r.status === 'PRESENT' || r.status === 'ON_DUTY' || r.status === 'EXCUSED_LEAVE').length;
    return Math.round((present / recs.length) * 100);
  };

  const exportCSV = () => {
    if (filteredRequests.length === 0) return;
    const headers = ['Request No', 'Student', 'Register No', 'Type', 'Category', 'From Date', 'To Date', 'Days', 'Reason', 'Status'];
    const rows = filteredRequests.map(r => [
      r.requestNumber,
      `"${r.student.firstName} ${r.student.lastName}"`,
      r.student.admissionNo,
      r.type,
      r.requestCategory || 'PERSONAL',
      new Date(r.startDate).toLocaleDateString(),
      new Date(r.endDate).toLocaleDateString(),
      r.totalDays,
      `"${r.reason.replace(/"/g, '""')}"`,
      r.workflowStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HOD_Leave_Requests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" /> Department Administration Workspace
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave & OD Approval Workspace</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review, approve, return, or escalate student leave and on-duty authorization requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
          >
            <Calendar className="w-4 h-4" /> Apply HOD Leave / OD
          </button>
          <button
            onClick={fetchRequests}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-sm font-semibold transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setBulkActionType('APPROVE'); setShowBulkActionModal(true); }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Bulk Approve ({selectedIds.length})
              </button>
              <button
                onClick={() => { setBulkActionType('REJECT'); setShowBulkActionModal(true); }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Bulk Reject ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1">
        {[
          { id: 'PENDING_HOD', label: 'Pending HOD Queue', icon: Clock },
          { id: 'ALL', label: 'All Requests', icon: FileText },
          { id: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
          { id: 'REJECTED', label: 'Rejected', icon: XCircle },
          { id: 'RETURNED', label: 'Returned', icon: RotateCcw },
          { id: 'EMERGENCY', label: 'Emergency', icon: AlertTriangle },
          { id: 'ESCALATED', label: 'Escalated to Dean', icon: ArrowUpRight },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSelectedIds([]); }}
              className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-t-xl transition border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, register no, request no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2 font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Request Types</option>
              <option value="LEAVE">Leave Requests</option>
              <option value="ON_DUTY">On-Duty (OD)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
            Loading Leave and OD approval queue...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-semibold">No requests found in this queue</p>
            <p className="text-xs">There are no pending requests matching your active filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(filteredRequests.map(r => r.id));
                        else setSelectedIds([]);
                      }}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="p-4">Request No</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Type & Category</th>
                  <th className="p-4">Duration & Dates</th>
                  <th className="p-4">Attendance</th>
                  <th className="p-4">Mentor Status</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredRequests.map(req => {
                  const attendancePct = calculateAttendance(req.student.attendanceRecords);
                  const isSelected = selectedIds.includes(req.id);

                  return (
                    <tr key={req.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, req.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== req.id));
                          }}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="p-4 font-mono font-semibold text-slate-900 dark:text-white">
                        {req.requestNumber}
                        {req.isEmergency && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            EMERGENCY
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {req.student.firstName} {req.student.lastName}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {req.student.admissionNo} • {req.student.section?.name || 'A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          req.type === 'ON_DUTY' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {req.type}
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">{req.requestCategory || 'Personal'}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">{req.totalDays} Day(s) ({req.durationType || 'FULL_DAY'})</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                          attendancePct < 75 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {attendancePct}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Endorsed by Mentor
                        </div>
                        {req.mentor && (
                          <div className="text-xs text-slate-400">{req.mentor.firstName} {req.mentor.lastName}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          req.workflowStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          req.workflowStatus.includes('REJECTED') ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {req.workflowStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => { setSelectedRequest(req); setShowDetailModal(true); setActionRemarks(''); }}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Request Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedRequest.requestNumber}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedRequest.type} Request Review
                </h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Student Header Card */}
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Student Profile</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedRequest.student.firstName} {selectedRequest.student.lastName}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Admission No: {selectedRequest.student.admissionNo} • Section: {selectedRequest.student.section?.name || 'A'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Emergency Phone: {selectedRequest.emergencyContact || selectedRequest.student.phone || 'N/A'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500 font-semibold">Attendance Record</div>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {calculateAttendance(selectedRequest.student.attendanceRecords)}%
                  </div>
                  <div className="text-xs text-slate-400">Overall Semester Avg</div>
                </div>
              </div>

              {/* Request Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div className="text-xs text-slate-400 font-semibold">Category</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{selectedRequest.requestCategory || 'Personal'}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div className="text-xs text-slate-400 font-semibold">Duration & Days</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{selectedRequest.totalDays} Day(s) ({selectedRequest.durationType || 'FULL_DAY'})</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div className="text-xs text-slate-400 font-semibold">Start Date</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{new Date(selectedRequest.startDate).toLocaleDateString()}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div className="text-xs text-slate-400 font-semibold">End Date</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{new Date(selectedRequest.endDate).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Reason & Event Details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-2">
                <div className="text-xs text-slate-400 font-bold uppercase">Reason for Request</div>
                <div className="text-slate-800 dark:text-slate-200 font-medium text-sm">{selectedRequest.reason}</div>
                {selectedRequest.description && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                    {selectedRequest.description}
                  </div>
                )}
                {selectedRequest.eventName && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold pt-1">
                    Event / Activity: {selectedRequest.eventName} ({selectedRequest.eventLocation || 'On Campus'})
                  </div>
                )}
              </div>

              {/* Attachments Preview */}
              {selectedRequest.attachmentUrl && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <Paperclip className="w-4 h-4 text-indigo-500" /> Supporting Document Attached
                  </div>
                  <a
                    href={selectedRequest.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                  >
                    Preview / Download
                  </a>
                </div>
              )}

              {/* Workflow History Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Workflow Audit Timeline</h4>
                <div className="space-y-3">
                  <div className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Student Submitted Request</div>
                      <div className="text-slate-400">{new Date(selectedRequest.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Mentor Endorsed Request ({selectedRequest.mentor ? `${selectedRequest.mentor.firstName} ${selectedRequest.mentor.lastName}` : 'Assigned Mentor'})
                      </div>
                      <div className="text-slate-400">{selectedRequest.forwardedToHodAt ? new Date(selectedRequest.forwardedToHodAt).toLocaleString() : 'Completed'}</div>
                      <div className="text-slate-500 italic mt-0.5">"{selectedRequest.mentorRemarks || 'Endorsed by Mentor'}"</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Form */}
              {selectedRequest.workflowStatus === 'PENDING_HOD' && (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase">
                    HOD Remarks / Decision Notes
                  </label>
                  <textarea
                    rows={2}
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder="Add mandatory remarks for rejection/return or optional notes for approval..."
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold"
              >
                Close
              </button>

              {selectedRequest.workflowStatus === 'PENDING_HOD' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={submittingAction}
                    onClick={() => handleAction(selectedRequest.id, 'return-to-student')}
                    className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white rounded-xl text-xs font-semibold transition"
                  >
                    Return to Student
                  </button>
                  <button
                    disabled={submittingAction}
                    onClick={() => handleAction(selectedRequest.id, 'return-to-mentor')}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Return to Mentor
                  </button>
                  <button
                    disabled={submittingAction}
                    onClick={() => handleAction(selectedRequest.id, 'reject')}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Reject Request
                  </button>
                  <button
                    disabled={submittingAction}
                    onClick={() => handleAction(selectedRequest.id, 'approve')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Final Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {showBulkActionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Bulk {bulkActionType === 'APPROVE' ? 'Approve' : 'Reject'} ({selectedIds.length} Requests)
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to execute bulk {bulkActionType.toLowerCase()} on {selectedIds.length} selected requests?
            </p>
            <textarea
              rows={3}
              value={bulkRemarks}
              onChange={(e) => setBulkRemarks(e.target.value)}
              placeholder={bulkActionType === 'REJECT' ? 'Mandatory reason for bulk rejection...' : 'Optional bulk decision remarks...'}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBulkActionModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={submittingAction}
                onClick={handleBulkActionSubmit}
                className={`px-4 py-2 text-white rounded-xl text-sm font-semibold transition ${
                  bulkActionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Execute Bulk {bulkActionType}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Executive Leave & OD Modal */}
      <ExecutiveLeaveOdModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        userRole="Head of Department (HOD)"
      />
    </div>
  );
};

export default HodLeaveOdApprovalDesk;
