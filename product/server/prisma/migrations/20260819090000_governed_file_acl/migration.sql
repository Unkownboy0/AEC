-- Phase 1: additive governed-file identity and ACL foundation.
-- Legacy path/fileUrl columns remain intact for deterministic compatibility.

ALTER TABLE "media_files"
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "originalName" TEXT,
  ADD COLUMN "safeName" TEXT,
  ADD COLUMN "checksum" TEXT,
  ADD COLUMN "ownerUserId" TEXT,
  ADD COLUMN "createdByUserId" TEXT,
  ADD COLUMN "sourceModule" TEXT NOT NULL DEFAULT 'MEDIA',
  ADD COLUMN "currentVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Normalize only paths that can be converted deterministically. New writes always
-- provide storageKey; unresolved historical paths continue through the legacy path.
UPDATE "media_files"
SET "storageKey" = regexp_replace(
  regexp_replace(replace("path", E'\\', '/'), '^.*?/uploads/', ''),
  '^/+',
  ''
)
WHERE "path" IS NOT NULL
  AND "path" <> ''
  AND "path" !~* '^https?://';

ALTER TABLE "campus_drive_items" ADD COLUMN "fileId" TEXT;

CREATE TABLE "governed_file_access_grants" (
  "id" TEXT NOT NULL,
  "fileId" TEXT,
  "driveItemId" TEXT,
  "principalType" TEXT NOT NULL,
  "principalId" TEXT,
  "accessLevel" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "inheritedFromItemId" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "governed_file_access_grants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "governed_file_access_grants_target_check" CHECK ("fileId" IS NOT NULL OR "driveItemId" IS NOT NULL),
  CONSTRAINT "governed_file_access_grants_principal_check" CHECK (
    "principalType" IN ('SPECIFIC_USER', 'ROLE', 'WORKSPACE', 'DEPARTMENT', 'ALL_INSTITUTION')
  ),
  CONSTRAINT "governed_file_access_grants_level_check" CHECK (
    "accessLevel" IN ('VIEW', 'DOWNLOAD', 'COMMENT', 'EDIT', 'MANAGE')
  )
);

CREATE TABLE "governed_file_references" (
  "id" TEXT NOT NULL,
  "fileId" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "authorizationMode" TEXT NOT NULL DEFAULT 'FILE_ACL',
  "createdByUserId" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "governed_file_references_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "governed_file_references_mode_check" CHECK ("authorizationMode" IN ('FILE_ACL', 'PARENT_RESOURCE'))
);

CREATE TABLE "governed_file_versions" (
  "id" TEXT NOT NULL,
  "fileId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "checksum" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "changeSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "governed_file_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_files_storageKey_key" ON "media_files"("storageKey");
CREATE INDEX "media_files_ownerUserId_idx" ON "media_files"("ownerUserId");
CREATE INDEX "media_files_createdByUserId_idx" ON "media_files"("createdByUserId");
CREATE INDEX "media_files_checksum_idx" ON "media_files"("checksum");
CREATE INDEX "media_files_deletedAt_idx" ON "media_files"("deletedAt");
CREATE INDEX "campus_drive_items_fileId_idx" ON "campus_drive_items"("fileId");
CREATE INDEX "governed_file_access_grants_fileId_revokedAt_expiresAt_idx" ON "governed_file_access_grants"("fileId", "revokedAt", "expiresAt");
CREATE INDEX "governed_file_access_grants_driveItemId_revokedAt_expiresAt_idx" ON "governed_file_access_grants"("driveItemId", "revokedAt", "expiresAt");
CREATE INDEX "governed_file_access_grants_principalType_principalId_idx" ON "governed_file_access_grants"("principalType", "principalId");
CREATE UNIQUE INDEX "governed_file_references_fileId_module_resourceType_resourceId_purpose_key" ON "governed_file_references"("fileId", "module", "resourceType", "resourceId", "purpose");
CREATE INDEX "governed_file_references_resourceType_resourceId_idx" ON "governed_file_references"("resourceType", "resourceId");
CREATE INDEX "governed_file_references_fileId_deletedAt_idx" ON "governed_file_references"("fileId", "deletedAt");
CREATE UNIQUE INDEX "governed_file_versions_fileId_versionNumber_key" ON "governed_file_versions"("fileId", "versionNumber");
CREATE INDEX "governed_file_versions_fileId_createdAt_idx" ON "governed_file_versions"("fileId", "createdAt");

ALTER TABLE "campus_drive_items"
  ADD CONSTRAINT "campus_drive_items_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "media_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "governed_file_access_grants"
  ADD CONSTRAINT "governed_file_access_grants_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "governed_file_access_grants"
  ADD CONSTRAINT "governed_file_access_grants_driveItemId_fkey" FOREIGN KEY ("driveItemId") REFERENCES "campus_drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "governed_file_references"
  ADD CONSTRAINT "governed_file_references_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "media_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "governed_file_versions"
  ADD CONSTRAINT "governed_file_versions_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "media_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
