import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchHodDashboard,
  hodRecommendRequest,
  hodRejectRequest,
  hodReturnRequest,
} from '../../../faculty/leave-od/api/facultyLeaveApi';
import { FacultyLeaveOdRequest, HodSummaryCards } from '../../../faculty/leave-od/types/facultyLeave.types';
import {
  ApprovalInbox,
  ApprovalSummaryMetric,
  adaptFacultyLeaveOdRequest,
  ApprovalActionDef,
  ApprovalViewModel,
} from '../../../../components/approval';
import { toast } from '../../../../components/ui/Toast';

export const HodFacultyRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<HodSummaryCards | null>(null);
  const [queue, setQueue] = useState<FacultyLeaveOdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('PENDING');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHodDashboard(activeTab);
      setSummary(data.summary);
      setQueue(data.queue || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to load HOD requests dashboard');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleAction = async (
    actionDef: ApprovalActionDef,
    request: ApprovalViewModel,
    remarks: string
  ) => {
    setSubmittingAction(true);
    try {
      if (actionDef.action === 'RECOMMEND') {
        await hodRecommendRequest(request.id, { remarks });
        toast.success(`Request recommended and forwarded to Principal.`);
      } else if (actionDef.action === 'REJECT') {
        await hodRejectRequest(request.id, remarks);
        toast.success(`Request rejected.`);
      } else if (actionDef.action === 'RETURN') {
        await hodReturnRequest(request.id, remarks);
        toast.success(`Request returned to faculty for clarification.`);
      }
      loadDashboard();
    } catch (err: any) {
      toast.error(err?.message || 'Action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Build summary metrics
  const metrics: ApprovalSummaryMetric[] = summary
    ? [
        {
          id: 'pending',
          label: 'Pending Review',
          count: summary.pendingFacultyLeave + summary.pendingFacultyOd,
          variant: 'blue',
          tabTarget: 'PENDING',
        },
        {
          id: 'emergency',
          label: 'Emergency',
          count: summary.emergencyRequests,
          variant: 'red',
          tabTarget: 'EMERGENCY',
        },
        {
          id: 'recommended',
          label: 'Recommended Today',
          count: summary.recommendedToday,
          variant: 'emerald',
          tabTarget: 'RECOMMENDED',
        },
        {
          id: 'forwarded',
          label: 'Forwarded to Principal',
          count: summary.forwardedToPrincipal,
          variant: 'purple',
          tabTarget: 'FORWARDED',
        },
        {
          id: 'on_leave',
          label: 'Faculty On Leave',
          count: summary.facultyCurrentlyOnLeave,
          variant: 'amber',
        },
        {
          id: 'on_od',
          label: 'Faculty On OD',
          count: summary.facultyCurrentlyOnOd,
          variant: 'sky',
        },
      ]
    : [];

  const viewModels = queue.map((req) => adaptFacultyLeaveOdRequest(req, 'HOD'));

  return (
    <ApprovalInbox
      title="Faculty Leave & OD Review Desk"
      description="Review faculty leave & on-duty applications and recommend to Principal / Acting Vice Principal"
      metrics={metrics}
      requests={viewModels}
      loading={loading}
      onRefresh={loadDashboard}
      onRequestClick={(req) => navigate(`/faculty/leave-od/${req.id}`)}
      onQuickAction={handleAction}
      isSubmittingAction={submittingAction}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab)}
      tabs={[
        { key: 'PENDING', label: 'Pending Review' },
        { key: 'EMERGENCY', label: 'Emergency' },
        { key: 'RECOMMENDED', label: 'Recommended' },
        { key: 'REJECTED', label: 'Rejected' },
        { key: 'RETURNED', label: 'Returned' },
        { key: 'ALL', label: 'All Requests' },
      ]}
    />
  );
};

export default HodFacultyRequestsPage;
