import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, FileText, Clock, AlertTriangle, CheckCircle2, ChevronRight, XCircle, FileCheck2, Calendar, Ban } from 'lucide-react';
import { fetchFacultyRequests } from '../api/facultyLeaveApi';
import { FacultyLeaveOdRequest } from '../types/facultyLeave.types';
import { ApplyLeaveOdModal } from './ApplyLeaveOdModal';
import api from '../../../../lib/axios';
import { toast } from '../../../../components/ui/Toast';

export const FacultyLeaveOdPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<FacultyLeaveOdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFacultyRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleCancelRequest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this application?')) return;
    try {
      const res = await api.post(`/workflows/requests/${id}/cancel`);
      if (res.data?.status === 'success' || res.data?.success) {
        toast.success('Request cancelled successfully');
        loadRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to cancel request');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
    if (status.includes('REJECTED')) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
    if (status.includes('CANCELLED')) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200"><Ban className="w-3.5 h-3.5" /> Cancelled</span>;
    if (status.includes('RETURNED') || status.includes('CLARIFICATION')) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><AlertTriangle className="w-3.5 h-3.5" /> Action Required</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Clock className="w-3.5 h-3.5" /> Pending Review</span>;
  };

  return (
    <div className="mx-auto min-h-full w-full max-w-[1440px] space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">My Leave & OD Requests</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Apply for leave/OD and track approval timeline (Faculty ➔ HOD ➔ Principal/Acting VP)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadRequests}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh requests"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Apply Leave / OD
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-muted/45 animate-pulse border border-border/60" />)}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12 bg-card rounded-2xl border border-danger/30 p-6">
            <p className="text-danger text-sm font-semibold mb-3">{error}</p>
            <button onClick={loadRequests} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl">Retry</button>
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-16 bg-card rounded-3xl border border-border/80 p-8 shadow-xs">
            <FileCheck2 className="w-12 h-12 text-primary/40 mx-auto mb-3" />
            <h3 className="font-extrabold text-foreground text-base">No Leave / OD Requests</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">You haven't submitted any leave or on-duty requests yet. Use the button above to create a new application.</p>
          </div>
        )}

        {!loading && requests.map(req => (
          <div
            key={req.id}
            onClick={() => navigate(`/faculty/leave-od/${req.id}`)}
            className="bg-card p-5 rounded-2xl border border-border shadow-xs hover:border-primary/50 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider ${req.type === 'LEAVE' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'}`}>
                  {req.type}
                </span>
                <span className="text-sm font-bold text-foreground">{req.title}</span>
                {req.isEmergency && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">🚨 EMERGENCY</span>}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{req.reason}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1 font-medium"><Calendar className="w-3.5 h-3.5 text-primary" /> {new Date(req.startDate).toLocaleDateString('en-IN')} - {new Date(req.endDate).toLocaleDateString('en-IN')}</span>
                <span className="font-semibold">• {req.totalDays} Day(s)</span>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
              {getStatusBadge(req.status)}
              {req.status.includes('PENDING') && (
                <button
                  onClick={(e) => handleCancelRequest(req.id, e)}
                  className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Cancel Request
                </button>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <ApplyLeaveOdModal
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => { setShowApplyModal(false); loadRequests(); }}
        />
      )}
    </div>
  );

};

export default FacultyLeaveOdPage;
