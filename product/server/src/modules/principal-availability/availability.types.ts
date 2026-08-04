export type PrincipalStatusType = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

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

export interface ActiveDelegationDetails {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string;
  delegatedCategories: string[];
  permissions: string[];
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
}

export interface UpdateAvailabilityDto {
  status: PrincipalStatusType;
  reason?: string;
  startsAt?: string;
  endsAt?: string;
  actingUserId?: string;
  delegatedCategories?: string[];
  messageToVp?: string;
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
