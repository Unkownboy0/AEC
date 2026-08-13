ALTER TABLE "iqac_requirements" ADD COLUMN "criterion" TEXT;
ALTER TABLE "iqac_requirements" ADD COLUMN "keyIndicator" TEXT;
ALTER TABLE "iqac_requirements" ADD COLUMN "metricCode" TEXT;
ALTER TABLE "iqac_requirements" ADD COLUMN "sourceType" TEXT;

ALTER TABLE "iqac_evidence" ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'UPLOAD';
ALTER TABLE "iqac_evidence" ADD COLUMN "sourceEntityId" TEXT;
ALTER TABLE "iqac_evidence" ADD COLUMN "repositoryKey" TEXT;
CREATE INDEX "iqac_evidence_repositoryKey_idx" ON "iqac_evidence"("repositoryKey");
