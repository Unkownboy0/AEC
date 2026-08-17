import {
  ApprovalViewModel,
  ApprovalRequester,
  ApprovalMetadataField,
  ApprovalContextCard,
  ApprovalAttachmentItem,
  ApprovalTimelineStep,
  ApprovalActionDef,
} from './ApprovalTypes';

export function adaptFacultyLeaveOdRequest(
  req: any,
  viewerRole: 'HOD' | 'PRINCIPAL' | 'VP' | 'FACULTY' = 'HOD'
): ApprovalViewModel {
  const isLeave = req.type === 'LEAVE';
  const faculty = req.facultyRequester?.user || req.facultyRequester || {};

  const requester: ApprovalRequester = {
    id: req.facultyId || faculty.id || '',
    name: faculty.firstName ? `${faculty.firstName} ${faculty.lastName || ''}`.trim() : 'Faculty Member',
    role: req.facultyRequester?.designation || 'Faculty',
    departmentName: req.facultyRequester?.department?.name || req.departmentName,
    departmentCode: req.facultyRequester?.department?.code || req.departmentCode,
    employeeId: req.facultyRequester?.employeeId,
    email: faculty.email,
    phone: req.facultyRequester?.phone || faculty.phone,
  };

  const metadata: ApprovalMetadataField[] = [
    {
      label: 'From Date',
      value: new Date(req.startDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    },
    {
      label: 'To Date',
      value: new Date(req.endDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    },
    {
      label: 'Total Duration',
      value: `${req.totalDays} Day(s)`,
      isHighlight: true,
    },
    {
      label: 'Current Approver',
      value: req.currentStep || 'Principal / HOD Review',
    },
  ];

  // Context: Substitutions
  const contextSections: ApprovalContextCard[] = [];
  let parsedSubs: any[] = [];
  try {
    if (req.substitutions) {
      parsedSubs = typeof req.substitutions === 'string' ? JSON.parse(req.substitutions) : req.substitutions;
    }
  } catch (e) {}

  if (parsedSubs && parsedSubs.length > 0) {
    contextSections.push({
      id: 'substitutions',
      title: `Affected Classes & Assigned Substitutes (${parsedSubs.length})`,
      badge: { label: 'Department-Wise Allocation', variant: 'purple' },
      items: parsedSubs.map((sub: any) => ({
        label: sub.subjectName || 'Subject',
        tag: sub.periodDisplay || `Period ${sub.slotIndex || ''}`,
        subValue: `${sub.departmentCode ? `${sub.departmentCode} • ` : ''}${sub.sectionName || ''} • ${sub.startTime || ''} - ${sub.endTime || ''}`,
        value: sub.assignedSubstituteName || 'Pending Assignment',
      })),
    });
  }

  // Work handover details if any
  if (req.workHandoverDetails) {
    contextSections.push({
      id: 'handover',
      title: 'Work Handover Instructions',
      badge: { label: 'Faculty Handover', variant: 'blue' },
      description: req.workHandoverDetails,
    });
  }

  // Attachments
  const attachments: ApprovalAttachmentItem[] = [];
  if (req.documentUrl) {
    attachments.push({
      id: 'doc-1',
      name: req.documentUrl.split('/').pop() || 'Supporting Document',
      url: req.documentUrl,
      type: 'pdf',
    });
  }

  // Timeline
  const timeline: ApprovalTimelineStep[] = (req.history || []).map((h: any, idx: number) => ({
    id: h.id || `hist-${idx}`,
    stage: `${h.stage} Stage`,
    action: h.action,
    status: h.action?.includes('REJECT') ? 'REJECTED' : h.action?.includes('RETURN') ? 'RETURNED' : 'COMPLETED',
    actorName: h.actionByName,
    actorRole: h.actionByRole,
    performedAsRole: h.performedAsRole === 'ACTING_PRINCIPAL' ? 'Vice Principal — Acting Principal' : undefined,
    timestamp: h.createdAt,
    comment: h.comment,
  }));

  // Available actions for HOD / Principal
  const isPending = req.status === 'PENDING_HOD' || req.status === 'PENDING' || req.currentStep === 'HOD';
  const isPrincipalPending = req.status === 'PENDING_PRINCIPAL' || req.status === 'FORWARDED_TO_PRINCIPAL';

  const availableActions: ApprovalActionDef[] = [];
  if (viewerRole === 'HOD' && isPending) {
    availableActions.push(
      {
        action: 'RECOMMEND',
        label: 'Recommend to Principal',
        variant: 'primary',
        nextStagePreview: 'Current: HOD Review → Next: Principal Final Approval',
        confirmationTitle: 'Recommend & Forward to Principal',
        remarksPlaceholder: 'Optional recommendation remarks to Principal...',
      },
      {
        action: 'RETURN',
        label: 'Return to Faculty',
        variant: 'secondary',
        requiresRemarks: true,
        confirmationTitle: 'Return Request for Clarification',
        remarksPlaceholder: 'Specify reasons for return and required corrections...',
      },
      {
        action: 'REJECT',
        label: 'Reject Request',
        variant: 'danger',
        requiresRemarks: true,
        isDestructive: true,
        confirmationTitle: 'Reject Faculty Request',
        remarksPlaceholder: 'Mandatory rejection justification...',
      }
    );
  } else if ((viewerRole === 'PRINCIPAL' || viewerRole === 'VP') && (isPrincipalPending || isPending)) {
    availableActions.push(
      {
        action: 'APPROVE',
        label: 'Approve Leave/OD',
        variant: 'primary',
        nextStagePreview: 'Final Approval Stage (Principal)',
        confirmationTitle: 'Approve Faculty Leave/OD',
      },
      {
        action: 'RETURN',
        label: 'Return to HOD/Faculty',
        variant: 'secondary',
        requiresRemarks: true,
        confirmationTitle: 'Return Request for Review',
      },
      {
        action: 'REJECT',
        label: 'Reject Request',
        variant: 'danger',
        requiresRemarks: true,
        isDestructive: true,
        confirmationTitle: 'Reject Faculty Request',
      }
    );
  }

  return {
    id: req.id,
    requestNumber: req.requestNumber,
    requestType: req.type || (isLeave ? 'LEAVE' : 'ON_DUTY'),
    typeBadgeLabel: req.type || (isLeave ? 'LEAVE' : 'ON_DUTY'),
    typeVariant: isLeave ? 'purple' : 'blue',
    title: req.title || `${req.type} Application`,
    reason: req.reason,
    status: req.status,
    priority: req.isEmergency ? 'EMERGENCY' : 'NORMAL',
    isEmergency: Boolean(req.isEmergency),
    currentStep: req.currentStep,
    submittedAt: req.createdAt || req.startDate,
    requester,
    metadata,
    contextSections,
    attachments,
    timeline,
    availableActions,
    rawData: req,
  };
}

export function adaptStudentLeaveOdRequest(
  req: any,
  viewerRole: 'MENTOR' | 'HOD' | 'ADVISER' = 'MENTOR'
): ApprovalViewModel {
  const isLeave = req.type === 'LEAVE';
  const student = req.student || {};

  const requester: ApprovalRequester = {
    id: req.studentId || student.id || '',
    name: student.firstName ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Student',
    role: 'Student',
    departmentName: student.department?.name,
    departmentCode: student.department?.code,
    admissionNo: student.admissionNo,
    classSection: `${student.department?.code || ''} ${student.section?.name || ''}`.trim(),
    email: student.email,
    phone: student.phone,
  };

  const metadata: ApprovalMetadataField[] = [
    {
      label: 'From Date',
      value: new Date(req.startDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    },
    {
      label: 'To Date',
      value: new Date(req.endDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    },
    {
      label: 'Total Days',
      value: `${req.totalDays || 1} Day(s)`,
      isHighlight: true,
    },
    {
      label: 'Category',
      value: req.category || req.requestCategory || (isLeave ? 'Medical / Personal' : 'Academic / Event'),
    },
  ];

  // Context: Academic attendance % if present
  const contextSections: ApprovalContextCard[] = [];
  if (student.attendancePercentage !== undefined) {
    contextSections.push({
      id: 'attendance',
      title: 'Student Academic Attendance',
      badge: {
        label: `${student.attendancePercentage}% Attendance`,
        variant: student.attendancePercentage >= 75 ? 'emerald' : 'red',
      },
      description: `Current semester attendance standing for ${requester.name}.`,
    });
  }

  // Attachments
  const attachments: ApprovalAttachmentItem[] = [];
  if (req.attachments) {
    let parsed: string[] = [];
    try {
      parsed = typeof req.attachments === 'string' ? JSON.parse(req.attachments) : req.attachments;
    } catch (e) {
      if (typeof req.attachments === 'string') parsed = [req.attachments];
    }
    parsed.forEach((url, i) => {
      attachments.push({
        id: `att-${i}`,
        name: url.split('/').pop() || `Document ${i + 1}`,
        url,
        type: 'pdf',
      });
    });
  }

  // Timeline
  const timeline: ApprovalTimelineStep[] = (req.approvalHistory || req.history || []).map(
    (h: any, idx: number) => ({
      id: h.id || `hist-${idx}`,
      stage: `${h.stage || h.approverRole || 'Review'} Stage`,
      action: h.action || h.status,
      status: (h.action || '').includes('REJECT')
        ? 'REJECTED'
        : (h.action || '').includes('RETURN')
        ? 'RETURNED'
        : 'COMPLETED',
      actorName: h.approver?.name || h.actionByName || 'Reviewer',
      actorRole: h.approverRole || h.actionByRole,
      timestamp: h.createdAt || h.timestamp,
      comment: h.comments || h.comment || h.remarks,
    })
  );

  // Available actions
  const isMentorPending = req.status === 'PENDING_MENTOR' || req.status === 'SUBMITTED';
  const isHodPending = req.status === 'PENDING_HOD' || req.status === 'FORWARDED_TO_HOD';

  const availableActions: ApprovalActionDef[] = [];
  if (viewerRole === 'MENTOR' && isMentorPending) {
    availableActions.push(
      {
        action: 'APPROVE',
        label: 'Approve & Forward to HOD',
        variant: 'primary',
        nextStagePreview: 'Current: Mentor Review → Next: HOD Department Review',
        confirmationTitle: 'Approve Student Leave/OD Request',
      },
      {
        action: 'RETURN',
        label: 'Return to Student',
        variant: 'secondary',
        requiresRemarks: true,
        confirmationTitle: 'Return Request for Clarification',
      },
      {
        action: 'REJECT',
        label: 'Reject Request',
        variant: 'danger',
        requiresRemarks: true,
        isDestructive: true,
        confirmationTitle: 'Reject Student Request',
      }
    );
  } else if (viewerRole === 'HOD' && (isHodPending || isMentorPending)) {
    availableActions.push(
      {
        action: 'APPROVE',
        label: 'Approve Request',
        variant: 'primary',
        nextStagePreview: 'Final Department Approval Stage (HOD)',
        confirmationTitle: 'Finalize & Approve Student Leave/OD',
      },
      {
        action: 'RETURN',
        label: 'Return to Mentor/Student',
        variant: 'secondary',
        requiresRemarks: true,
        confirmationTitle: 'Return Request for Clarification',
      },
      {
        action: 'REJECT',
        label: 'Reject Request',
        variant: 'danger',
        requiresRemarks: true,
        isDestructive: true,
        confirmationTitle: 'Reject Student Request',
      }
    );
  }

  return {
    id: req.id,
    requestNumber: req.requestNumber,
    requestType: req.type || (isLeave ? 'STUDENT_LEAVE' : 'STUDENT_OD'),
    typeBadgeLabel: isLeave ? 'STUDENT LEAVE' : 'ON-DUTY',
    typeVariant: isLeave ? 'purple' : 'blue',
    title: req.reason || `${req.type} Application`,
    reason: req.reason,
    status: req.status,
    priority: req.isEmergency ? 'EMERGENCY' : 'NORMAL',
    isEmergency: Boolean(req.isEmergency),
    submittedAt: req.createdAt || req.startDate,
    requester,
    metadata,
    contextSections,
    attachments,
    timeline,
    availableActions,
    rawData: req,
  };
}

export function adaptDelegatedApprovalItem(item: any): ApprovalViewModel {
  const isLeave = (item.requestType || '').toUpperCase().includes('LEAVE') || (item.category || '').toUpperCase().includes('LEAVE');
  const isOD = (item.requestType || '').toUpperCase().includes('OD') || (item.category || '').toUpperCase().includes('OD');
  const isPurchase = (item.requestType || '').toUpperCase().includes('PURCHASE') || (item.category || '').toUpperCase().includes('PURCHASE');
  const isAppraisal = (item.requestType || '').toUpperCase().includes('APPRAISAL') || (item.category || '').toUpperCase().includes('APPRAISAL');

  const typeLabel = isLeave ? 'LEAVE' : isOD ? 'ON_DUTY' : isPurchase ? 'PURCHASE' : isAppraisal ? 'APPRAISAL' : (item.requestType || 'REQUEST');
  const typeVariant = isLeave ? 'purple' : isOD ? 'blue' : isPurchase ? 'amber' : isAppraisal ? 'emerald' : 'sky';

  const requester: ApprovalRequester = {
    id: item.assignedUserId || item.id,
    name: item.submittedBy || 'Applicant',
    role: item.submittedByRole || 'Faculty / Staff',
    departmentName: item.department,
  };

  const metadata: ApprovalMetadataField[] = [
    { label: 'Category', value: item.category || item.requestType || 'General' },
    { label: 'Assigned Role', value: item.assignedRole || 'Acting Principal' },
    { label: 'Status', value: item.status || 'PENDING' },
    {
      label: 'Date Submitted',
      value: new Date(item.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    },
  ];

  const availableActions: ApprovalActionDef[] = [];
  if (item.status === 'PENDING') {
    availableActions.push(
      {
        action: 'APPROVE',
        label: 'Approve as Acting Principal',
        variant: 'primary',
        nextStagePreview: 'Delegated Final Approval (Acting Principal)',
        confirmationTitle: 'Approve Delegated Request',
      },
      {
        action: 'RETURN',
        label: 'Return for Revisions',
        variant: 'secondary',
        requiresRemarks: true,
        confirmationTitle: 'Return Delegated Request',
      },
      {
        action: 'REJECT',
        label: 'Reject Request',
        variant: 'danger',
        requiresRemarks: true,
        isDestructive: true,
        confirmationTitle: 'Reject Delegated Request',
      }
    );
  }

  return {
    id: item.id,
    requestNumber: item.requestId || item.id.slice(0, 8),
    requestType: typeLabel,
    typeBadgeLabel: typeLabel,
    typeVariant,
    title: item.title || 'Delegated Approval Request',
    reason: item.actionRemarks || item.details?.reason || item.title,
    status: item.status,
    priority: item.isUrgent ? 'URGENT' : 'NORMAL',
    isEmergency: Boolean(item.isUrgent),
    submittedAt: item.createdAt,
    requester,
    metadata,
    availableActions,
    rawData: item,
  };
}

