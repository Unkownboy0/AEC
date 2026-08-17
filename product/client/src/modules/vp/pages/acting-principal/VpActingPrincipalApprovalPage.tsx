import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDelegatedApprovals, DelegatedApprovalItem } from '../../hooks/useDelegatedApprovals';
import { useActingPrincipalContext } from '../../hooks/useActingPrincipalContext';
import { useDelegatedApprovalActions } from '../../hooks/useDelegatedApprovalActions';
import { toast } from '../../../../components/ui/Toast';
import {
  ApprovalInbox,
  ApprovalSummaryMetric,
  adaptDelegatedApprovalItem,
  ApprovalActionDef,
  ApprovalViewModel,
} from '../../../../components/approval';

export const VpActingPrincipalApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const { context, refreshContext } = useActingPrincipalContext();
  const { requests, counts, loading, error, refetch } = useDelegatedApprovals();
  const { approveRequest, rejectRequest, returnRequest, requestInfo, submitting } =
    useDelegatedApprovalActions(() => {
      refetch();
      refreshContext();
    });

  const [selectedTab, setSelectedTab] = useState<string>('PENDING');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const handleRefresh = () => {
    refetch();
    refreshContext();
    toast.success('Delegated queue refreshed');
  };

  const handleAction = async (
    actionDef: ApprovalActionDef,
    request: ApprovalViewModel,
    remarks: string
  ) => {
    try {
      if (actionDef.action === 'APPROVE') {
        await approveRequest(request.id, remarks || 'Approved by Vice Principal (Acting Principal)');
        toast.success(`Request approved successfully`);
      } else if (actionDef.action === 'REJECT') {
        await rejectRequest(request.id, remarks || 'Rejected by Vice Principal (Acting Principal)');
        toast.success(`Request rejected`);
      } else if (actionDef.action === 'RETURN') {
        await returnRequest(request.id, remarks || 'Returned for revisions');
        toast.success(`Request returned`);
      } else if (actionDef.action === 'REQUEST_INFO') {
        await requestInfo(request.id, remarks || 'Additional information requested');
        toast.info(`Information requested`);
      }
      refetch();
      refreshContext();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process request');
    }
  };

  const viewModels = requests.map((r) => adaptDelegatedApprovalItem(r));

  const metrics: ApprovalSummaryMetric[] = [
    {
      id: 'pending',
      label: 'Pending Decisions',
      count: counts.pending,
      variant: 'blue',
      tabTarget: 'PENDING',
    },
    {
      id: 'urgent',
      label: 'Urgent / Priority',
      count: counts.urgent,
      variant: 'red',
      tabTarget: 'EMERGENCY',
    },
    {
      id: 'approved',
      label: 'Approved Today',
      count: counts.approvedToday,
      variant: 'emerald',
      tabTarget: 'APPROVED',
    },
    {
      id: 'returned',
      label: 'Returned / Info',
      count: counts.returned,
      variant: 'amber',
      tabTarget: 'RETURNED',
    },
    {
      id: 'rejected',
      label: 'Rejected Today',
      count: counts.rejectedToday,
      variant: 'default',
      tabTarget: 'REJECTED',
    },
    {
      id: 'total',
      label: 'Total In Queue',
      count: requests.length,
      variant: 'purple',
      tabTarget: 'ALL',
    },
  ];

  return (
    <ApprovalInbox
      title="Delegated Approvals (Acting Principal)"
      description="You are temporarily handling Principal-level authorizations during active Principal delegation"
      metrics={metrics}
      requests={viewModels}
      loading={loading}
      onRefresh={handleRefresh}
      onRequestClick={(req) => navigate(`/vp/acting-principal/approvals/${req.id}`)}
      onQuickAction={handleAction}
      isSubmittingAction={submitting}
      activeTab={selectedTab}
      onTabChange={(tab) => setSelectedTab(tab)}
      tabs={[
        { key: 'PENDING', label: 'Pending Decisions' },
        { key: 'EMERGENCY', label: 'Urgent' },
        { key: 'APPROVED', label: 'Approved' },
        { key: 'RETURNED', label: 'Returned / Info' },
        { key: 'REJECTED', label: 'Rejected' },
        { key: 'ALL', label: 'All Delegated' },
      ]}
      requestTypeOptions={[
        { value: 'LEAVE', label: 'Faculty Leave' },
        { value: 'ON_DUTY', label: 'On-Duty' },
        { value: 'PURCHASE', label: 'Purchase Request' },
        { value: 'APPRAISAL', label: 'Appraisal' },
      ]}
      selectedType={selectedType}
      onTypeChange={(t) => setSelectedType(t)}
    />
  );
};

export default VpActingPrincipalApprovalPage;
