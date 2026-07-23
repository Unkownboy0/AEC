/*
  Warnings:

  - You are about to drop the column `hasLab` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `subjects` table. All the data in the column will be lost.
  - Added the required column `departmentId` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `sections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programId` to the `sections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYearId` to the `semesters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `semesters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `semesters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programId` to the `semesters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `semesters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programId` to the `subjects` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_academic_years" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_academic_years" ("createdAt", "endDate", "id", "name", "startDate", "status", "updatedAt") SELECT "createdAt", "endDate", "id", "name", "startDate", "status", "updatedAt" FROM "academic_years";
DROP TABLE "academic_years";
ALTER TABLE "new_academic_years" RENAME TO "academic_years";
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");
CREATE TABLE "new_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 160,
    "regulation" TEXT NOT NULL DEFAULT 'R26',
    "coordinator" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "courseOutcomes" TEXT NOT NULL DEFAULT '[]',
    "programId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "courses_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "courses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_courses" ("code", "createdAt", "duration", "id", "name", "programId", "updatedAt") SELECT "code", "createdAt", "duration", "id", "name", "programId", "updatedAt" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE INDEX "courses_programId_idx" ON "courses"("programId");
CREATE INDEX "courses_departmentId_idx" ON "courses"("departmentId");
CREATE UNIQUE INDEX "courses_name_programId_key" ON "courses"("name", "programId");
CREATE TABLE "new_departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'Engineering',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "logo" TEXT,
    "banner" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "officeLocation" TEXT,
    "establishedYear" INTEGER,
    "hodId" TEXT,
    "hodName" TEXT,
    "documents" TEXT NOT NULL DEFAULT '[]',
    "academicYearId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "departments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_departments" ("code", "createdAt", "description", "id", "name", "updatedAt") SELECT "code", "createdAt", "description", "id", "name", "updatedAt" FROM "departments";
DROP TABLE "departments";
ALTER TABLE "new_departments" RENAME TO "departments";
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");
CREATE TABLE "new_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 4,
    "level" TEXT NOT NULL DEFAULT 'UG',
    "credits" INTEGER NOT NULL DEFAULT 160,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "coordinator" TEXT,
    "departmentId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_programs" ("code", "createdAt", "departmentId", "id", "name", "updatedAt") SELECT "code", "createdAt", "departmentId", "id", "name", "updatedAt" FROM "programs";
DROP TABLE "programs";
ALTER TABLE "new_programs" RENAME TO "programs";
CREATE INDEX "programs_departmentId_idx" ON "programs"("departmentId");
CREATE UNIQUE INDEX "programs_name_departmentId_key" ON "programs"("name", "departmentId");
CREATE TABLE "new_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 60,
    "classAdvisor" TEXT,
    "room" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "semesterId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sections_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sections_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sections_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sections" ("createdAt", "id", "name", "semesterId", "updatedAt") SELECT "createdAt", "id", "name", "semesterId", "updatedAt" FROM "sections";
DROP TABLE "sections";
ALTER TABLE "new_sections" RENAME TO "sections";
CREATE INDEX "sections_semesterId_idx" ON "sections"("semesterId");
CREATE INDEX "sections_programId_idx" ON "sections"("programId");
CREATE INDEX "sections_departmentId_idx" ON "sections"("departmentId");
CREATE UNIQUE INDEX "sections_name_semesterId_key" ON "sections"("name", "semesterId");
CREATE TABLE "new_semesters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "credits" INTEGER NOT NULL DEFAULT 20,
    "courseId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "semesters_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "semesters_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "semesters_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_semesters" ("courseId", "createdAt", "id", "number", "updatedAt") SELECT "courseId", "createdAt", "id", "number", "updatedAt" FROM "semesters";
DROP TABLE "semesters";
ALTER TABLE "new_semesters" RENAME TO "semesters";
CREATE INDEX "semesters_courseId_idx" ON "semesters"("courseId");
CREATE INDEX "semesters_programId_idx" ON "semesters"("programId");
CREATE INDEX "semesters_academicYearId_idx" ON "semesters"("academicYearId");
CREATE UNIQUE INDEX "semesters_number_courseId_key" ON "semesters"("number", "courseId");
CREATE TABLE "new_subjects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "theoryHours" INTEGER NOT NULL DEFAULT 3,
    "practicalHours" INTEGER NOT NULL DEFAULT 0,
    "tutorialHours" INTEGER NOT NULL DEFAULT 0,
    "internalMarks" INTEGER NOT NULL DEFAULT 40,
    "externalMarks" INTEGER NOT NULL DEFAULT 60,
    "passingMarks" INTEGER NOT NULL DEFAULT 40,
    "isElective" BOOLEAN NOT NULL DEFAULT false,
    "isLab" BOOLEAN NOT NULL DEFAULT false,
    "isCore" BOOLEAN NOT NULL DEFAULT true,
    "isSkillBased" BOOLEAN NOT NULL DEFAULT false,
    "isOpenElective" BOOLEAN NOT NULL DEFAULT false,
    "isProfessionalElective" BOOLEAN NOT NULL DEFAULT false,
    "subjectCoordinator" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "semesterId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "sectionId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subjects_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subjects_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subjects_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subjects_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_subjects" ("code", "createdAt", "credits", "id", "name", "semesterId", "updatedAt") SELECT "code", "createdAt", "credits", "id", "name", "semesterId", "updatedAt" FROM "subjects";
DROP TABLE "subjects";
ALTER TABLE "new_subjects" RENAME TO "subjects";
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");
CREATE INDEX "subjects_semesterId_idx" ON "subjects"("semesterId");
CREATE INDEX "subjects_departmentId_idx" ON "subjects"("departmentId");
CREATE INDEX "subjects_programId_idx" ON "subjects"("programId");
CREATE INDEX "subjects_sectionId_idx" ON "subjects"("sectionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
