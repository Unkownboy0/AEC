import React, { useState, useEffect } from 'react';
import { ShieldCheck, RotateCcw, Info, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { usePrincipalAvailability } from '../hooks/usePrincipalAvailability';
import { PrincipalStatusBadge } from '../components/PrincipalStatusBadge';
import { AvailabilityModal } from '../components/AvailabilityModal';
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
    try {
      await availabilityApi.approveDelegatedRequest(id, remarks);
      await fetchQueue();
      await refreshAvailability();
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  };

  const handleRejectRequest = async (id: string, remarks?: string) => {
    try {
      await availabilityApi.rejectDelegatedRequest(id, remarks);
      await fetchQueue();
      await refreshAvailability();
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  const principalStatus = context?.principalStatus || 'AVAILABLE';
  const isAvailable = principalStatus === 'AVAILABLE';

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    // Filter by main tab
    let matchTab = true;
    if (activeTab === 'PENDING') matchTab = r.status === 'PENDING';
    else if (activeTab === 'PROCESSED') matchTab = r.status === 'APPROVED' || r.status === 'REJECTED';
    else if (activeTab === 'VP_HANDLED') matchTab = Boolean(r.actionAsRole === 'ACTING_PRINCIPAL');
    else if (activeTab === 'RETURNED') matchTab = r.assignmentType === 'RETURNED_TO_PRINCIPAL' || r.status === 'RETURNED';

    // Filter by category
    let matchCat = true;
    if (selectedCategory !== 'ALL') {
      matchCat = r.requestType === selectedCategory;
    }

    return matchTab && matchCat;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-black text-white">Approval Center</h1>
            <PrincipalStatusBadge status={principalStatus} size="md" />
          </div>

          <p className="text-xs text-slate-400">
            {isAvailable
              ? 'You are currently available and handling approvals.'
              : 'Vice Principal is currently handling delegated approvals.'}
          </p>

          {!isAvailable && context?.actingPrincipal && (
            <div className="mt-2 text-xs font-semibold text-amber-300 flex items-center gap-2">
              <span>Acting Authority: <strong className="text-white">{context.actingPrincipal.name}</strong></span>
              <span>•</span>
              <span>Until: <strong className="text-white">{context.delegation?.endsAt ? new Date(context.delegation.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '6:00 PM'}</strong></span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => {
              refreshAvailability();
              fetchQueue();
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isPrincipal && (
            !isAvailable ? (
              <button
                onClick={() => updateStatus({ status: 'AVAILABLE' })}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-md flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4 stroke-[3]" />
                <span>Return Available</span>
              </button>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all shadow-md flex items-center gap-2"
              >
                <span>Change Status</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Handover Summary Card if available */}
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
        <div className="p-12 text-center text-slate-400 text-xs font-semibold bg-slate-900/40 rounded-3xl border border-slate-800">
          Loading approval requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-2">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-extrabold text-white">No requests found</h3>
          <p className="text-xs text-slate-400">There are no approval items matching your current filters.</p>
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
        isActingMode={!isAvailable}
      />

      {/* Change Availability Modal */}
      {isModalOpen && (
        <AvailabilityModal
          currentStatus={principalStatus}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={async (dto) => {
            await updateStatus(dto);
            await fetchQueue();
          }}
        />
      )}
    </div>
  );
};
