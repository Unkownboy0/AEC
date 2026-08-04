export interface UiResolverInput {
  userRole?: string;
  principalStatus?: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | string;
  delegationStatus?: 'INACTIVE' | 'ACTIVE' | 'REVOKED' | 'EXPIRED' | string;
  actingUserId?: string | null;
  currentUserId?: string | null;
}

export interface UiResolverResult {
  showPrincipalDelegationBanner: boolean;
  showVpActingBanner: boolean;
  showDelegatedApprovalsMenu: boolean;
  principalApprovalMode: 'FULL' | 'MONITORING_READONLY';
  vpApprovalMode: 'NORMAL' | 'ACTING_PRINCIPAL';
  canProcessDelegatedRequests: boolean;
}

export class AvailabilityUiResolver {
  static resolve(input: UiResolverInput): UiResolverResult {
    const rawRole = input.userRole || '';
    const normRole = (typeof rawRole === 'object' ? (rawRole as any)?.name : String(rawRole)).toUpperCase();
    
    const isPrincipalRole = normRole.includes('PRINCIPAL') && !normRole.includes('VICE') && !normRole.includes('VP');
    const isVpRole = normRole.includes('VICE') || normRole.includes('VP');
    
    const isDelegationActive = (input.principalStatus === 'BUSY' || input.principalStatus === 'OFFLINE') && input.delegationStatus === 'ACTIVE';

    if (isPrincipalRole) {
      return {
        showPrincipalDelegationBanner: isDelegationActive,
        showVpActingBanner: false,
        showDelegatedApprovalsMenu: false,
        principalApprovalMode: isDelegationActive ? 'MONITORING_READONLY' : 'FULL',
        vpApprovalMode: 'NORMAL',
        canProcessDelegatedRequests: !isDelegationActive,
      };
    }

    if (isVpRole) {
      return {
        showPrincipalDelegationBanner: false,
        showVpActingBanner: isDelegationActive,
        showDelegatedApprovalsMenu: isDelegationActive,
        principalApprovalMode: 'MONITORING_READONLY',
        vpApprovalMode: isDelegationActive ? 'ACTING_PRINCIPAL' : 'NORMAL',
        canProcessDelegatedRequests: isDelegationActive,
      };
    }

    return {
      showPrincipalDelegationBanner: false,
      showVpActingBanner: false,
      showDelegatedApprovalsMenu: false,
      principalApprovalMode: 'FULL',
      vpApprovalMode: 'NORMAL',
      canProcessDelegatedRequests: false,
    };
  }
}
