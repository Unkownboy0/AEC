export type PrincipalStatusType =
  | 'AVAILABLE'
  | 'BUSY'
  | 'LEAVE'
  | 'OFFICIAL_DUTY'
  | 'CUSTOM'
  | 'OFFLINE';

export type DelegationStatusType =
  | 'INACTIVE'
  | 'PENDING'
  | 'ACTIVE'
  | 'REVOKED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface ActingPrincipalUser {
  userId: string;
  name: string;
  role: string;
  email?: string;
}

export interface EligibleDelegate {
  id: string;
  name: string;
  role: string;
  designation?: string;
  email?: string;
  priority: number;
}

export interface ActiveDelegationDetails {
  id: string;
  principalUserId?: string;
  startsAt: string;
  endsAt: string;
  reason: string;
  delegatedCategories: string[];
  permissions: string[];
  scope: DelegationScope;
  financialThreshold: number | null;
}

export interface DelegationScope {
  tenantId?: string;
  requestTypes?: string[];
  departmentIds?: string[];
  workflowStages?: string[];
  resourceIds?: string[];
  excludedPermissions?: string[];
}

export interface PrincipalAvailabilityContext {
  principalStatus: PrincipalStatusType;
  delegationStatus: DelegationStatusType;
  actingPrincipal: ActingPrincipalUser | null;
  delegation: ActiveDelegationDetails | null;
  canPrincipalProcessRequests: boolean;
  canVpActAsPrincipal: boolean;
  permissionVersion: number;
  serverTime: string;
  pendingPrincipalRequests?: number;
  pendingActingRequests?: number;
  latestHandoverId?: string | null;
  eligibleDelegates?: EligibleDelegate[];
}

export interface UpdateAvailabilityDto {
  status: PrincipalStatusType;
  reason?: string;
  startsAt?: string;
  endsAt?: string;
  actingUserId?: string;
  delegatedCategories?: string[];
  delegatedPermissions?: string[];
  delegatedScope?: DelegationScope;
  financialThreshold?: number | null;
  messageToVp?: string;
  customReasonTag?: string;
}

export type ApprovalCategory =
  | 'FACULTY_LEAVE'
  | 'HOD_LEAVE'
  | 'DEAN_LEAVE'
  | 'STUDENT_LEAVE'
  | 'DOCUMENT_APPROVAL'
  | 'CIRCULAR_APPROVAL'
  | 'TASK_APPROVAL'
  | 'MEETING_APPROVAL'
  | 'ADMINISTRATIVE';
