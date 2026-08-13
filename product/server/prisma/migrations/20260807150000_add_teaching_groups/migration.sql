CREATE TABLE "teaching_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "groupType" TEXT NOT NULL DEFAULT 'COMBINED',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "teaching_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teaching_group_departments" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teaching_group_departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teaching_group_sections" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teaching_group_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teaching_group_students" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teaching_group_students_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "teaching_groups_name_subjectId_facultyId_academicYearId_semester_key"
ON "teaching_groups"("name", "subjectId", "facultyId", "academicYearId", "semester");
CREATE INDEX "teaching_groups_facultyId_idx" ON "teaching_groups"("facultyId");
CREATE INDEX "teaching_groups_subjectId_idx" ON "teaching_groups"("subjectId");
CREATE INDEX "teaching_groups_academicYearId_idx" ON "teaching_groups"("academicYearId");

CREATE UNIQUE INDEX "teaching_group_departments_groupId_departmentId_key"
ON "teaching_group_departments"("groupId", "departmentId");
CREATE INDEX "teaching_group_departments_departmentId_idx" ON "teaching_group_departments"("departmentId");

CREATE UNIQUE INDEX "teaching_group_sections_groupId_sectionId_key"
ON "teaching_group_sections"("groupId", "sectionId");
CREATE INDEX "teaching_group_sections_sectionId_idx" ON "teaching_group_sections"("sectionId");

CREATE UNIQUE INDEX "teaching_group_students_groupId_studentId_key"
ON "teaching_group_students"("groupId", "studentId");
CREATE INDEX "teaching_group_students_studentId_idx" ON "teaching_group_students"("studentId");

ALTER TABLE "teaching_groups"
ADD CONSTRAINT "teaching_groups_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_groups"
ADD CONSTRAINT "teaching_groups_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_groups"
ADD CONSTRAINT "teaching_groups_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_group_departments"
ADD CONSTRAINT "teaching_group_departments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "teaching_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_group_departments"
ADD CONSTRAINT "teaching_group_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_group_sections"
ADD CONSTRAINT "teaching_group_sections_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "teaching_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_group_sections"
ADD CONSTRAINT "teaching_group_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_group_students"
ADD CONSTRAINT "teaching_group_students_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "teaching_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_group_students"
ADD CONSTRAINT "teaching_group_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
