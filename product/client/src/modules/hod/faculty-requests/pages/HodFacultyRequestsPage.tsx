import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock, ChevronRight, User, Calendar, Shield, Search, Filter } from 'lucide-react';
import { fetchHodDashboard, hodRecommendRequest, hodRejectRequest, hodReturnRequest } from '../../../faculty/leave-od/api/facultyLeaveApi';
import { FacultyLeaveOdRequest, HodSummaryCards } from '../../../faculty/leave-od/types/facultyLeave.types';

export const HodFacultyRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<HodSummaryCards | null>(null);
  const [queue, setQueue] = useState<FacultyLeaveOdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('PENDING');

  // Action Modals State
  const [selectedRequest, setSelectedRequest] = useState<FacultyLeaveOdRequest | null>(null);
  const [actionType, setActionType] = useState<'RECOMMEND' | 'REJECT' | 'RETURN' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHodDashboard(activeTab);
      setSummary(data.summary);
      setQueue(data.queue);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load HOD requests dashboard');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;
    setSubmittingAction(true);
    try {
      if (actionType === 'RECOMMEND') {
        await hodRecommendRequest(selectedRequest.id, { remarks });
      } else if (actionType === 'REJECT') {
        await hodRejectRequest(selectedRequest.id, remarks);
      } else if (actionType === 'RETURN') {
        await hodReturnRequest(selectedRequest.id, remarks);
      }
      setSelectedRequest(null);
      setActionType(null);
      setRemarks('');
      loadDashboard();
    } catch (err: any) {
      alert(err?.message ?? 'Action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Faculty Leave & OD Review Desk</h1>
          <p className="text-xs text-gray-500 mt-1">Review faculty applications and recommend to Principal / Acting Vice Principal</p>
        </div>
        <button onClick={loadDashboard} className="p-2.5 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Summary Cards Grid */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div onClick={() => setActiveTab('PENDING')} className={`p-4 rounded-2xl border cursor-pointer transition-all ${activeTab === 'PENDING' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-800 border-gray-100'}`}>
            <p className="text-[10px] font-bold uppercase opacity-80">Pending Review</p>
            <p className="text-2xl font-black mt-1">{summary.pendingFacultyLeave + summary.pendingFacultyOd}</p>
          </div>
          <div onClick={() => setActiveTab('EMERGENCY')} className={`p-4 rounded-2xl border cursor-pointer transition-all ${activeTab === 'EMERGENCY' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-800 border-gray-100'}`}>
            <p className="text-[10px] font-bold uppercase opacity-80">Emergency</p>
            <p className="text-2xl font-black mt-1">{summary.emergencyRequests}</p>
          </div>
          <div onClick={() => setActiveTab('RECOMMENDED')} className="p-4 rounded-2xl border bg-white border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Recommended</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{summary.recommendedToday}</p>
          </div>
          <div onClick={() => setActiveTab('FORWARDED')} className="p-4 rounded-2xl border bg-white border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Forwarded to Principal</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{summary.forwardedToPrincipal}</p>
          </div>
          <div className="p-4 rounded-2xl border bg-white border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Faculty On Leave</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{summary.facultyCurrentlyOnLeave}</p>
          </div>
          <div className="p-4 rounded-2xl border bg-white border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Faculty On OD</p>
            <p className="text-2xl font-black text-sky-600 mt-1">{summary.facultyCurrentlyOnOd}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-2">
        {['PENDING', 'RECOMMENDED', 'REJECTED', 'RETURNED', 'ALL'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Requests Queue */}
      <div className="space-y-3">
        {loading && <div className="p-8 text-center text-gray-400">Loading request queue...</div>}
        {!loading && queue.length === 0 && <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border">No requests found in this view</div>}
        {!loading && queue.map(req => (
          <div key={req.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-black ${req.type === 'LEAVE' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{req.type}</span>
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  {req.facultyRequester?.user ? `${req.facultyRequester.user.firstName} ${req.facultyRequester.user.lastName}` : 'Faculty Member'}
                </span>
                {req.isEmergency && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">EMERGENCY</span>}
              </div>
              <p className="text-xs text-gray-500">{req.title} • {req.reason}</p>
              <p className="text-xs text-gray-400">{new Date(req.startDate).toLocaleDateString('en-IN')} - {new Date(req.endDate).toLocaleDateString('en-IN')} ({req.totalDays} Days)</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {req.status === 'PENDING' || req.currentStep === 'HOD' ? (
                <>
                  <button
                    onClick={() => { setSelectedRequest(req); setActionType('RECOMMEND'); }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                  >
                    Recommend
                  </button>
                  <button
                    onClick={() => { setSelectedRequest(req); setActionType('RETURN'); }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600"
                  >
                    Return
                  </button>
                  <button
                    onClick={() => { setSelectedRequest(req); setActionType('REJECT'); }}
                    className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              ) : (
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">{req.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {actionType === 'RECOMMEND' && 'Recommend & Forward to Principal'}
              {actionType === 'REJECT' && 'Reject Faculty Request'}
              {actionType === 'RETURN' && 'Return to Faculty for Clarification'}
            </h3>
            <p className="text-xs text-gray-500">
              Request #{selectedRequest.requestNumber || selectedRequest.id.slice(0, 8)} by {selectedRequest.facultyRequester?.user?.firstName}
            </p>
            <textarea
              rows={3}
              className="w-full border rounded-xl p-3 text-xs resize-none"
              placeholder={actionType === 'RECOMMEND' ? 'Optional recommendation remarks...' : 'Mandatory reason...'}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 rounded-xl border text-xs font-bold">Cancel</button>
              <button
                onClick={handleAction}
                disabled={submittingAction || (actionType !== 'RECOMMEND' && !remarks.trim())}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingAction ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodFacultyRequestsPage;
