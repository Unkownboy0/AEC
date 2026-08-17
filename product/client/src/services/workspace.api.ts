/**
 * Campus Workspace — API Client
 * Typed API calls for all workspace operations.
 */

import api from '../lib/axios';
import { saveBlobAndOpen } from '../platform/download';

export interface WorkspaceDocument {
  id: string;
  title: string;
  type: 'DOC' | 'SHEET' | 'SLIDE' | 'FORM' | 'QUIZ' | 'PDF' | 'NOTE' | 'REPORT';
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'RETURNED' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  authorId: string;
  authorName?: string;
  departmentId?: string;
  currentVersion: number;
  commentsCount: number;
  versionsCount: number;
  isOwner: boolean;
  targetScope: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDocumentDetail extends WorkspaceDocument {
  contentJson: string;
  contentHtml?: string;
  templateKey?: string;
  tags: string;
  metadata: string;
  permissions: {
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
  };
  versions: WorkspaceVersion[];
  comments: WorkspaceComment[];
  author?: { id: string; email: string; faculty?: { firstName: string; lastName: string } };
  department?: { id: string; name: string; code: string };
}

export interface WorkspaceVersion {
  id: string;
  versionNumber: number;
  contentSnapshot: string;
  changeSummary?: string;
  authorId: string;
  author?: { faculty?: { firstName: string; lastName: string } };
  createdAt: string;
}

export interface WorkspaceComment {
  id: string;
  commentText: string;
  authorId: string;
  author?: { faculty?: { firstName: string; lastName: string } };
  resolved: boolean;
  anchorData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampusDataContext {
  institution?: { name: string; code?: string; address?: string; phone?: string; email?: string };
  department?: { id: string; name: string; code: string; hod?: { name: string; email: string } };
  faculty?: { id: string; name: string; employeeId: string; designation: string; email: string };
  academicYear?: string;
  semester?: string;
  currentDate?: string;
}

// ─── Documents API ────────────────────────────────────────────────────────────

export const workspaceApi = {
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

  // Delete
  deleteDocument: (id: string) =>
    api.delete(`/workspace/documents/${id}`).then((r: any) => r.data),

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
  getDriveItems: (scope: string, parentId?: string) =>
    api.get('/workspace/drive/items', { params: { scope, parentId } }).then((r: any) => r.data.data),

  createDriveItem: (body: { name: string; isFolder?: boolean; parentId?: string; mimeType?: string; fileUrl?: string; fileSize?: number; scope?: string }) =>
    api.post('/workspace/drive/items', body).then((r: any) => r.data.data),

  updateDriveItem: (id: string, body: { name?: string; isStarred?: boolean; isTrashed?: boolean; parentId?: string }) =>
    api.patch(`/workspace/drive/items/${id}`, body).then((r: any) => r.data.data),
};

// ─── Download Helper ──────────────────────────────────────────────────────────

export async function downloadBlob(blob: Blob, filename: string) {
  return saveBlobAndOpen(blob, filename);
}
