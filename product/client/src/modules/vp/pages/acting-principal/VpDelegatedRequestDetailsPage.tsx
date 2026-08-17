import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { useDelegatedApprovalActions } from '../../hooks/useDelegatedApprovalActions';
import { toast } from '../../../../components/ui/Toast';
import {
  ApprovalDetailLayout,
  adaptDelegatedApprovalItem,
  ApprovalActionDef,
} from '../../../../components/approval';

export const VpDelegatedRequestDetailsPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { approveRequest, rejectRequest, returnRequest, requestInfo, submitting } =
    useDelegatedApprovalActions(() => {
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

  const handleAction = async (actionDef: ApprovalActionDef, remarks: string) => {
    if (!requestId) return;
    try {
      if (actionDef.action === 'APPROVE') {
        await approveRequest(requestId, remarks || 'Approved by Vice Principal (Acting Principal)');
        toast.success('Request approved successfully');
      } else if (actionDef.action === 'REJECT') {
        await rejectRequest(requestId, remarks || 'Rejected by Vice Principal (Acting Principal)');
        toast.success('Request rejected');
      } else if (actionDef.action === 'RETURN') {
        await returnRequest(requestId, remarks || 'Returned for revisions');
        toast.success('Request returned');
      } else if (actionDef.action === 'REQUEST_INFO') {
        await requestInfo(requestId, remarks || 'Additional information requested');
        toast.info('Information requested');
      }
      navigate('/vp/acting-principal/approvals');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process request');
    }
  };

  const viewModel = item ? adaptDelegatedApprovalItem(item) : null;

  return (
    <ApprovalDetailLayout
      request={viewModel}
      loading={loading}
      error={error}
      onBack={() => navigate('/vp/acting-principal/approvals')}
      backLabel="Back to Delegated Approvals"
      onAction={handleAction}
      isSubmittingAction={submitting}
    />
  );
};

export default VpDelegatedRequestDetailsPage;
