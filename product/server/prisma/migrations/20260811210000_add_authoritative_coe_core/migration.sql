CREATE TABLE "exam_type_settings" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "exam_type_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "exam_type_settings_code_key" ON "exam_type_settings"("code");

CREATE TABLE "exam_schedule_entries" (
  "id" TEXT NOT NULL, "examId" TEXT NOT NULL, "subjectId" TEXT NOT NULL, "departmentId" TEXT,
  "programId" TEXT, "sectionId" TEXT, "examDate" TIMESTAMP(3) NOT NULL, "session" TEXT NOT NULL,
  "startTime" TEXT NOT NULL, "endTime" TEXT NOT NULL, "durationMins" INTEGER NOT NULL,
  "instructions" TEXT, "status" TEXT NOT NULL DEFAULT 'DRAFT', "version" INTEGER NOT NULL DEFAULT 1,
  "createdById" TEXT NOT NULL, "publishedById" TEXT, "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_schedule_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exam_schedule_entries_exam_fk" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE,
  CONSTRAINT "exam_schedule_entries_subject_fk" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "exam_schedule_entry_identity_key" ON "exam_schedule_entries"("examId","subjectId","sectionId","examDate","session","version");
CREATE INDEX "exam_schedule_exam_status_date_idx" ON "exam_schedule_entries"("examId","status","examDate","session");
CREATE INDEX "exam_schedule_scope_idx" ON "exam_schedule_entries"("departmentId","programId","sectionId");

CREATE TABLE "exam_timetable_publications" (
  "id" TEXT NOT NULL, "examId" TEXT NOT NULL, "version" INTEGER NOT NULL, "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "revisionReason" TEXT, "previousVersionId" TEXT, "snapshotJson" TEXT NOT NULL, "publishedById" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exam_timetable_publications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exam_timetable_publications_exam_fk" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "exam_timetable_publication_version_key" ON "exam_timetable_publications"("examId","version");
CREATE INDEX "exam_timetable_publication_status_idx" ON "exam_timetable_publications"("examId","status");

CREATE TABLE "exam_rooms" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "building" TEXT NOT NULL, "floor" TEXT,
  "capacity" INTEGER NOT NULL, "blockedSeats" INTEGER NOT NULL DEFAULT 0, "accessibleSeats" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "exam_rooms_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exam_rooms_capacity_check" CHECK ("capacity" > 0 AND "blockedSeats" >= 0 AND "blockedSeats" < "capacity")
);
CREATE UNIQUE INDEX "exam_rooms_code_key" ON "exam_rooms"("code");
CREATE INDEX "exam_rooms_building_active_idx" ON "exam_rooms"("building","active");

CREATE TABLE "exam_seat_allocations" (
  "id" TEXT NOT NULL, "examId" TEXT NOT NULL, "scheduleEntryId" TEXT NOT NULL, "studentId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL, "seatNumber" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "allocatedById" TEXT NOT NULL, "publishedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "exam_seat_allocations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exam_seat_schedule_fk" FOREIGN KEY ("scheduleEntryId") REFERENCES "exam_schedule_entries"("id") ON DELETE CASCADE,
  CONSTRAINT "exam_seat_student_fk" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "exam_seat_room_fk" FOREIGN KEY ("roomId") REFERENCES "exam_rooms"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "exam_seat_student_key" ON "exam_seat_allocations"("scheduleEntryId","studentId");
CREATE UNIQUE INDEX "exam_seat_number_key" ON "exam_seat_allocations"("scheduleEntryId","roomId","seatNumber");
CREATE INDEX "exam_seat_student_status_idx" ON "exam_seat_allocations"("studentId","status");
CREATE INDEX "exam_seat_exam_room_idx" ON "exam_seat_allocations"("examId","scheduleEntryId","roomId");

CREATE TABLE "invigilation_assignments" (
  "id" TEXT NOT NULL, "examId" TEXT NOT NULL, "scheduleEntryId" TEXT NOT NULL, "facultyId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL, "reportingTime" TEXT NOT NULL, "instructions" TEXT, "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "assignedById" TEXT NOT NULL, "publishedAt" TIMESTAMP(3), "replacedById" TEXT, "replacementForId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "invigilation_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invigilation_schedule_fk" FOREIGN KEY ("scheduleEntryId") REFERENCES "exam_schedule_entries"("id") ON DELETE CASCADE,
  CONSTRAINT "invigilation_faculty_fk" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE RESTRICT,
  CONSTRAINT "invigilation_room_fk" FOREIGN KEY ("roomId") REFERENCES "exam_rooms"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "invigilation_schedule_faculty_key" ON "invigilation_assignments"("scheduleEntryId","facultyId");
CREATE INDEX "invigilation_faculty_status_idx" ON "invigilation_assignments"("facultyId","status");
CREATE INDEX "invigilation_exam_room_idx" ON "invigilation_assignments"("examId","roomId");

CREATE TABLE "exam_incidents" (
  "id" TEXT NOT NULL, "examId" TEXT NOT NULL, "scheduleEntryId" TEXT, "roomId" TEXT, "studentId" TEXT,
  "facultyId" TEXT, "type" TEXT NOT NULL, "description" TEXT NOT NULL, "confidential" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL DEFAULT 'OPEN', "reportedById" TEXT NOT NULL, "resolvedById" TEXT, "resolution" TEXT,
  "resolvedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_incidents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exam_incidents_exam_fk" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE
);
CREATE INDEX "exam_incidents_exam_status_idx" ON "exam_incidents"("examId","status");
