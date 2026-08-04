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

export interface ApprovalRequestItem {
  id: string;
  requestId: string;
  requestType: string;
  title: string | null;
  applicantName: string | null;
  departmentName: string | null;
  assignedUserId: string;
  assignedRole: string;
  assignmentType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  assignedAt: string;
  returnedAt?: string | null;
  completedAt?: string | null;
  actionByUserId?: string | null;
  actionByRole?: string | null;
  actionAsRole?: string | null;
  actionRemarks?: string | null;
}

export interface HandoverSummary {
  id: string;
  delegationId: string;
  principalUserId: string;
  actingUserId: string;
  totalRequests: number;
  approvedCount: number;
  rejectedCount: number;
  returnedCount: number;
  pendingCount: number;
  summary?: string | null;
  generatedAt: string;
  acknowledgedAt?: string | null;
}
