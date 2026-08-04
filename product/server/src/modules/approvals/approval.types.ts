export interface TimelineActor {
  id?: string;
  name: string;
  role: string;
  displayRole: string;
  performedAsRole?: string;
}

export interface TimelineEventDto {
  id: string;
  requestId: string;
  eventType: string;
  title: string;
  fromStage?: string | null;
  toStage?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  actor: TimelineActor;
  delegationId?: string | null;
  remarks?: string | null;
  attachmentId?: string | null;
  metadata?: any;
  sequenceNumber: number;
  createdAt: string;
}

export interface AttachmentDto {
  id: string;
  requestId: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  uploadedAt: string;
  uploadedBy?: {
    id?: string;
    name: string;
    role: string;
  };
  canPreview: boolean;
  canDownload: boolean;
  downloadUrl?: string;
}

export interface CreateTimelineEventInput {
  requestId: string;
  eventType: string;
  fromStage?: string;
  toStage?: string;
  fromStatus?: string;
  toStatus?: string;
  actorUserId?: string;
  actorNameSnapshot: string;
  actorRole: string;
  actorDisplayRole?: string;
  performedAsRole?: string;
  delegationId?: string;
  remarks?: string;
  attachmentId?: string;
  metadataJson?: string;
  idempotencyKey?: string;
}

export interface CreateAttachmentInput {
  requestId: string;
  uploadedByUserId?: string;
  fileName: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  checksum?: string;
}
