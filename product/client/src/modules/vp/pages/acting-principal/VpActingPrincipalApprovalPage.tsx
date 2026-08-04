import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  RotateCcw,
  HelpCircle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  AlertTriangle,
  UserCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import { useDelegatedApprovals, DelegatedApprovalItem } from '../../hooks/useDelegatedApprovals';
import { useActingPrincipalContext } from '../../hooks/useActingPrincipalContext';
import { useDelegatedApprovalActions } from '../../hooks/useDelegatedApprovalActions';
import { toast } from '../../../../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

export const VpActingPrincipalApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const { context, refreshContext } = useActingPrincipalContext();
  const { requests, counts, loading, error, refetch } = useDelegatedApprovals();
  const { approveRequest, rejectRequest, returnRequest, requestInfo, submitting } = useDelegatedApprovalActions(() => {
    refetch();
    refreshContext();
  });

  const [selectedTab, setSelectedTab] = useState<'PENDING' | 'URGENT' | 'PROCESSED' | 'RETURNED' | 'ALL'>('PENDING');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<DelegatedApprovalItem | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'APPROVE' | 'REJECT' | 'RETURN' | 'INFO';
    item: DelegatedApprovalItem | null;
  }>({
    isOpen: false,
    type: 'APPROVE',
    item: null,
  });
  const [remarks, setRemarks] = useState<string>('');

  const handleRefresh = () => {
    refetch();
    refreshContext();
    toast.success('Delegated queue refreshed');
  };

  const handleActionClick = (type: 'APPROVE' | 'REJECT' | 'RETURN' | 'INFO', item: DelegatedApprovalItem) => {
    setActionModal({ isOpen: true, type, item });
    setRemarks('');
  };

  const handleConfirmAction = async () => {
    if (!actionModal.item) return;
    try {
      if (actionModal.type === 'APPROVE') {
        await approveRequest(actionModal.item.id, remarks || 'Approved by Vice Principal (Acting Principal)');
        toast.success(`Request ${actionModal.item.title} approved successfully`);
      } else if (actionModal.type === 'REJECT') {
        await rejectRequest(actionModal.item.id, remarks || 'Rejected by Vice Principal (Acting Principal)');
        toast.success(`Request ${actionModal.item.title} rejected`);
      } else if (actionModal.type === 'RETURN') {
        await returnRequest(actionModal.item.id, remarks || 'Returned for revisions');
        toast.success(`Request ${actionModal.item.title} returned`);
      } else if (actionModal.type === 'INFO') {
        await requestInfo(actionModal.item.id, remarks || 'Additional information requested');
        toast.info(`Information requested for ${actionModal.item.title}`);
      }
      setActionModal({ isOpen: false, type: 'APPROVE', item: null });
      setSelectedItem(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process request');
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    // Tab Filter
    if (selectedTab === 'PENDING' && r.status !== 'PENDING') return false;
    if (selectedTab === 'URGENT' && !(r.status === 'PENDING' && ((r.title || '').toLowerCase().includes('urgent') || r.isUrgent))) return false;
    if (selectedTab === 'PROCESSED' && (r.status === 'PENDING' || r.status === 'RETURNED' || r.status === 'NEEDS_INFORMATION')) return false;
    if (selectedTab === 'RETURNED' && (r.status !== 'RETURNED' && r.status !== 'NEEDS_INFORMATION')) return false;

    // Category Filter
    if (selectedCategory !== 'ALL') {
      const itemCat = (r.category || r.requestType || '').toUpperCase();
      if (!itemCat.includes(selectedCategory.toUpperCase())) return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (r.title || '').toLowerCase().includes(q);
      const matchId = (r.requestId || r.id || '').toLowerCase().includes(q);
      const matchType = (r.requestType || '').toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchType) return false;
    }

    return true;
  });

  const formattedEndTime = context?.delegation?.endsAt
    ? new Date(context.delegation.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '6:00 PM';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Delegated Approvals</h1>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              ACTING PRINCIPAL MODE
            </span>
          </div>

          <p className="text-xs md:text-sm text-slate-400">
            You are temporarily handling selected Principal-level approvals during Principal absence.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 font-semibold">Principal Status:</span>
              <span className="font-extrabold uppercase px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {context?.principalStatus || 'BUSY'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 text-amber-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Valid Until: <strong className="text-white font-bold">{formattedEndTime}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Acting Authority: <strong className="text-slate-100 font-bold">Vice Principal</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 shadow-md active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Acting Mode Notice Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/40 border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-amber-200">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-400">Audit Attribution Active:</strong> All decisions (Approve/Reject/Return) will be permanently attributed to your Vice Principal identity.
          </span>
        </div>
        <div className="text-slate-300 text-[11px] font-medium bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/60">
          Allowed Categories: <strong className="text-white">{(context?.delegation?.delegatedCategories || ['Leave', 'Documents', 'Circulars']).join(' • ')}</strong>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending</span>
          <div className="text-2xl font-black text-amber-400">{counts.pending}</div>
          <p className="text-[10px] text-slate-500">Awaiting your action</p>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/20 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Urgent</span>
          <div className="text-2xl font-black text-rose-400">{counts.urgent}</div>
          <p className="text-[10px] text-slate-500">High priority requests</p>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Approved Today</span>
          <div className="text-2xl font-black text-emerald-400">{counts.approvedToday}</div>
          <p className="text-[10px] text-slate-500">Approved by Vice Principal</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rejected Today</span>
          <div className="text-2xl font-black text-slate-300">{counts.rejectedToday}</div>
          <p className="text-[10px] text-slate-500">Declined requests</p>
        </div>

        <div className="bg-slate-900/90 border border-indigo-500/20 rounded-2xl p-4 space-y-1 shadow-lg col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Returned / Info</span>
          <div className="text-2xl font-black text-indigo-400">{counts.returned}</div>
          <p className="text-[10px] text-slate-500">Sent back for revisions</p>
        </div>
      </div>

      {/* Controls Bar: Tabs, Category Filter & Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setSelectedTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                selectedTab === 'PENDING' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({counts.pending})
            </button>

            <button
              onClick={() => setSelectedTab('URGENT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                selectedTab === 'URGENT' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Urgent ({counts.urgent})
            </button>

            <button
              onClick={() => setSelectedTab('PROCESSED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                selectedTab === 'PROCESSED' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Processed ({counts.approvedToday + counts.rejectedToday})
            </button>

            <button
              onClick={() => setSelectedTab('RETURNED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                selectedTab === 'RETURNED' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Returned ({counts.returned})
            </button>

            <button
              onClick={() => setSelectedTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                selectedTab === 'ALL' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Delegated ({requests.length})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-3">
            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Categories</option>
                <option value="FACULTY_LEAVE">Faculty Leave & OD</option>
                <option value="HOD_LEAVE">HOD Leave & OD</option>
                <option value="DEAN_LEAVE">Dean Leave & OD</option>
                <option value="CIRCULAR">Circular Approvals</option>
                <option value="DOCUMENT">Document Sign-offs</option>
                <option value="TASK">Administrative Tasks</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Requests List */}
        {loading && requests.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs">Loading delegated requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No delegated approvals right now</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              New Principal-level requests will appear here automatically while Principal is Busy or Offline.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                      {item.requestType?.replace('_', ' ') || 'GENERAL'}
                    </span>

                    <h3 className="text-sm font-bold text-white tracking-tight">{item.title}</h3>

                    {item.isUrgent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        URGENT
                      </span>
                    )}

                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      item.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' :
                      item.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                      item.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-indigo-500/20 text-indigo-300'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Submitted by: <strong className="text-slate-200">{item.submittedBy || 'Faculty / HOD'}</strong></span>
                    <span>Received: <strong className="text-slate-300">{new Date(item.createdAt).toLocaleDateString()}</strong></span>
                  </div>

                  {item.actionRemarks && (
                    <div className="text-xs text-slate-400 italic bg-slate-900 p-2 rounded-lg border border-slate-800 mt-1">
                      Action Remarks: "{item.actionRemarks}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/vp/acting-principal/approvals/${item.requestId || item.id}`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {item.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleActionClick('APPROVE', item)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-extrabold transition-all shadow-md active:scale-95"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => handleActionClick('REJECT', item)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-extrabold transition-all shadow-md active:scale-95"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => handleActionClick('RETURN', item)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 text-white text-xs font-bold transition-all"
                        title="Return for revisions"
                      >
                        Return
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.isOpen && actionModal.item && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">
                {actionModal.type === 'APPROVE' && 'Confirm Approval'}
                {actionModal.type === 'REJECT' && 'Confirm Rejection'}
                {actionModal.type === 'RETURN' && 'Return Request'}
                {actionModal.type === 'INFO' && 'Request Clarification'}
              </h3>
              <button
                onClick={() => setActionModal({ isOpen: false, type: 'APPROVE', item: null })}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <p className="text-slate-400">Request: <strong className="text-white">{actionModal.item.title}</strong></p>
              <p className="text-slate-400">Actor Attribution: <strong className="text-amber-400">Vice Principal (Acting Principal)</strong></p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Approval Remarks / Notes:</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter official remarks..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActionModal({ isOpen: false, type: 'APPROVE', item: null })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all shadow-lg ${
                  actionModal.type === 'APPROVE' ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' :
                  actionModal.type === 'REJECT' ? 'bg-rose-600 hover:bg-rose-500 text-white' :
                  'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {submitting ? 'Processing...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
