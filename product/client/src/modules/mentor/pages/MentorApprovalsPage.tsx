import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../../lib/axios';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { toast } from '../../../components/ui/Toast';

export const MentorApprovalsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/workflows/requests');
      if (res.data?.status === 'success' || res.data?.success) {
        const list = res.data.data || res.data || [];
        // Filter for requests requiring mentor action
        const mentorReqs = list.filter((r: any) =>
          r.currentStep === 'MENTOR' || r.status === 'PENDING_MENTOR' || r.status === 'PENDING'
        );
        setRequests(mentorReqs.length > 0 ? mentorReqs : list);
      }
    } catch (err: any) {
      console.error('Failed to fetch mentor leave approvals:', err);
      setError(err.response?.data?.message || 'Failed to load leave requests desk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT', remarks?: string) => {
    setProcessingId(requestId);
    try {
      const res = await api.post(`/workflows/requests/${requestId}/action`, {
        action,
        remarks: remarks || (action === 'APPROVE' ? 'Approved by Mentor' : 'Rejected by Mentor'),
      });

      if (res.data?.status === 'success' || res.status === 200) {
        toast.success(`Request ${action.toLowerCase()}d successfully.`);
        fetchLeaveRequests();
      }
    } catch (err: any) {
      console.error('Workflow action error:', err);
      toast.error(err.response?.data?.message || `Failed to ${action.toLowerCase()} request.`);
    } finally {
      setProcessingId(null);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'student',
      header: 'Student',
      sortable: true,
      render: (req) => (
        <div>
          <span className="font-bold text-xs text-foreground block">{req.studentName || req.user?.name || req.student?.name || 'Student'}</span>
          <span className="text-[10px] text-muted-foreground">{req.rollNo || req.student?.rollNo || 'Roll N/A'}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (req) => <StatusBadge status={req.type || req.category || 'LEAVE'} />,
    },
    {
      key: 'dates',
      header: 'Duration',
      render: (req) => (
        <div className="text-xs">
          <span className="font-semibold block">{req.startDate} to {req.endDate}</span>
          <span className="text-[10px] text-muted-foreground">{req.totalDays || 1} Day(s)</span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (req) => (
        <p className="text-xs text-foreground line-clamp-2 max-w-xs">{req.reason || 'Medical / Personal'}</p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (req) => <StatusBadge status={req.status || 'PENDING'} />,
    },
    {
      key: 'actions',
      header: 'Decision',
      render: (req) => (
        <div className="flex items-center gap-2">
          <button
            disabled={processingId === req.id}
            onClick={() => handleAction(req.id, 'APPROVE')}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1 disabled:opacity-50"
          >
            <CheckCircle2 className="w-3 h-3" /> Approve
          </button>
          <button
            disabled={processingId === req.id}
            onClick={() => handleAction(req.id, 'REJECT')}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1 disabled:opacity-50"
          >
            <XCircle className="w-3 h-3" /> Reject
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton variant="card" count={1} />
        <Skeleton variant="table" count={5} />
      </div>
    );
  }

  if (error && requests.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState title="Leave Approvals Error" description={error} onRetry={fetchLeaveRequests} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
            <FileCheck className="w-4 h-4" /> Mentor Workspace
          </div>
          <h1 className="text-xl font-extrabold text-foreground mt-0.5">Student Leave & OD Approvals</h1>
          <p className="text-xs text-muted-foreground">
            Review and forward leave/OD requests submitted by your assigned mentees.
          </p>
        </div>

        <button
          onClick={fetchLeaveRequests}
          className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Requests
        </button>
      </div>

      <DataTable
        columns={columns}
        data={requests}
        keyExtractor={(req) => String(req.id)}
        emptyTitle="No Pending Requests"
        emptyDescription="There are no student leave or OD requests waiting for your mentor review."
      />

    </div>
  );
};
