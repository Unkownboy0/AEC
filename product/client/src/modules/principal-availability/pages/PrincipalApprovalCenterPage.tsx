import React, { useState, useEffect } from 'react';
import { ShieldCheck, RotateCcw, Info, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { usePrincipalAvailability } from '../hooks/usePrincipalAvailability';
import { PrincipalStatusBadge } from '../components/PrincipalStatusBadge';
import { PrincipalStatusModal } from '../components/PrincipalStatusModal';
import { HandoverSummaryCard } from '../components/HandoverSummaryCard';
import { ApprovalSummaryCards } from '../components/ApprovalSummaryCards';
import { ApprovalCategoryFilter } from '../components/ApprovalCategoryFilter';
import { ApprovalRequestCard } from '../components/ApprovalRequestCard';
import { ApprovalDetailsDrawer } from '../components/ApprovalDetailsDrawer';
import { useAuth } from '../../../context/AuthContext';
import { availabilityApi } from '../api/availability.api';
import { ApprovalRequestItem } from '../types/availability.types';

export const PrincipalApprovalCenterPage: React.FC = () => {
  const { user } = useAuth();
  const { context, loading: contextLoading, refreshAvailability, updateStatus } = usePrincipalAvailability();

  const rawRole = (typeof user?.role === 'object' ? (user?.role as any)?.name : String(user?.role || '')).toUpperCase();
  const isPrincipal = rawRole.includes('PRINCIPAL') && !rawRole.includes('VICE') && !rawRole.includes('VP');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [requests, setRequests] = useState<ApprovalRequestItem[]>([]);
  const [summaryCards, setSummaryCards] = useState({
    pendingCount: 0,
    approvedTodayCount: 0,
    rejectedTodayCount: 0,
    returnedCount: 0,
    urgentCount: 0,
  });
  const [loadingQueue, setLoadingQueue] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<string>('PENDING');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const fetchQueue = async () => {
    try {
      setLoadingQueue(true);
      const res = await availabilityApi.getPrincipalApprovalCenterQueue();
      setRequests(res.requests || []);
      setSummaryCards(res.summaryCards || {
        pendingCount: 0,
        approvedTodayCount: 0,
        rejectedTodayCount: 0,
        returnedCount: 0,
        urgentCount: 0,
      });
    } catch (err) {
      console.error('Failed to load Principal approval center queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    // 5-second interval polling for real-time synchronization
    const interval = setInterval(() => {
      fetchQueue();
    }, 5000);

    const handleStatusEvent = () => {
      fetchQueue();
      refreshAvailability();
    };

    window.addEventListener('principal_status_changed', handleStatusEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('principal_status_changed', handleStatusEvent);
    };
  }, []);

  const handleApproveRequest = async (id: string, remarks?: string) => {
    // Optimistic UI mutation: mark request as APPROVED
    setRequests((prev) =>
      prev.map((r) => (r.id === id || r.requestId === id ? { ...r, status: 'APPROVED' } : r))
    );
    setSummaryCards((prev) => ({
      ...prev,
      pendingCount: Math.max(0, prev.pendingCount - 1),
      approvedTodayCount: prev.approvedTodayCount + 1,
    }));

    try {
      await availabilityApi.approveRequest(id, remarks);
      await fetchQueue();
      await refreshAvailability();
    } catch (err) {
      console.error('Failed to approve request:', err);
      await fetchQueue();
      throw err;
    }
  };

  const handleRejectRequest = async (id: string, remarks?: string) => {
    // Optimistic UI mutation: mark request as REJECTED
    setRequests((prev) =>
      prev.map((r) => (r.id === id || r.requestId === id ? { ...r, status: 'REJECTED' } : r))
    );
    setSummaryCards((prev) => ({
      ...prev,
      pendingCount: Math.max(0, prev.pendingCount - 1),
      rejectedTodayCount: prev.rejectedTodayCount + 1,
    }));

    try {
      await availabilityApi.rejectRequest(id, remarks);
      await fetchQueue();
      await refreshAvailability();
    } catch (err) {
      console.error('Failed to reject request:', err);
      await fetchQueue();
      throw err;
    }
  };

  const handleReturnRequest = async (id: string, remarks: string) => {
    setRequests((prev) =>
      prev.map((request) => (request.id === id || request.requestId === id ? { ...request, status: 'RETURNED' } : request))
    );
    setSummaryCards((prev) => ({
      ...prev,
      pendingCount: Math.max(0, prev.pendingCount - 1),
      returnedCount: prev.returnedCount + 1,
    }));

    try {
      await availabilityApi.returnRequest(id, remarks);
      await fetchQueue();
      await refreshAvailability();
    } catch (err) {
      console.error('Failed to return request:', err);
      await fetchQueue();
      throw err;
    }
  };


  const principalStatus = context?.principalStatus || 'AVAILABLE';
  const isAvailable = (principalStatus as string) === 'AVAILABLE' || (principalStatus as string) === 'ONLINE';

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    let matchTab = true;
    const s = (r.status || '').toUpperCase();
    if (activeTab === 'PENDING') {
      matchTab = s === 'PENDING' || s === 'FORWARDED_TO_PRINCIPAL' || s === 'RECOMMENDED' || s === 'PENDING_PRINCIPAL' || s === 'SUBMITTED' || s === 'FORWARDED';
    } else if (activeTab === 'PROCESSED') {
      matchTab = s === 'APPROVED' || s === 'APPROVED_PRINCIPAL' || s === 'REJECTED' || s === 'REJECTED_PRINCIPAL';
    } else if (activeTab === 'VP_HANDLED') {
      matchTab = Boolean(r.actionAsRole === 'ACTING_PRINCIPAL' || r.assignedRole === 'ACTING_PRINCIPAL');
    } else if (activeTab === 'RETURNED') {
      matchTab = r.assignmentType === 'RETURNED_TO_PRINCIPAL' || s === 'RETURNED' || s === 'RETURNED_BY_PRINCIPAL';
    }

    let matchCat = true;
    if (selectedCategory !== 'ALL') {
      if (selectedCategory === 'FACULTY_LEAVE') {
        matchCat =
          r.requestType === 'FACULTY_LEAVE' ||
          r.requestType === 'FACULTY_OD' ||
          r.requestType === 'LEAVE' ||
          r.requestType === 'ON_DUTY' ||
          r.requestType === 'STUDENT_LEAVE' ||
          r.requestType === 'STUDENT_OD';
      } else {
        matchCat = r.requestType === selectedCategory;
      }
    }

    return matchTab && matchCat;
  });

  return (
    <div className="min-h-screen bg-app-bg text-text-primary p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-extrabold text-text-primary">
              {isAvailable ? 'Principal Approval Center' : 'Acting Principal Approval Center'}
            </h1>
            <PrincipalStatusBadge status={principalStatus} size="md" />
          </div>

          <p className="text-xs text-text-muted">
            {isAvailable
              ? 'You are currently available and handling approvals.'
              : 'Vice Principal is currently handling delegated approvals.'}
          </p>

          {!isAvailable && context?.actingPrincipal && (
            <div className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-300 flex items-center gap-2">
              <span>Acting Authority: <strong className="text-text-primary">{context.actingPrincipal.name}</strong></span>
              <span>•</span>
              <span>Until: <strong className="text-text-primary">{context.delegation?.endsAt ? new Date(context.delegation.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '6:00 PM'}</strong></span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            type="button"
            onClick={() => {
              refreshAvailability();
              fetchQueue();
            }}
            className="p-2.5 rounded-xl bg-surface-soft hover:bg-surface border border-border text-text-muted hover:text-text-primary transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isPrincipal && (
            !isAvailable ? (
              <button
                type="button"
                onClick={() => updateStatus({ status: 'AVAILABLE' })}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4 stroke-[3]" />
                <span>Return Available</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
              >
                <span>Change Status</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Handover Summary Card */}
      <HandoverSummaryCard
        onReviewReturned={() => {
          setActiveTab('RETURNED');
        }}
      />

      {/* Executive Summary Cards */}
      <ApprovalSummaryCards
        summary={summaryCards}
        activeFilter={activeTab}
        onSelectFilter={(tab) => setActiveTab(tab)}
      />

      {/* Category & Main Tab Filters */}
      <ApprovalCategoryFilter
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        selectedCategory={selectedCategory}
        onCategoryChange={(cat) => setSelectedCategory(cat)}
        counts={{
          pending: summaryCards.pendingCount,
          processed: summaryCards.approvedTodayCount + summaryCards.rejectedTodayCount,
          vpHandled: requests.filter((r) => r.actionAsRole === 'ACTING_PRINCIPAL').length,
          returned: summaryCards.returnedCount,
          all: requests.length,
        }}
      />

      {/* Request Items View */}
      {loadingQueue ? (
        <div className="p-12 text-center text-text-muted text-xs font-semibold bg-surface-soft rounded-3xl border border-border">
          Loading approval requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-3xl border border-border space-y-2">
          <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-text-primary">No requests found</h3>
          <p className="text-xs text-text-muted">There are no approval items matching your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => (
            <ApprovalRequestCard
              key={req.id}
              request={req}
              onViewDetails={(item) => {
                setSelectedRequest(item);
                setIsDrawerOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Details Drawer */}
      <ApprovalDetailsDrawer
        request={selectedRequest}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        onReturn={isPrincipal ? handleReturnRequest : undefined}
        isActingMode={!isAvailable}
      />

      {/* Change Availability Modal */}
      {isModalOpen && (
        <PrincipalStatusModal
          currentStatus={principalStatus}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStatusUpdated={async () => {
            await refreshAvailability();
            await fetchQueue();
          }}
        />
      )}
    </div>
  );
};
