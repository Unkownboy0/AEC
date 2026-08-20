/**
 * Campus Workspace API Client
 * Connects frontend editors to the unified backend workspace endpoints.
 */

import api from '../lib/axios';
import { saveBlobAndOpen } from '../platform/download';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DocumentType = 'DOC' | 'SHEET' | 'SLIDE' | 'FORM' | 'QUIZ' | 'PDF' | 'NOTE' | 'REPORT';
export type DocumentStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'RETURNED' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'TRASHED';
export type SharePermission = 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
export type CampusSuiteCategory =
  | 'workspace'
  | 'governance'
  | 'academic'
  | 'operations'
  | 'administrative'
  | 'Productivity'
  | 'Communication'
  | 'Calendar'
  | 'Academic'
  | 'Intelligence'
  | 'Administration'
  | string;

export interface WorkspaceDocument {
  id: string;
  title: string;
  type: DocumentType;
  category: string;
  status: DocumentStatus;
  templateKey?: string;
  targetScope: string;
  tags: string[];
  ownerId: string;
  departmentId?: string;
  authorName?: string;
  isOwner?: boolean;
  commentsCount?: number;
  currentVersion?: number;
  isStarred: boolean;
  viewCount: number;
  lastEditedById?: string;
  currentVersionNumber: number;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    role?: { name: string };
  };
  _count?: {
    comments: number;
    versions: number;
  };
}

export interface WorkspaceDocumentDetail extends WorkspaceDocument {
  contentJson?: any;
  contentHtml?: string;
  targetUsers?: Array<{ userId: string; permission: SharePermission }>;
  targetRoles?: Array<{ roleName: string; permission: SharePermission }>;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canComment: boolean;
    canDelete: boolean;
    canShare: boolean;
    canExport: boolean;
    canSubmit: boolean;
    canReview: boolean;
    canManagePermissions: boolean;
  };
  comments?: WorkspaceComment[];
  versions?: WorkspaceVersion[];
  commentsCount?: number;
  currentVersion?: number;
}

export interface WorkspaceComment {
  id: string;
  documentId: string;
  authorId: string;
  commentText: string;
  anchorData?: any;
  resolved: boolean;
  resolvedById?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    faculty?: { firstName: string; lastName: string };
    role?: { name: string };
  };
}

export interface WorkspaceVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  changeSummary?: string;
  createdById: string;
  createdAt: string;
  contentSnapshot?: any;
  author?: {
    firstName?: string;
    lastName?: string;
    faculty?: { firstName: string; lastName: string };
  };
  creator?: {
    firstName: string;
    lastName: string;
  };
}

export interface CampusDataContext {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    departmentId?: string;
    departmentName?: string;
  };
  institution: {
    name: string;
    code?: string;
    address?: string;
    phone?: string;
    email?: string;
    currentAcademicYear: string;
    currentSemester: string;
    today: string;
    portalUrl: string;
  };
  faculty?: {
    name?: string;
    designation?: string;
    department?: string;
    employeeCode?: string;
    employeeId?: string;
    email?: string;
  };
  department?: {
    name?: string;
    code?: string;
    hodName?: string;
    hod?: { name?: string } | string;
  };
  currentDate?: string;
  academicYear?: string;
  semester?: string;
}

export interface CampusSuiteApplication {
  id: string;
  title: string;
  name: string;
  shortName: string;
  path: string;
  keywords: string[];
  description: string;
  route: string;
  icon: string;
  category: CampusSuiteCategory;
  featureKey: string;
  badge?: string;
  requiredRole?: string[];
}

