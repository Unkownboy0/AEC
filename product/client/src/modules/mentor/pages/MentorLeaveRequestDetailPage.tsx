import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../lib/axios';
import { toast } from '../../../components/ui/Toast';
import {
  ApprovalDetailLayout,
  adaptStudentLeaveOdRequest,
  ApprovalActionDef,
} from '../../../components/approval';

export const MentorLeaveRequestDetailPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/mentor/leave-od/${requestId}`);
      setRequest(res.data?.data || res.data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) setError('Leave/OD request not found.');
      else if (status === 403) setError('Access denied — this request is not assigned to you as a mentor.');
      else setError(err?.response?.data?.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAction = async (actionDef: ApprovalActionDef, remarks: string) => {
    if (!request) return;
    setSubmittingAction(true);
    try {
      await api.post(`/mentor/leave-od/${request.id}/review`, {
        action: actionDef.action,
        remarks: remarks.trim() || (actionDef.action === 'APPROVE' ? 'Approved by Mentor' : undefined),
      });

      toast.success(
        actionDef.action === 'APPROVE'
          ? 'Request approved and forwarded to HOD.'
          : actionDef.action === 'RETURN'
          ? 'Request returned to student.'
          : 'Request rejected.'
      );
      navigate('/faculty/mentor/leave-od');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${actionDef.label.toLowerCase()}.`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const viewModel = request ? adaptStudentLeaveOdRequest(request, 'MENTOR') : null;

  return (
    <ApprovalDetailLayout
      request={viewModel}
      loading={loading}
      error={error}
      onBack={() => navigate('/faculty/mentor/leave-od')}
      backLabel="Back to Mentor Desk"
      onAction={handleAction}
      isSubmittingAction={submittingAction}
    />
  );
};

export default MentorLeaveRequestDetailPage;
