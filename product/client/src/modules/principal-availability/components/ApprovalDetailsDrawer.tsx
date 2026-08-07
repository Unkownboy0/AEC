import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, ShieldAlert } from 'lucide-react';
import { approvalRequestsApi, ApprovalRequestDetails, TimelineEventItem, ApprovalAttachmentItem } from '@/modules/approvals/api/approvalRequests.api';
import { CurrentStatusCard } from '@/modules/approvals/components/CurrentStatusCard';
import { ApplicantOverviewCard } from '@/modules/approvals/components/ApplicantOverviewCard';
import { RequestDetailsCard } from '@/modules/approvals/components/RequestDetailsCard';
import { SupportingFilesSection } from '@/modules/approvals/components/SupportingFilesSection';
import { ApprovalWorkflowTimeline } from '@/modules/approvals/components/ApprovalWorkflowTimeline';
import Button from '@/design-system/primitives/Button/Button';

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
          const isHod = (request?.title || '').includes('[HOD]');
          const roleLabel = isHod ? 'Head of Department (HOD)' : 'Faculty Executive';

          if (detailsRes.status === 'fulfilled') {
            const mergedDetails = {
              ...detailsRes.value,
              reason: request?.reason || (request as any)?.description || detailsRes.value?.reason,
              applicant: {
                ...detailsRes.value?.applicant,
                name: request?.applicantName || detailsRes.value?.applicant?.name || 'John Doe',
                departmentName: request?.departmentName || detailsRes.value?.applicant?.departmentName || 'Computer Science & Engineering',
                submittedAsRole: roleLabel,
              },
            };
            setDetails(mergedDetails);
          } else {
            setDetails({
              id: requestId,
              requestNumber: request?.requestNumber || requestId?.slice(0, 8),
              requestType: request?.requestType || 'LEAVE',
              title: request?.title || 'Approval Request',
              reason: request?.reason || (request as any)?.description || request?.leaveReason || 'I want a leave for went to native',
              status: request?.status || 'PENDING',
              currentStage: request?.assignedRole === 'ACTING_PRINCIPAL' ? 'Acting Principal Review' : 'Principal Review',
              assignedRole: request?.assignedRole || 'PRINCIPAL',
              applicant: {
                name: request?.applicantName || request?.submittedBy || 'John Doe',
                departmentName: request?.departmentName || request?.department || 'Computer Science & Engineering',
                submittedAsRole: roleLabel,
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider">
              {(details?.requestType || request.requestType || 'REQUEST').replace(/_/g, ' ')}
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
              {details?.title || request.title || 'Authorization Request'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 pb-24 space-y-5 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/50">
          {loading && !details ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-semibold space-y-2">
              <div className="w-6 h-6 border-2 border-purple-600 dark:border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Fetching database workflow records...</p>
            </div>
          ) : (
            <>
              {/* Actor attribution alert if in acting mode */}
              {isActingMode && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2 shadow-2xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold">Acting Authority Active: </span>
                    <span>Decision will be attributed to Vice Principal — Acting Principal</span>
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

              {/* 3. Request Details */}
              {details && <RequestDetailsCard details={details} />}

              {/* 4. Supporting Files Section */}
              <SupportingFilesSection attachments={attachments} isLoading={loading} />

              {/* 5. Database-Backed Workflow Timeline */}
              <ApprovalWorkflowTimeline
                events={events}
                isLoading={loading}
                requestDetails={details || request}
              />

              {/* Decision Remarks Input if Pending */}
              {isPending && (
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-purple-600 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xs transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {isPending && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="danger"
              size="md"
              onClick={() => handleAction('REJECT')}
              isLoading={submitting}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Reject
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => handleAction('APPROVE')}
              isLoading={submitting}
              leftIcon={<Check className="w-4 h-4 stroke-[3]" />}
            >
              Approve
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

ApprovalDetailsDrawer.displayName = 'ApprovalDetailsDrawer';
export default ApprovalDetailsDrawer;
