import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, FileText, User, Filter, Search } from 'lucide-react';
import { useDelegationContext } from '../context/DelegationContext';
import { ActorAttributionLabel } from '../../delegation/ActorAttributionLabel';
import { useAuth } from '../../../context/AuthContext';

export const ActingPrincipalApprovalCenter: React.FC = () => {
  const { user } = useAuth();
  const { principalStatus, delegationEndsAt } = useDelegationContext();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vp/acting-principal/approval-center', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setRequests(json.data.requests || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch delegated approval queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/vp/acting-principal/approvals/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ comment })
      });
      if (res.ok) {
        setComment('');
        setSelectedReq(null);
        fetchQueue();
      }
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/vp/acting-principal/approvals/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ comment })
      });
      if (res.ok) {
        setComment('');
        setSelectedReq(null);
        fetchQueue();
      }
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formattedEnd = delegationEndsAt
    ? new Date(delegationEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'End of Shift';

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-violet-950 p-6 rounded-2xl border border-amber-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Delegated Executive Approval Desk
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Vice Principal — Acting Principal Approval Center</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Principal Status: <strong className="text-amber-400 uppercase">{principalStatus}</strong> | Valid until {formattedEnd}
          </p>
        </div>

        <div className="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-extrabold flex items-center gap-2">
          <Clock className="w-4 h-4" /> {requests.length} Pending Delegated Authorizations
        </div>
      </div>

      {/* Attribution Requirement */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
        <ActorAttributionLabel
          actorName={(user as any)?.name || (user as any)?.username || 'Vice Principal'}
          actorRole="Vice Principal"
          performedAsRole="ACTING_PRINCIPAL"
          actionType="AUTHORIZATION"
        />
        <span className="text-xs text-slate-400 font-medium">All sign-offs strictly attributed to Vice Principal — Acting Principal</span>
      </div>

      {/* Request Queue */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold text-xs">Loading delegated approval requests...</div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-extrabold text-white">No Pending Delegated Approvals</h3>
          <p className="text-xs text-slate-400">All institutional authorization queues are currently up to date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-violet-500/50 rounded-2xl space-y-3 transition-all"
            >
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded text-[10px] font-black uppercase">
                  {req.requestType || req.type || 'WORKFLOW_REQUEST'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Submitted {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-white">{req.title || req.reason || 'Institutional Authorization Request'}</h4>
                <p className="text-xs text-slate-300 mt-1">{req.description || req.details || 'No detailed description provided.'}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <span className="flex items-center gap-1 font-semibold">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Requester: {req.requesterName || req.user?.name || 'Staff Member'}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={submitting}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-lg text-xs flex items-center gap-1 shadow"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>

                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={submitting}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs flex items-center gap-1 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
