import React, { useState } from 'react';
import { ShieldAlert, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useActingPrincipalContext } from '../hooks/useActingPrincipalContext';
import { PrincipalStatusBadge } from '../components/PrincipalStatusBadge';
import { ApprovalRequestCard } from '../components/ApprovalRequestCard';
import { ApprovalDetailsDrawer } from '../components/ApprovalDetailsDrawer';
import { ApprovalRequestItem } from '../types/availability.types';

export const VpDelegatedApprovalPage: React.FC = () => {
  const {
    context,
    pendingRequests,
    processedRequests,
    loading,
    error,
    refreshQueue,
    approveRequest,
    rejectRequest,
  } = useActingPrincipalContext();

  const [selectedTab, setSelectedTab] = useState<'PENDING' | 'PROCESSED'>('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  if (error || (context && !context.canVpActAsPrincipal)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-white">Delegated Mode Inactive</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Principal is currently <strong>Available</strong>. Vice Principal Acting Principal Mode is inactive, and delegated approvals are disabled.
          </p>
        </div>
      </div>
    );
  }

  const activeList = selectedTab === 'PENDING' ? pendingRequests : processedRequests;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-black text-white">Delegated Approvals</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase">
              Acting Principal
            </span>
          </div>

          <p className="text-xs text-slate-400">
            You are temporarily handling selected Principal approvals during Principal absence.
          </p>

          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-500">Principal Status:</span>
              <PrincipalStatusBadge status={context?.principalStatus} size="sm" />
            </div>

            <div className="flex items-center gap-1.5 text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              <span>Until: <strong className="text-white">{context?.delegation?.endsAt ? new Date(context.delegation.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '6:00 PM'}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={refreshQueue}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Refresh Queue"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Allowed Categories Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="text-xs">
          <span className="font-bold text-slate-400">Allowed Categories: </span>
          <span className="text-slate-200 font-semibold">
            {(context?.delegation?.delegatedCategories || ['Leave', 'Documents', 'Tasks'])
              .map((c) => c.replace('_', ' '))
              .join(' • ')}
          </span>
        </div>
        <div className="text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
          {pendingRequests.length} Pending Actions
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSelectedTab('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            selectedTab === 'PENDING'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span>Pending Actions</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-950/20 text-slate-950 text-[10px] font-black">
            {pendingRequests.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedTab('PROCESSED')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            selectedTab === 'PROCESSED'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span>Processed by Me</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black">
            {processedRequests.length}
          </span>
        </button>
      </div>

      {/* Grid of Items */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-semibold bg-slate-900/40 rounded-3xl border border-slate-800">
          Loading delegated approvals...
        </div>
      ) : activeList.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-extrabold text-white">No requests in queue</h3>
          <p className="text-xs text-slate-400">All delegated approval items have been processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeList.map((req) => (
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

      {/* Drawer */}
      <ApprovalDetailsDrawer
        request={selectedRequest}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApprove={approveRequest}
        onReject={rejectRequest}
        isActingMode={true}
      />
    </div>
  );
};
