import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { Clock, CheckCircle2, XCircle, AlertCircle, FileText, User, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const WorkflowApprovalCenter: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [comment, setComment] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workflows/my-requests');
      if (res.data?.status === 'success') {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch workflow requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT' | 'CLARIFICATION') => {
    try {
      await api.post(`/workflows/${requestId}/action`, {
        action,
        comment,
      });
      setComment('');
      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      console.error('Workflow action failed:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="w-7 h-7 text-indigo-400" /> Multi-Tier Leave & OD Approval Center
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Automated stage transitions, audit timestamps, and acting delegation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Request List */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pending Requests ({requests.length})</h2>
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-800 text-slate-400">No active workflow requests</div>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedReq(r)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedReq?.id === r.id
                    ? 'bg-indigo-950/40 border-indigo-500/80'
                    : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-indigo-400">{r.type}</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full">{r.status}</span>
                </div>
                <h3 className="font-semibold text-slate-100 text-base">{r.title}</h3>
                <p className="text-slate-400 text-xs line-clamp-2 mt-1">{r.reason}</p>
                <div className="text-[10px] text-slate-500 border-t border-slate-700/40 mt-2 pt-1 flex justify-between">
                  <span>Current Step: {r.currentStep}</span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Request Detail & Timeline */}
        <div className="lg:col-span-7">
          {selectedReq ? (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/80 p-6 space-y-6">
              <div className="border-b border-slate-700 pb-4">
                <span className="text-xs font-bold text-indigo-400 uppercase">{selectedReq.type} Request</span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedReq.title}</h2>
                <p className="text-slate-300 text-sm mt-2">{selectedReq.reason}</p>
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/50 space-y-3">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Approval / Rejection remarks..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(selectedReq.id, 'APPROVE')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Forward
                  </button>
                  <button
                    onClick={() => handleAction(selectedReq.id, 'REJECT')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" /> Reject Request
                  </button>
                </div>
              </div>

              {/* Timeline History */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-semibold text-slate-300">Approval Stage Timeline</h3>
                <div className="space-y-2">
                  {selectedReq.history?.map((h: any) => (
                    <div key={h.id} className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/50 space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-200">
                        <span>{h.stage}: {h.action}</span>
                        <span className="text-slate-500">{new Date(h.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-400">By: {h.actionByName}</div>
                      {h.comment && <div className="text-slate-300 italic">"{h.comment}"</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-12 text-center text-slate-500">
              Select a workflow request to view stage timeline and take approval action.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
