import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import {
  ApprovalInbox,
  ApprovalSummaryMetric,
  ApprovalViewModel,
  ApprovalActionDef,
} from '../../components/approval';

export const ApprovalCenter: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('PENDING');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/enterprise/executive/inbox?category=Pending Approvals');
      if (res.data?.status === 'success') {
        const rawList = res.data.data || [];
        setRequests(Array.isArray(rawList) ? rawList : []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load executive approvals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleAction = async (
    actionDef: ApprovalActionDef,
    request: ApprovalViewModel,
    remarks: string
  ) => {
    setSubmittingAction(true);
    try {
      const isApprove = actionDef.action === 'APPROVE' || actionDef.action === 'RECOMMEND';
      await api.post('/enterprise/executive/command-action', {
        action: isApprove ? 'APPROVE_WORKFLOW' : 'REJECT_WORKFLOW',
        targetId: request.id,
        note: remarks.trim() || `${actionDef.label} in Executive Approval Center`,
      });
      toast.success(`Request ${isApprove ? 'Approved' : 'Rejected'} successfully.`);
      fetchApprovals();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Action failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const viewModels: ApprovalViewModel[] = requests.map((item: any) => {
    const isLeave = (item.title || '').toUpperCase().includes('LEAVE');
    const isOD = (item.title || '').toUpperCase().includes('OD') || (item.title || '').toUpperCase().includes('DUTY');
    const typeLabel = isLeave ? 'LEAVE' : isOD ? 'ON_DUTY' : 'GOVERNANCE';
    const typeVariant = isLeave ? 'purple' : isOD ? 'blue' : 'emerald';

    return {
      id: item.sourceId || item.id,
      requestNumber: item.id?.slice(0, 8),
      requestType: typeLabel,
      typeBadgeLabel: typeLabel,
      typeVariant,
      title: item.title || 'Executive Approval Request',
      reason: item.subtitle,
      status: item.status || 'PENDING',
      submittedAt: item.date || new Date().toISOString(),
      requester: {
        id: item.id,
        name: item.subtitle || 'Applicant',
        role: 'Faculty / Student',
        departmentName: 'Academic Department',
      },
      metadata: [
        { label: 'Category', value: item.title || 'General' },
        { label: 'Status', value: item.status || 'PENDING' },
        { label: 'Gate', value: 'Executive Approval' },
        { label: 'Date', value: new Date(item.date || Date.now()).toLocaleDateString('en-IN') },
      ],
      availableActions: [
        {
          action: 'APPROVE',
          label: 'Approve',
          variant: 'primary',
          confirmationTitle: 'Approve Request in Executive Center',
        },
        {
          action: 'REJECT',
          label: 'Reject',
          variant: 'danger',
          requiresRemarks: true,
          isDestructive: true,
          confirmationTitle: 'Reject Request in Executive Center',
        },
      ],
    };
  });

  const metrics: ApprovalSummaryMetric[] = [
    {
      id: 'pending',
      label: 'Pending Decisions',
      count: viewModels.length,
      variant: 'blue',
      tabTarget: 'PENDING',
    },
    {
      id: 'leave',
      label: 'Leave / OD',
      count: viewModels.filter((v) => v.requestType === 'LEAVE' || v.requestType === 'ON_DUTY').length,
      variant: 'purple',
    },
    {
      id: 'total',
      label: 'Total Queue',
      count: viewModels.length,
      variant: 'default',
      tabTarget: 'ALL',
    },
  ];

  return (
    <ApprovalInbox
      title="Executive Approval Center"
      description="Role-based decision gate for Leave, OD, Budget, Governance & Policy requests"
      metrics={metrics}
      requests={viewModels}
      loading={loading}
      onRefresh={fetchApprovals}
      onRequestClick={(req) => {}}
      onQuickAction={handleAction}
      isSubmittingAction={submittingAction}
      activeTab={activeTab}
      onTabChange={(t) => setActiveTab(t)}
      requestTypeOptions={[
        { value: 'LEAVE', label: 'Leave' },
        { value: 'ON_DUTY', label: 'On-Duty' },
        { value: 'GOVERNANCE', label: 'Governance' },
      ]}
      selectedType={selectedType}
      onTypeChange={(t) => setSelectedType(t)}
    />
  );
};

export default ApprovalCenter;