export interface GovernedDriveFile {
  id: string;
  name: string;
  fileId: string;
  mimeType: string;
  fileSize: number;
  downloadUrl: string;
  isFolder: boolean;
  parentId?: string;
  scope: string;
  ownerId: string;
  isStarred: boolean;
  isTrashed: boolean;
  trashedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Client ──────────────────────────────────────────────────────────────

export const workspaceApi = {
  // Application launcher
  listApplications: () =>
    api.get('/workspace/applications').then((r: any) => r.data.data as CampusSuiteApplication[]),

  // List
  listDocuments: (params?: { type?: string; status?: string; search?: string }) =>
    api.get('/workspace/documents', { params }).then((r: any) => r.data.data as { owned: WorkspaceDocument[]; shared: WorkspaceDocument[] }),

  // Get single
  getDocument: (id: string) =>
    api.get(`/workspace/documents/${id}`).then((r: any) => r.data.data as WorkspaceDocumentDetail),

  // Create
  createDocument: (body: { title: string; type: string; category?: string; contentJson?: any; templateKey?: string; targetScope?: string; tags?: string[] }) =>
    api.post('/workspace/documents', body).then((r: any) => r.data.data as WorkspaceDocument),

  // Update / autosave
  updateDocument: (id: string, body: { title?: string; contentJson?: any; contentHtml?: string; createVersion?: boolean; changeSummary?: string }) =>
    api.put(`/workspace/documents/${id}`, body).then((r: any) => r.data.data),

  // Share
  shareDocument: (id: string, shareEntries: any[], targetScope?: string) =>
    api.post(`/workspace/documents/${id}/share`, { shareEntries, targetScope }).then((r: any) => r.data),

  // Delete (soft / move to trash)
  deleteDocument: (id: string) =>
    api.delete(`/workspace/documents/${id}`).then((r: any) => r.data),

  // Restore document from trash
  restoreDocument: (id: string) =>
    api.post(`/workspace/documents/${id}/restore`).then((r: any) => r.data),

  // Permanent Delete document
  permanentlyDeleteDocument: (id: string) =>
    api.delete(`/workspace/documents/${id}/permanent`).then((r: any) => r.data),

  // Comments
  addComment: (id: string, commentText: string, anchorData?: any) =>
    api.post(`/workspace/documents/${id}/comments`, { commentText, anchorData }).then((r: any) => r.data.data),

  resolveComment: (docId: string, commentId: string) =>
    api.patch(`/workspace/documents/${docId}/comments/${commentId}/resolve`).then((r: any) => r.data),

  // Versions
  getVersions: (id: string) =>
    api.get(`/workspace/documents/${id}/versions`).then((r: any) => r.data.data as WorkspaceVersion[]),

  restoreVersion: (id: string, versionNumber: number) =>
    api.post(`/workspace/documents/${id}/versions/restore`, { versionNumber }).then((r: any) => r.data),

  // Workflow
  submitForWorkflow: (id: string) =>
    api.post(`/workspace/documents/${id}/workflow/submit`).then((r: any) => r.data),

  reviewDocument: (id: string, action: 'APPROVE' | 'RETURN' | 'REJECT', comment?: string) =>
    api.post(`/workspace/documents/${id}/workflow/review`, { action, comment }).then((r: any) => r.data),

  // Export
  exportDocument: (id: string, format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'pptx') =>
    api.get(`/workspace/documents/${id}/export/${format}`, { responseType: 'blob' }).then((r: any) => r.data as Blob),

  // Campus Data
  getCampusDataContext: () =>
    api.get('/workspace/campus-data/context').then((r: any) => r.data.data as CampusDataContext),

  getAvailableDatasets: () =>
    api.get('/workspace/campus-data/datasets').then((r: any) => r.data.data as Array<{ id: string; label: string; fields: string[] }>),

  fetchDataset: (dataset: string, filters?: Record<string, string>) =>
    api.get(`/workspace/campus-data/${dataset}`, { params: filters }).then((r: any) => r.data.data as any[]),

  // Forms
  submitFormResponse: (formId: string, answersJson: any) =>
    api.post(`/workspace/forms/${formId}/responses`, { answersJson }).then((r: any) => r.data),

  getFormResponses: (formId: string) =>
    api.get(`/workspace/forms/${formId}/responses`).then((r: any) => r.data),

  // Drive
  getDriveItems: (scope: string, parentId?: string, options?: { search?: string; trashed?: boolean; action?: string }) =>
    api.get('/workspace/drive/items', { params: { scope, parentId, ...options } }).then((r: any) => r.data.data),

  createDriveItem: (body: { name: string; isFolder?: boolean; parentId?: string; mimeType?: string; fileUrl?: string; fileSize?: number; scope?: string }) =>
    api.post('/workspace/drive/items', body).then((r: any) => r.data.data),

  updateDriveItem: (id: string, body: { name?: string; isStarred?: boolean; isTrashed?: boolean; parentId?: string }) =>
    api.patch(`/workspace/drive/items/${id}`, body).then((r: any) => r.data.data),

  restoreDriveItem: (id: string) =>
    api.patch(`/workspace/drive/items/${id}`, { isTrashed: false }).then((r: any) => r.data.data),

  permanentlyDeleteDriveItem: (itemId: string, fileId: string) =>
    api.delete(`/workspace/drive/files/${fileId}/items/${itemId}/permanent`).then((r: any) => r.data),

  permanentlyDeleteDriveFolder: (itemId: string) =>
    api.delete(`/workspace/drive/folders/${itemId}/permanent`).then((r: any) => r.data),

  uploadDriveFile: (body: { name: string; mimeType: string; base64: string; parentId?: string; scope?: string; sourceModule?: string }) =>
    api.post('/workspace/drive/files/upload', body).then((r: any) => r.data.data as GovernedDriveFile),

  listPickerFiles: (params: { mode: 'DRIVE' | 'RECENT' | 'SHARED' | 'SEARCH'; search?: string; action: string; mimeTypes?: string[]; maxSizeBytes?: number }) =>
    api.get('/workspace/drive/files/picker', {
      params: { ...params, mimeTypes: params.mimeTypes?.join(',') },
    }).then((r: any) => r.data.data as GovernedDriveFile[]),

  attachFileReference: (fileId: string, body: {
    module: string; resourceType: string; resourceId: string; purpose: string;
    authorizationMode?: 'FILE_ACL' | 'PARENT_RESOURCE'; requiredAction?: string;
  }) => api.post(`/workspace/drive/files/${fileId}/references`, body).then((r: any) => r.data.data),

  shareDriveFile: (fileId: string, body: { driveItemId?: string; principalType: string; principalId?: string; accessLevel: string; expiresAt?: string }) =>
    api.post(`/workspace/drive/files/${fileId}/share`, body).then((r: any) => r.data.data),

  revokeDriveFileShare: (fileId: string, grantId: string) =>
    api.delete(`/workspace/drive/files/${fileId}/shares/${grantId}`).then((r: any) => r.data.data),

  shareDriveFolder: (itemId: string, body: { principalType: string; principalId?: string; accessLevel: string; expiresAt?: string }) =>
    api.post(`/workspace/drive/items/${itemId}/share`, body).then((r: any) => r.data.data),

  revokeDriveFolderShare: (itemId: string, grantId: string) =>
    api.delete(`/workspace/drive/items/${itemId}/shares/${grantId}`).then((r: any) => r.data.data),
};

// ─── Download Helper ──────────────────────────────────────────────────────────

export async function downloadBlob(blob: Blob, filename: string) {
  return saveBlobAndOpen(blob, filename);
}
