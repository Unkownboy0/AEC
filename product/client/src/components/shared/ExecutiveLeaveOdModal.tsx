import React, { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, Send, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Plus, Shield, Ban } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../ui/Toast';

interface ExecutiveLeaveOdModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  userName?: string;
}

export const ExecutiveLeaveOdModal: React.FC<ExecutiveLeaveOdModalProps> = ({
  isOpen,
  onClose,
  userRole = 'Executive',
  userName = 'User',
}) => {
  const [activeTab, setActiveTab] = useState<'apply' | 'my_requests'>('apply');
  const [leaveType, setLeaveType] = useState<'CASUAL_LEAVE' | 'MEDICAL_LEAVE' | 'EARNED_LEAVE' | 'ON_DUTY'>('CASUAL_LEAVE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // My Requests List
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMyRequests();
    }
  }, [isOpen]);

  const fetchMyRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const res = await api.get('/faculty/leave/my-requests');
      if (res.data?.status === 'success') {
        setMyRequests(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch executive leave requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/faculty/leave', {
        leaveType,
        startDate,
        endDate,
        reason,
        attachmentUrl,
      });

      if (res.data?.status === 'success') {
        toast.success(`Leave/OD Request (${leaveType}) submitted directly to Principal / Acting Principal!`);
        setReason('');
        setAttachmentUrl('');
        setActiveTab('my_requests');
        fetchMyRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit Leave/OD request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRequest = async (id: string) => {
    if (!window.confirm('Cancel this Leave/OD request?')) return;
    try {
      await api.post(`/workflows/requests/${id}/cancel`);
      toast.success('Request cancelled.');
      fetchMyRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Request could not be cancelled.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                Executive Desk
              </span>
              <span className="text-xs font-bold text-muted-foreground">{userRole} Profile</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-foreground mt-1">Executive Leave & On Duty (OD) Portal</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Direct Level 2 submission to Principal (or Acting Principal / Vice Principal).
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border bg-background hover:bg-muted flex items-center justify-center text-xs font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b px-6 bg-muted/20 gap-4">
          <button
            onClick={() => setActiveTab('apply')}
            className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'apply'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plus className="h-4 w-4" /> Apply Leave / OD
          </button>
          <button
            onClick={() => {
              setActiveTab('my_requests');
              fetchMyRequests();
            }}
            className={`py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'my_requests'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-4 w-4" /> My Submitted Requests ({myRequests.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'apply' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Request Category</label>
                  <select
                    value={leaveType}
                    onChange={(e: any) => setLeaveType(e.target.value)}
                    className="w-full h-10 border rounded-xl bg-background px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="CASUAL_LEAVE">Casual Leave (CL)</option>
                    <option value="MEDICAL_LEAVE">Medical Leave (ML)</option>
                    <option value="ON_DUTY">On Duty (OD) / Official Travel</option>
                    <option value="EARNED_LEAVE">Earned Leave (EL)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Approval Destination</label>
                  <div className="h-10 border rounded-xl bg-muted/30 px-3 flex items-center gap-2 text-xs font-bold text-primary">
                    <Shield className="h-4 w-4" /> Principal / Vice Principal (Direct)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 border rounded-xl bg-background px-3 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 border rounded-xl bg-background px-3 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Reason / Purpose of Leave / OD *</label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide explicit justification for your absence or official duty event..."
                  className="w-full border rounded-xl bg-background p-3 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Attachment Link / Supporting URL (Optional)</label>
                <input
                  type="text"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full h-10 border rounded-xl bg-background px-3 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded-xl text-xs font-extrabold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl shadow-xs hover:bg-primary/95 flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" /> {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2">
                <p className="text-xs text-muted-foreground">History of Leave and OD requests submitted by you.</p>
                <button
                  onClick={fetchMyRequests}
                  className="px-2.5 py-1 border text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-muted"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>

              {isLoadingRequests ? (
                <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                  Loading submitted requests...
                </div>
              ) : myRequests.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground border rounded-2xl p-6 bg-muted/10">
                  No Leave / OD requests submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((req) => (
                    <div key={req.id} className="border rounded-2xl p-4 bg-card shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                            {req.requestNumber}
                          </span>
                          <span className="text-xs font-extrabold">{req.leaveType.replace('_', ' ')}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          req.status === 'APPROVED_PRINCIPAL' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
                          req.status === 'REJECTED_PRINCIPAL' ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                        }`}>
                          {req.status === 'APPROVED_PRINCIPAL' ? 'Approved by Principal' :
                           req.status === 'REJECTED_PRINCIPAL' ? 'Rejected by Principal' :
                           'Pending Principal Approval'}
                        </span>
                      </div>

                      <p className="text-xs text-foreground font-medium">{req.reason}</p>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t">
                        <span>
                          {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()} ({req.totalDays} day(s))
                        </span>
                        {req.principalRemarks && (
                          <span className="italic text-primary font-bold">Remarks: {req.principalRemarks}</span>
                        )}
                      </div>
                      {(req.status === 'DRAFT' || String(req.status).startsWith('PENDING') || req.status === 'RETURNED') && <div className="flex justify-end"><button type="button" onClick={() => cancelRequest(req.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Ban className="h-3.5 w-3.5" /> Cancel request</button></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
