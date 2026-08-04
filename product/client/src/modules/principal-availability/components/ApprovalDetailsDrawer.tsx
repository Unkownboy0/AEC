import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, User, ShieldAlert } from 'lucide-react';
import { approvalRequestsApi, ApprovalRequestDetails, TimelineEventItem, ApprovalAttachmentItem } from '@/modules/approvals/api/approvalRequests.api';
import { CurrentStatusCard } from '@/modules/approvals/components/CurrentStatusCard';
import { ApplicantOverviewCard } from '@/modules/approvals/components/ApplicantOverviewCard';
import { RequestDetailsCard } from '@/modules/approvals/components/RequestDetailsCard';
import { SupportingFilesSection } from '@/modules/approvals/components/SupportingFilesSection';
import { ApprovalWorkflowTimeline } from '@/modules/approvals/components/ApprovalWorkflowTimeline';

interface ApprovalDetailsDrawerProps {
  request: any | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: string, remarks?: string) => Promise<void>;
  onReject?: (id: string, remarks?: string) => Promise<void>;
  isActingMode?: boolean;
}

export const ApprovalDetailsDrawer: React.FC<ApprovalDetailsDrawerProps> = ({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isActingMode = false,
}) => {
  const [details, setDetails] = useState<ApprovalRequestDetails | null>(null);
  const [events, setEvents] = useState<TimelineEventItem[]>([]);
  const [attachments, setAttachments] = useState<ApprovalAttachmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const requestId = request?.requestId || request?.id;

  // Reopening Drawer resets state and fetches real database records
  useEffect(() => {
    if (!isOpen || !requestId) {
      setDetails(null);
      setEvents([]);
      setAttachments([]);
      setRemarks('');
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [detailsRes, timelineRes, attachmentsRes] = await Promise.allSettled([
          approvalRequestsApi.getRequestDetails(requestId),
          approvalRequestsApi.getTimelineEvents(requestId),
          approvalRequestsApi.getAttachments(requestId),
        ]);

        if (isMounted) {
          if (detailsRes.status === 'fulfilled') {
            setDetails(detailsRes.value);
          } else {
            // Fallback to passed request prop if endpoint errors
            setDetails({
              id: requestId,
              requestNumber: request?.requestNumber || requestId?.slice(0, 8),
              requestType: request?.requestType || 'LEAVE',
              title: request?.title || 'Approval Request',
              reason: request?.reason || request?.details?.reason || 'Official authorization request',
              status: request?.status || 'PENDING',
              currentStage: request?.assignedRole === 'ACTING_PRINCIPAL' ? 'Acting Principal Review' : 'Principal Review',
              assignedRole: request?.assignedRole || 'PRINCIPAL',
              applicant: {
                name: request?.applicantName || request?.submittedBy || 'Applicant',
                departmentName: request?.departmentName || request?.department || 'Academic Department',
                submittedAsRole: request?.submittedByRole || 'Executive',
              },
              submittedAt: request?.createdAt || new Date().toISOString(),
            });
          }

          if (timelineRes.status === 'fulfilled') {
            setEvents(timelineRes.value);
          }

          if (attachmentsRes.status === 'fulfilled') {
            setAttachments(attachmentsRes.value);
          }
        }
      } catch (err) {
        console.error('Failed to load drawer data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, requestId]);

  if (!isOpen || !request) return null;

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    try {
      setSubmitting(true);
      if (action === 'APPROVE' && onApprove) {
        await onApprove(request.id, remarks);
      } else if (action === 'REJECT' && onReject) {
        await onReject(request.id, remarks);
      }
      onClose();
    } catch (err) {
      console.error('Error handling approval action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = (details?.status || request.status) === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase">
              {(details?.requestType || request.requestType || 'REQUEST').replace(/_/g, ' ')}
            </span>
            <h3 className="text-lg font-black text-white leading-snug">
              {details?.title || request.title || 'Authorization Request'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {loading && !details ? (
            <div className="py-12 text-center text-xs text-slate-500 font-semibold space-y-2">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Fetching database workflow records...</p>
            </div>
          ) : (
            <>
              {/* Actor attribution alert if in acting mode */}
              {isActingMode && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 shadow-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold">Acting Authority Active: </span>
                    <span>Decision will be permanently attributed to Vice Principal — Acting Principal</span>
                  </div>
                </div>
              )}

              {/* 1. Current Status & Stage Card */}
              <CurrentStatusCard
                currentStage={details?.currentStage || 'Principal Review'}
                status={details?.status || request.status || 'PENDING'}
                assignedRole={details?.assignedRole || request.assignedRole}
                isActingMode={isActingMode}
              />

              {/* 2. Applicant Overview */}
              {details?.applicant && <ApplicantOverviewCard applicant={details.applicant} />}

              {/* 3. Request Details & Validation Warning */}
              {details && <RequestDetailsCard details={details} />}

              {/* 4. Supporting Files Section (Only renders if attachments exist!) */}
              <SupportingFilesSection attachments={attachments} isLoading={loading} />

              {/* 5. Database-Backed Workflow Timeline */}
              <ApprovalWorkflowTimeline events={events} isLoading={loading} />

              {/* Decision Remarks Input if Pending */}
              {isPending && (
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Executive Decision Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={
                      isActingMode
                        ? 'Entering approval remarks as Vice Principal (Acting Principal)...'
                        : 'Entering official approval remarks...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {isPending && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-2 shrink-0">
            <button
              onClick={() => handleAction('REJECT')}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-extrabold transition-all flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>

            <button
              onClick={() => handleAction('APPROVE')}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Approve</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
