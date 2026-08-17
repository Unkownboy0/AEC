/**
 * Campus Workspace — Permission Service
 * Centralised permission resolver for all Workspace documents.
 * Never trust frontend visibility — all access must be checked server-side.
 */

import { prisma } from '../../lib/prisma';
import { SharePermission, WorkspacePermissions } from './workspace.types';

export class WorkspacePermissionService {
  /**
   * Resolve effective permissions for a user on a given document.
   * Checks: ownership, share entries (user/role/department), workflow reviewer.
   */
  static async resolvePermissions(
    documentId: string,
    userId: string,
    userRoleName: string,
    userDepartmentId?: string
  ): Promise<WorkspacePermissions> {
    const doc = await prisma.campusOfficeDocument.findUnique({
      where: { id: documentId },
      select: {
        authorId: true,
        targetScope: true,
        targetUsers: true,
        targetRoles: true,
        departmentId: true,
        status: true,
        assignedReviewerId: true,
        isLocked: true,
      },
    });

    if (!doc) {
      return this.noAccess();
    }

    // 1. Owner always has full access
    if (doc.authorId === userId) {
      return this.ownerPermissions();
    }

    // 2. Super Admin / College Admin — full access
    if (['Super Admin', 'College Admin'].includes(userRoleName)) {
      return this.adminPermissions();
    }

    // 3. Assigned reviewer for the current workflow step
    if (doc.assignedReviewerId === userId) {
      return {
        ...this.viewerPermissions(),
        canComment: true,
        canReview: true,
        canApprove: true,
        isOwner: false,
      };
    }

    // 4. Check share entries in targetUsers / targetRoles / departmentScope
    let effectivePermission: SharePermission | null = null;
    let extraRights = { canDownload: false, canPrint: false, canExport: false, canShare: false };

    // targetUsers: JSON array of { userId, permission, canDownload, canPrint, ... }
    try {
      const targetUsers: Array<{ userId: string; permission: SharePermission; canDownload?: boolean; canPrint?: boolean; canShare?: boolean; canExport?: boolean }> =
        JSON.parse(doc.targetUsers || '[]');
      const userEntry = targetUsers.find((e) => e.userId === userId);
      if (userEntry) {
        effectivePermission = userEntry.permission;
        extraRights = {
          canDownload: userEntry.canDownload ?? false,
          canPrint: userEntry.canPrint ?? false,
          canExport: userEntry.canExport ?? false,
          canShare: userEntry.canShare ?? false,
        };
      }
    } catch {}

    // targetRoles: JSON array of { roleName, permission }
    if (!effectivePermission) {
      try {
        const targetRoles: Array<{ roleName: string; permission: SharePermission }> = JSON.parse(doc.targetRoles || '[]');
        const roleEntry = targetRoles.find((e) => e.roleName === userRoleName);
        if (roleEntry) {
          effectivePermission = roleEntry.permission;
        }
      } catch {}
    }

    // Department-scoped access
    if (!effectivePermission && doc.targetScope === 'DEPARTMENT' && doc.departmentId && doc.departmentId === userDepartmentId) {
      effectivePermission = 'VIEWER';
    }

    // ALL_CAMPUS scope
    if (!effectivePermission && doc.targetScope === 'ALL_CAMPUS') {
      effectivePermission = 'VIEWER';
    }

    if (!effectivePermission) {
      return this.noAccess();
    }

    return this.buildPermissions(effectivePermission, extraRights, doc.isLocked);
  }

  static async canViewDocument(documentId: string, userId: string, userRoleName: string, userDepartmentId?: string): Promise<boolean> {
    const perms = await this.resolvePermissions(documentId, userId, userRoleName, userDepartmentId);
    return perms.canView;
  }

  static async canEditDocument(documentId: string, userId: string, userRoleName: string, userDepartmentId?: string): Promise<boolean> {
    const perms = await this.resolvePermissions(documentId, userId, userRoleName, userDepartmentId);
    return perms.canEdit;
  }

  private static noAccess(): WorkspacePermissions {
    return {
      canView: false, canEdit: false, canComment: false, canShare: false,
      canDownload: false, canPrint: false, canExport: false, canDelete: false,
      canSubmit: false, canReview: false, canApprove: false, isOwner: false,
    };
  }

  private static ownerPermissions(): WorkspacePermissions {
    return {
      canView: true, canEdit: true, canComment: true, canShare: true,
      canDownload: true, canPrint: true, canExport: true, canDelete: true,
      canSubmit: true, canReview: false, canApprove: false, isOwner: true,
    };
  }

  private static adminPermissions(): WorkspacePermissions {
    return {
      canView: true, canEdit: true, canComment: true, canShare: true,
      canDownload: true, canPrint: true, canExport: true, canDelete: true,
      canSubmit: true, canReview: true, canApprove: true, isOwner: false,
    };
  }

  private static viewerPermissions(): WorkspacePermissions {
    return {
      canView: true, canEdit: false, canComment: false, canShare: false,
      canDownload: false, canPrint: false, canExport: false, canDelete: false,
      canSubmit: false, canReview: false, canApprove: false, isOwner: false,
    };
  }

  private static buildPermissions(
    permission: SharePermission,
    extra: { canDownload: boolean; canPrint: boolean; canExport: boolean; canShare: boolean },
    isLocked: boolean
  ): WorkspacePermissions {
    const canEdit = !isLocked && (permission === 'OWNER' || permission === 'EDITOR');
    const canComment = ['OWNER', 'EDITOR', 'COMMENTER'].includes(permission);

    return {
      canView: true,
      canEdit,
      canComment,
      canShare: permission === 'OWNER' || extra.canShare,
      canDownload: extra.canDownload || ['OWNER', 'EDITOR'].includes(permission),
      canPrint: extra.canPrint || ['OWNER', 'EDITOR'].includes(permission),
      canExport: extra.canExport || ['OWNER', 'EDITOR'].includes(permission),
      canDelete: permission === 'OWNER',
      canSubmit: permission === 'OWNER',
      canReview: false,
      canApprove: false,
      isOwner: permission === 'OWNER',
    };
  }
}
