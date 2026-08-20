-- Canonical identity photo reference. Legacy users.profilePhoto remains only as
-- a compatibility fallback while new writes use the governed MediaFile object.
ALTER TABLE "users" ADD COLUMN "profileImageFileId" TEXT;

CREATE INDEX "users_profileImageFileId_idx" ON "users"("profileImageFileId");

ALTER TABLE "users"
ADD CONSTRAINT "users_profileImageFileId_fkey"
FOREIGN KEY ("profileImageFileId") REFERENCES "media_files"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
