import React, { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle, XCircle, Clock, Shield, AlertTriangle, ArrowRight, User } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';

export interface ApprovalRequest {
  id: string;
  requestType: string;
  studentName?: string;
  facultyName?: string;
  department?: string;
  reason: string;
  status: string;
  createdAt: string;
  currentApproverRole: string;
}

export const ApprovalCenter: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      // Mock/Real fetch from backend approval endpoints
      const res = await api.get('/enterprise/executive/inbox?category=Pending Approvals');
      if (res.data?.status === 'success') {
        const mapped = res.data.data.map((item: any) => ({
          id: item.sourceId || item.id,
          requestType: item.title,
          studentName: item.subtitle,
          reason: item.subtitle,
          status: item.status,
          createdAt: item.date,
          currentApproverRole: 'Executive Approval'
        }));
        setRequests(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id: string, action: 'APPROVE_WORKFLOW' | 'REJECT_WORKFLOW') => {
    try {
      await api.post('/enterprise/executive/command-action', {
        action,
        targetId: id,
        note: action === 'APPROVE_WORKFLOW' ? 'Approved in Executive Approval Center' : 'Rejected in Executive Approval Center'
      });
      toast.success(`Request ${action === 'APPROVE_WORKFLOW' ? 'Approved' : 'Rejected'} successfully.`);
      fetchApprovals();
    } catch (err) {
      console.error(err);
      toast.error('Action failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            Executive Approval Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-based decision gate for Leave, OD, Budget, & Governance requests
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'LEAVE', 'OD', 'FACULTY', 'DEAN'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === type ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Approval Items Table / Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading pending approval queue...</div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
          No pending approvals requiring your decision.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200">{req.requestType}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  {req.status}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <p><strong>Applicant:</strong> {req.studentName}</p>
                <p><strong>Reason:</strong> {req.reason}</p>
                <p className="text-[11px] text-slate-400"><strong>Submitted:</strong> {new Date(req.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleAction(req.id, 'REJECT_WORKFLOW')}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
                <button
                  onClick={() => handleAction(req.id, 'APPROVE_WORKFLOW')}
                  className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
