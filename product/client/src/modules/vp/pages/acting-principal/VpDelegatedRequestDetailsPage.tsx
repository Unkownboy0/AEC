import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  User,
  Building,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import api from '@/lib/axios';
import { useDelegatedApprovalActions } from '../../hooks/useDelegatedApprovalActions';
import { toast } from '../../../../components/ui/Toast';

export const VpDelegatedRequestDetailsPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<string>('');

  const { approveRequest, rejectRequest, returnRequest, requestInfo, submitting } = useDelegatedApprovalActions(() => {
    fetchDetails();
  });

  const fetchDetails = async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      const res = await api.get(`/vp/acting-principal/approvals/${requestId}`);
      if (res.data?.success && res.data?.data) {
        setItem(res.data.data);
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch request details:', err);
      setError(err?.response?.data?.error || err.message || 'Request not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [requestId]);

  const handleAction = async (type: 'APPROVE' | 'REJECT' | 'RETURN' | 'INFO') => {
    if (!requestId) return;
    try {
      if (type === 'APPROVE') {
        await approveRequest(requestId, remarks || 'Approved by Vice Principal (Acting Principal)');
        toast.success('Request approved successfully');
      } else if (type === 'REJECT') {
        await rejectRequest(requestId, remarks || 'Rejected by Vice Principal (Acting Principal)');
        toast.success('Request rejected');
      } else if (type === 'RETURN') {
        await returnRequest(requestId, remarks || 'Returned for revisions');
        toast.success('Request returned');
      } else if (type === 'INFO') {
        await requestInfo(requestId, remarks || 'Information requested');
        toast.info('Information requested');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Action failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-xs">Loading request details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-2xl">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Request Not Found</h2>
          <p className="text-xs text-slate-400">{error || 'The requested delegated item could not be loaded.'}</p>
          <button
            onClick={() => navigate('/vp/acting-principal/approvals')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
          >
            Back to Approvals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Back Navigation */}
      <button
        onClick={() => navigate('/vp/acting-principal/approvals')}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Delegated Approvals</span>
      </button>

      {/* Main Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                {item.requestType?.replace('_', ' ') || 'GENERAL'}
              </span>

              <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                item.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' :
                item.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                item.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300' :
                'bg-indigo-500/20 text-indigo-300'
              }`}>
                {item.status}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-white">{item.title}</h1>
            <p className="text-xs text-slate-400">Request ID: <strong className="text-slate-300">{item.requestId || item.id}</strong></p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-2xl text-xs font-bold text-amber-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Acting Principal Review</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Applicant Information</span>
            </div>
            <p className="text-slate-200 font-bold text-sm">{item.submittedBy || 'Faculty Member'}</p>
            <p className="text-slate-400">{item.department || 'Academic Department'}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Timeline & Metadata</span>
            </div>
            <p className="text-slate-300">Submitted: <strong className="text-white">{new Date(item.createdAt).toLocaleString()}</strong></p>
            {item.completedAt && (
              <p className="text-slate-300">Completed: <strong className="text-emerald-400">{new Date(item.completedAt).toLocaleString()}</strong></p>
            )}
          </div>
        </div>

        {/* Existing Remarks */}
        {item.actionRemarks && (
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1 text-xs">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Decision Remarks:</span>
            <p className="text-slate-200 italic">"{item.actionRemarks}"</p>
            {item.actionByRole && (
              <p className="text-[10px] text-amber-400 font-bold mt-1">
                Executed by: Vice Principal (Acting Principal)
              </p>
            )}
          </div>
        )}

        {/* Action Panel for Pending requests */}
        {item.status === 'PENDING' && (
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-white">Execute Acting Principal Decision</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Official Decision Remarks / Notes:</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter official remarks..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handleAction('APPROVE')}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-lg active:scale-95"
              >
                Approve Request
              </button>

              <button
                onClick={() => handleAction('REJECT')}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all shadow-lg active:scale-95"
              >
                Reject Request
              </button>

              <button
                onClick={() => handleAction('RETURN')}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
              >
                Return for Revision
              </button>

              <button
                onClick={() => handleAction('INFO')}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Request Info
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
