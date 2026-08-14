import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock, ChevronRight, User, Calendar, Shield, Search, Filter, Building2 } from 'lucide-react';
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
        {!loading && queue.length === 0 && <div className="p-12 text-center text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">No requests found in this view</div>}
        {!loading && queue.map(req => {
          let parsedSubs: any[] = [];
          try {
            if (req.substitutions) {
              parsedSubs = JSON.parse(req.substitutions);
            }
          } catch (e) {}

          return (
            <div key={req.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-black ${req.type === 'LEAVE' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>{req.type}</span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {req.facultyRequester?.user ? `${req.facultyRequester.user.firstName} ${req.facultyRequester.user.lastName}` : 'Faculty Member'}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">#{req.requestNumber || req.id.slice(0, 8)}</span>
                    {req.isEmergency && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">EMERGENCY</span>}
                  </div>
                  <p className="text-xs text-gray-500">{req.title} • {req.reason}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(req.startDate).toLocaleDateString('en-IN')} - {new Date(req.endDate).toLocaleDateString('en-IN')} ({req.totalDays} Days)
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {req.status === 'PENDING_HOD' || req.status === 'PENDING' || req.currentStep === 'HOD' ? (
                    <>
                      <button
                        onClick={() => { setSelectedRequest(req); setActionType('RECOMMEND'); }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
                      >
                        Review & Recommend
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
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">{req.status}</span>
                  )}
                </div>
              </div>

              {/* Display Affected Classes & Department-Wise Substitutes in Request Card */}
              {parsedSubs && parsedSubs.length > 0 && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] font-bold text-gray-500 mb-1.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    Affected Sessions ({parsedSubs.length}) & Proposed Substitutes:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {parsedSubs.map((sub: any, sIdx: number) => (
                      <div key={sub.sessionId || sIdx} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-xs border border-gray-200/70 dark:border-gray-700/60 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              {sub.periodDisplay || `P${sub.slotIndex}`}
                            </span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[140px]" title={sub.subjectName}>
                              {sub.subjectName}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">({sub.departmentCode || 'Dept'})</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{sub.sectionName || ''} • {sub.venue || 'Classroom'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 block truncate max-w-[120px]">
                            {sub.assignedSubstituteName || 'None'}
                          </span>
                          <span className="text-[9px] text-emerald-600">
                            {sub.assignedSubstituteDept ? `${sub.assignedSubstituteDept} Dept` : 'Available'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {actionType === 'RECOMMEND' && 'Recommend & Forward to Principal'}
              {actionType === 'REJECT' && 'Reject Faculty Request'}
              {actionType === 'RETURN' && 'Return to Faculty for Clarification'}
            </h3>
            <p className="text-xs text-gray-500">
              Request #{selectedRequest.requestNumber || selectedRequest.id.slice(0, 8)} by {selectedRequest.facultyRequester?.user?.firstName} {selectedRequest.facultyRequester?.user?.lastName}
            </p>

            {/* If recommending, show summary of confirmed substitutions */}
            {actionType === 'RECOMMEND' && (() => {
              let parsedSubs: any[] = [];
              try {
                if (selectedRequest.substitutions) {
                  parsedSubs = JSON.parse(selectedRequest.substitutions);
                }
              } catch (e) {}

              if (!parsedSubs || parsedSubs.length === 0) return null;

              return (
                <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50 space-y-2">
                  <p className="text-[11px] font-bold text-purple-900 dark:text-purple-300">
                    Confirmed Timetable Substitutions ({parsedSubs.length}):
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {parsedSubs.map((sub: any, idx: number) => (
                      <div key={sub.sessionId || idx} className="p-2 bg-white dark:bg-gray-850 rounded-lg border border-purple-200/60 dark:border-purple-800 text-[11px] flex items-center justify-between">
                        <div>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{sub.periodDisplay}: {sub.subjectName}</span>
                          <span className="text-[10px] text-gray-400 ml-1">({sub.departmentCode})</span>
                        </div>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          {sub.assignedSubstituteName || 'No Substitute'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <textarea
              rows={3}
              className="w-full border rounded-xl p-3 text-xs resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700"
              placeholder={actionType === 'RECOMMEND' ? 'Optional recommendation remarks to Principal...' : 'Mandatory reason...'}
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
