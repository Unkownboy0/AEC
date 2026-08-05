import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Check, X, Eye } from 'lucide-react';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { Drawer } from '../../../design-system/components/Modal';
import { WorkflowTimeline } from '../../../shared/components/WorkflowTimeline';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { toast } from '../../../components/ui/Toast';

export const HodApprovalsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/workflows/requests');
      if (res.data?.status === 'success') {
        setRequests(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflow requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT', comment = 'Reviewed by HOD') => {
    try {
      const res = await api.post(`/workflows/requests/${id}/action`, { action, comment });
      if (res.data?.status === 'success') {
        toast.success(`Request ${action === 'APPROVE' ? 'Approved' : 'Rejected'} successfully`);
        setSelectedReq(null);
        fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Workflow action failed');
    }
  };

  const columns: Column<any>[] = [
    { key: 'applicantName', header: 'Applicant', render: (item) => item.applicantName || item.user?.firstName || 'Student/Faculty' },
    { key: 'type', header: 'Type', render: (item) => <span className="font-bold uppercase text-[10px]">{item.type}</span> },
    { key: 'title', header: 'Reason', render: (item) => item.title || item.reason || 'Leave/OD Application' },
    { key: 'startDate', header: 'Start Date', render: (item) => item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A' },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedReq(item)}
            className="p-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors text-xs font-semibold flex items-center gap-1"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </button>
          {item.status.includes('PENDING') && (
            <>
              <button
                onClick={() => handleAction(item.id, 'APPROVE')}
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                title="Approve"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleAction(item.id, 'REJECT')}
                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                title="Reject"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            HOD Approval Desk
          </h1>
          <p className="text-xs text-muted-foreground">Review and endorse student & faculty leave, OD, and academic requests.</p>
        </div>
      </div>

      {error ? (
        <ErrorState title="Unable to load requests" message={error} onRetry={fetchRequests} />
      ) : (
        <DataTable
          columns={columns}
          data={requests}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => setSelectedReq(item)}
          emptyTitle="No pending approvals"
          emptyDescription="All department requests have been processed."
        />
      )}

      {/* Details Drawer */}
      <Drawer
        isOpen={!!selectedReq}
        onClose={() => setSelectedReq(null)}
        title="Application Details"
        subtitle={selectedReq?.title}
      >
        {selectedReq && (
          <div className="space-y-6 text-xs">
            <div className="space-y-2 bg-muted/30 p-3 rounded-xl border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Applicant:</span>
                <span className="font-bold text-foreground">{selectedReq.applicantName || 'Applicant'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Type:</span>
                <span className="font-bold uppercase text-primary">{selectedReq.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Status:</span>
                <StatusBadge status={selectedReq.status} />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-1">Reason / Description</h4>
              <p className="text-muted-foreground bg-card p-3 rounded-xl border border-border">{selectedReq.reason || 'No description provided.'}</p>
            </div>

            <WorkflowTimeline
              steps={[
                { id: '1', stepName: 'Mentor Endorsement', actorRole: 'Mentor', status: selectedReq.status.includes('PENDING_MENTOR') ? 'PENDING' : 'APPROVED' },
                { id: '2', stepName: 'HOD Approval', actorRole: 'HOD', status: selectedReq.status === 'APPROVED' ? 'APPROVED' : selectedReq.status === 'REJECTED' ? 'REJECTED' : 'PENDING' },
              ]}
              currentStep={selectedReq.currentStep || 'HOD'}
            />

            {selectedReq.status.includes('PENDING') && (
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => handleAction(selectedReq.id, 'REJECT')}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(selectedReq.id, 'APPROVE')}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Approve Application
                </button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </motion.div>
  );
};
