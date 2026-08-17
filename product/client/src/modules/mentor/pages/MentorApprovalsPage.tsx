import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/axios';
import { toast } from '../../../components/ui/Toast';
import {
  ApprovalInbox,
  ApprovalSummaryMetric,
  adaptStudentLeaveOdRequest,
  ApprovalActionDef,
  ApprovalViewModel,
} from '../../../components/approval';

export const MentorApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/mentor/leave-od');
      const list = res.data?.data || res.data || [];
      setRequests(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('[MentorApprovals] Failed to fetch:', err);
      toast.error(err?.response?.data?.message || 'Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (
    actionDef: ApprovalActionDef,
    request: ApprovalViewModel,
    remarks: string
  ) => {
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
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${actionDef.label.toLowerCase()}.`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const viewModels = requests.map((r) => {
    const raw = {
      ...r,
      student: r.student || {
        firstName: r.studentName?.split(' ')[0] || 'Student',
        lastName: r.studentName?.split(' ').slice(1).join(' ') || '',
        admissionNo: r.admissionNo,
        department: { name: r.departmentName },
        section: { name: r.sectionName },
      },
    };
    return adaptStudentLeaveOdRequest(raw, 'MENTOR');
  });

  const pendingCount = viewModels.filter((m) => m.status === 'PENDING_MENTOR' || m.status === 'PENDING').length;
  const leaveCount = viewModels.filter((m) => m.requestType === 'LEAVE').length;
  const odCount = viewModels.filter((m) => m.requestType === 'ON_DUTY').length;

  const metrics: ApprovalSummaryMetric[] = [
    {
      id: 'pending',
      label: 'Pending Review',
      count: pendingCount,
      variant: 'blue',
      tabTarget: 'PENDING',
    },
    {
      id: 'leave',
      label: 'Leave Requests',
      count: leaveCount,
      variant: 'purple',
    },
    {
      id: 'od',
      label: 'On-Duty Requests',
      count: odCount,
      variant: 'sky',
    },
    {
      id: 'total',
      label: 'Total Assigned',
      count: viewModels.length,
      variant: 'default',
      tabTarget: 'ALL',
    },
  ];

  return (
    <ApprovalInbox
      title="Student Leave & OD Approvals"
      description="Review and forward leave / on-duty applications submitted by your assigned mentees"
      metrics={metrics}
      requests={viewModels}
      loading={loading}
      onRefresh={fetchRequests}
      onRequestClick={(req) => navigate(`/faculty/mentor/leave-od/${req.id}`)}
      onQuickAction={handleAction}
      isSubmittingAction={submittingAction}
      requestTypeOptions={[
        { value: 'LEAVE', label: 'Leave Only' },
        { value: 'ON_DUTY', label: 'On-Duty Only' },
      ]}
    />
  );
};

export default MentorApprovalsPage;
