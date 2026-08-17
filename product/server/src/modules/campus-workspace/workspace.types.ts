/**
 * Campus Workspace — Shared Types
 * Shared across all workspace modules: Docs, Sheets, Slides, Forms, Quiz, PDF, Notes, Reports
 */

export type DocumentType = 'DOC' | 'SHEET' | 'SLIDE' | 'FORM' | 'QUIZ' | 'PDF' | 'NOTE' | 'REPORT';
export type DocumentStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'RETURNED' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
export type SharePermission = 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
export type DriveScope = 'PERSONAL' | 'DEPARTMENT' | 'COLLEGE' | 'SHARED';

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string;
  departmentName?: string;
}

export interface ShareEntry {
  userId?: string;
  roleName?: string;
  departmentId?: string;
  permission: SharePermission;
  canDownload?: boolean;
  canPrint?: boolean;
  canShare?: boolean;
  canExport?: boolean;
  expiresAt?: string;
}

export interface WorkspacePermissions {
  canView: boolean;
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canDownload: boolean;
  canPrint: boolean;
  canExport: boolean;
  canDelete: boolean;
  canSubmit: boolean;
  canReview: boolean;
  canApprove: boolean;
  isOwner: boolean;
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  contentSnapshot: any;
  changeSummary?: string;
  authorId: string;
  authorName?: string;
  createdAt: string;
}

export interface DocumentComment {
  id: string;
  commentText: string;
  authorId: string;
  authorName?: string;
  resolved: boolean;
  anchorData?: any;
  replies?: DocumentComment[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStage {
  step: string; // HOD, DEAN, IQAC, PRINCIPAL
  reviewerRole: string;
  reviewerId?: string;
  status: 'PENDING' | 'APPROVED' | 'RETURNED' | 'REJECTED';
  comment?: string;
  actedAt?: string;
}

export interface CampusDataContext {
  institution?: {
    name: string;
    logo?: string;
    code?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
    hod?: { name: string; email: string };
  };
  faculty?: {
    id: string;
    name: string;
    employeeId: string;
    designation: string;
    email: string;
  };
  academicYear?: string;
  semester?: string;
  currentDate?: string;
}
