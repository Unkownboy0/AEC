-- CampusOS PostgreSQL persistence recovery.
-- DO NOT run against the live database until DATABASE_BASELINE.md prerequisites pass.
-- This script intentionally covers only structures confirmed absent on 2026-08-12.

BEGIN;

CREATE TABLE IF NOT EXISTS "timetable_slots" (
  "id" TEXT NOT NULL,
  "dayOfWeek" TEXT NOT NULL,
  "slotIndex" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "semesterId" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "facultyId" TEXT NOT NULL,
  "roomNo" TEXT NOT NULL,
  "isLab" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "timetable_slots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "timetable_slots_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "timetable_slots_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "timetable_slots_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "timetable_slots_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "timetable_slots_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "timetable_slots_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "timetable_slots_sectionId_dayOfWeek_slotIndex_key"
  ON "timetable_slots"("sectionId", "dayOfWeek", "slotIndex");
CREATE INDEX IF NOT EXISTS "timetable_slots_facultyId_dayOfWeek_slotIndex_idx"
  ON "timetable_slots"("facultyId", "dayOfWeek", "slotIndex");
CREATE INDEX IF NOT EXISTS "timetable_slots_roomNo_dayOfWeek_slotIndex_idx"
  ON "timetable_slots"("roomNo", "dayOfWeek", "slotIndex");

CREATE TABLE IF NOT EXISTS "iqac_audits" (
  "id" TEXT NOT NULL,
  "auditCode" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "auditType" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "startAt" TIMESTAMP(3),
  "dueAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "iqac_audits_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "iqac_audits_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "iqac_audits_auditCode_key" ON "iqac_audits"("auditCode");
CREATE INDEX IF NOT EXISTS "iqac_audits_createdById_idx" ON "iqac_audits"("createdById");
CREATE INDEX IF NOT EXISTS "iqac_audits_status_idx" ON "iqac_audits"("status");
CREATE INDEX IF NOT EXISTS "iqac_audits_dueAt_idx" ON "iqac_audits"("dueAt");

CREATE TABLE IF NOT EXISTS "iqac_audit_departments" (
  "id" TEXT NOT NULL,
  "auditId" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "iqac_audit_departments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "iqac_audit_departments_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "iqac_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "iqac_audit_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "iqac_audit_departments_auditId_departmentId_key" ON "iqac_audit_departments"("auditId", "departmentId");
CREATE INDEX IF NOT EXISTS "iqac_audit_departments_departmentId_status_idx" ON "iqac_audit_departments"("departmentId", "status");

CREATE TABLE IF NOT EXISTS "iqac_requirements" (
  "id" TEXT NOT NULL,
  "auditId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "iqac_requirements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "iqac_requirements_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "iqac_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "iqac_requirements_auditId_idx" ON "iqac_requirements"("auditId");

CREATE TABLE IF NOT EXISTS "iqac_evidence" (
  "id" TEXT NOT NULL,
  "auditId" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "fileReference" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "isCurrent" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL DEFAULT 'UPLOADED',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "iqac_evidence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "iqac_evidence_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "iqac_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "iqac_evidence_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "iqac_evidence_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "iqac_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "iqac_evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "iqac_evidence_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "iqac_evidence_auditId_departmentId_requirementId_version_key" ON "iqac_evidence"("auditId", "departmentId", "requirementId", "version");
CREATE INDEX IF NOT EXISTS "iqac_evidence_departmentId_status_idx" ON "iqac_evidence"("departmentId", "status");
CREATE INDEX IF NOT EXISTS "iqac_evidence_requirementId_idx" ON "iqac_evidence"("requirementId");

CREATE TABLE IF NOT EXISTS "iqac_observations" (
  "id" TEXT NOT NULL,
  "auditId" TEXT NOT NULL,
  "evidenceId" TEXT,
  "authorId" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'OBSERVATION',
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "iqac_observations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "iqac_observations_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "iqac_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "iqac_observations_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "iqac_evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "iqac_observations_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "iqac_observations_auditId_idx" ON "iqac_observations"("auditId");
CREATE INDEX IF NOT EXISTS "iqac_observations_evidenceId_idx" ON "iqac_observations"("evidenceId");

CREATE TABLE IF NOT EXISTS "iqac_audit_timeline" (
  "id" TEXT NOT NULL,
  "auditId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "iqac_audit_timeline_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "iqac_audit_timeline_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "iqac_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "iqac_audit_timeline_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "iqac_audit_timeline_auditId_createdAt_idx" ON "iqac_audit_timeline"("auditId", "createdAt");

COMMIT;
