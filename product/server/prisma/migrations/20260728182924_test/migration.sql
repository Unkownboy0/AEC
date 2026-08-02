-- AlterTable
ALTER TABLE "system_notifications" ADD COLUMN "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admissionNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dob" DATETIME NOT NULL,
    "dateOfAdmission" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "religion" TEXT,
    "category" TEXT,
    "medicalDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "scholarship" TEXT,
    "parentName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "parentEmail" TEXT,
    "parentOccupation" TEXT,
    "currentAddress" TEXT NOT NULL,
    "permanentAddress" TEXT NOT NULL,
    "documents" TEXT NOT NULL DEFAULT '[]',
    "timeline" TEXT NOT NULL DEFAULT '[]',
    "promoted" BOOLEAN NOT NULL DEFAULT false,
    "preferredName" TEXT,
    "altPhone" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "country" TEXT,
    "pinCode" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "linkedin" TEXT,
    "github" TEXT,
    "portfolio" TEXT,
    "technicalSkills" TEXT,
    "softSkills" TEXT,
    "languagesKnown" TEXT,
    "certifications" TEXT,
    "resumeUrl" TEXT,
    "careerObjective" TEXT,
    "areasOfInterest" TEXT,
    "academicYearId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programDepartmentId" TEXT,
    "programId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "hostelId" TEXT,
    "roomNo" TEXT,
    "transportRouteId" TEXT,
    "transportStopId" TEXT,
    "userId" TEXT,
    "mentorId" TEXT,
    "faculty_id" TEXT,
    "class_advisor_id" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "students_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_programDepartmentId_fkey" FOREIGN KEY ("programDepartmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "students_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "hostel_buildings" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "students_transportRouteId_fkey" FOREIGN KEY ("transportRouteId") REFERENCES "transport_routes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "students_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "faculties" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "dateOfJoining" DATETIME NOT NULL,
    "designation" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "documents" TEXT NOT NULL DEFAULT '[]',
    "subjectMappings" TEXT NOT NULL DEFAULT '[]',
    "departmentId" TEXT NOT NULL,
    "userId" TEXT,
    "gender" TEXT DEFAULT 'Male',
    "bloodGroup" TEXT,
    "maritalStatus" TEXT,
    "nationality" TEXT,
    "aadhaarNo" TEXT,
    "panNo" TEXT,
    "personalEmail" TEXT,
    "personalPhone" TEXT,
    "alternatePhone" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "country" TEXT,
    "pincode" TEXT,
    "program" TEXT DEFAULT 'B.Tech',
    "employmentType" TEXT DEFAULT 'FULL_TIME',
    "specialization" TEXT,
    "highestDegree" TEXT,
    "university" TEXT,
    "researchArea" TEXT,
    "facultyType" TEXT DEFAULT 'REGULAR',
    "officeRoom" TEXT,
    "officeExtension" TEXT,
    "highestQualification" TEXT,
    "additionalCertifications" TEXT DEFAULT '[]',
    "researchInterests" TEXT DEFAULT '[]',
    "publications" TEXT DEFAULT '[]',
    "patents" TEXT DEFAULT '[]',
    "books" TEXT DEFAULT '[]',
    "industryExperience" INTEGER DEFAULT 0,
    "professionalMemberships" TEXT DEFAULT '[]',
    "linkedinProfile" TEXT,
    "googleScholar" TEXT,
    "orcidId" TEXT,
    "portfolioWebsite" TEXT,
    "notificationPrefs" TEXT DEFAULT '{"email":true,"sms":true,"push":true,"assignmentAlerts":true,"attendanceAlerts":true,"leaveAlerts":true,"meetingAlerts":true}',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "faculties_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "faculties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DAILY',
    "remarks" TEXT,
    "studentId" TEXT,
    "facultyId" TEXT,
    "subjectId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendance_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INTERNAL',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "schedule" TEXT NOT NULL DEFAULT '[]',
    "hallAllocation" TEXT NOT NULL DEFAULT '[]',
    "invigilators" TEXT NOT NULL DEFAULT '[]',
    "academicYearId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "facultyId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "exams_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exams_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exams_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exams_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "internalMarks" INTEGER NOT NULL DEFAULT 0,
    "externalMarks" INTEGER NOT NULL DEFAULT 0,
    "practicalMarks" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT NOT NULL DEFAULT 'F',
    "gpa" REAL NOT NULL DEFAULT 0.0,
    "cgpa" REAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "marks_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fee_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "fee_bills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "scholarshipDiscount" REAL NOT NULL DEFAULT 0.0,
    "fine" REAL NOT NULL DEFAULT 0.0,
    "paidAmount" REAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "billingDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paymentHistory" TEXT NOT NULL DEFAULT '[]',
    "receipts" TEXT NOT NULL DEFAULT '[]',
    "studentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fee_bills_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fee_bills_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "fee_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "library_books" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "availableCopies" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT,
    "issues" TEXT NOT NULL DEFAULT '[]',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transport_routes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeName" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT NOT NULL,
    "stops" TEXT NOT NULL DEFAULT '[]',
    "monthlyFee" REAL NOT NULL DEFAULT 0.0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "hostel_buildings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BOYS',
    "description" TEXT,
    "rooms" TEXT NOT NULL DEFAULT '[]',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "replies" TEXT NOT NULL DEFAULT '[]',
    "facultyId" TEXT,
    "studentId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tickets_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tickets_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING_MENTOR',
    "currentStep" TEXT NOT NULL DEFAULT 'MENTOR',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "mentor_id" TEXT,
    "faculty_id" TEXT,
    "class_advisor_id" TEXT,
    "department_id" TEXT,
    "faculty_requester_id" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflow_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflow_requests_faculty_requester_id_fkey" FOREIGN KEY ("faculty_requester_id") REFERENCES "faculties" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comment" TEXT,
    "actionById" TEXT NOT NULL,
    "actionByName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workflow_history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "workflow_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "timetable_slots" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "timetable_slots_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "timetable_slots_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "timetable_slots_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "timetable_slots_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "timetable_slots_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "timetable_slots_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "counseling_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "actionTaken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "counseling_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "counseling_records_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "faculties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "placement_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentRoll" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "package" REAL NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "driveDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Layers',
    "componentKey" TEXT NOT NULL,
    "permissionRequired" TEXT,
    "parentPath" TEXT,
    "group" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "subject_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facultyId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "isMentor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subject_assignments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subject_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subject_assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subject_assignments_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subject_assignments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "security_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "description" TEXT NOT NULL,
    "statusCode" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_messages_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME NOT NULL,
    "maxMarks" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "facultyId" TEXT NOT NULL,
    "subjectId" TEXT,
    "sectionId" TEXT,
    "semesterId" TEXT,
    "programId" TEXT,
    "departmentId" TEXT,
    "academicYearId" TEXT,
    "targetSubject" TEXT,
    "targetClass" TEXT,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assignments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignments_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "marksObtained" INTEGER,
    "feedback" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "facultyId" TEXT,
    "departmentId" TEXT,
    "semesterId" TEXT,
    "sectionId" TEXT,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assignment_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignment_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mentor_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mentor_assignments_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "faculties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mentor_assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mentor_assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "mentor_assignments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "mentor_assignments_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "mentor_assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "mentor_assignments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "internships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "role" TEXT,
    "duration" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "studentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "internships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "internship_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "internshipId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "internship_documents_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "internships" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "internship_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "receiverRole" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentType" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "sentTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredTime" DATETIME,
    "readTime" DATETIME,
    "deletedByFaculty" BOOLEAN NOT NULL DEFAULT false,
    "deletedByStudent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chat_messages_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chat_messages_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hod_circulars" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "description" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "images" TEXT NOT NULL DEFAULT '[]',
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "departmentId" TEXT NOT NULL,
    "publishedById" TEXT NOT NULL,
    CONSTRAINT "hod_circulars_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hod_circulars_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hod_circular_read_trackers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circularId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DELIVERED',
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hod_circular_read_trackers_circularId_fkey" FOREIGN KEY ("circularId") REFERENCES "hod_circulars" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hod_circular_read_trackers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "placement_drives" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "industry" TEXT,
    "hrContact" TEXT,
    "package" REAL NOT NULL,
    "role" TEXT NOT NULL,
    "eligibilityCgpa" REAL NOT NULL DEFAULT 0,
    "eligibilityDept" TEXT,
    "eligibilityYear" TEXT,
    "maxArrears" INTEGER NOT NULL DEFAULT 0,
    "minAttendance" REAL NOT NULL DEFAULT 75,
    "driveDate" DATETIME NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "placement_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driveId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "offerLetterUrl" TEXT,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "placement_applications_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "placement_drives" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "placement_applications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "digital_id_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "timetable_publishes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "departmentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "admission_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT,
    "category" TEXT,
    "academicMarks" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "scholarshipStatus" TEXT NOT NULL DEFAULT 'NONE',
    "scholarshipType" TEXT,
    "scholarshipAmount" REAL,
    "documents" TEXT NOT NULL DEFAULT '[]',
    "verificationHistory" TEXT NOT NULL DEFAULT '[]',
    "waitlistNumber" INTEGER,
    "counsellingStatus" TEXT NOT NULL DEFAULT 'NOT_SCHEDULED',
    "counsellingSessionId" TEXT,
    "counsellingNotes" TEXT,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "admission_applications_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "admission_applications_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scholarship_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "clarificationNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "student_enquiries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentName" TEXT NOT NULL,
    "parentName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedCounsellor" TEXT,
    "followUpDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "counselling_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "dateTime" DATETIME NOT NULL,
    "counsellor" TEXT NOT NULL,
    "notes" TEXT,
    "studentIds" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "department_intakes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "departmentId" TEXT NOT NULL,
    "intakeCapacity" INTEGER NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "filledSeats" INTEGER NOT NULL DEFAULT 0,
    "reservedSeats" INTEGER NOT NULL DEFAULT 0,
    "managementQuotaIntake" INTEGER NOT NULL DEFAULT 0,
    "managementQuotaFilled" INTEGER NOT NULL DEFAULT 0,
    "governmentQuotaIntake" INTEGER NOT NULL DEFAULT 0,
    "governmentQuotaFilled" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "department_intakes_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certificate_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "issuedUrl" TEXT,
    "verificationHash" TEXT,
    "qrCodeUrl" TEXT,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "gamification_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "attendanceStreak" INTEGER NOT NULL DEFAULT 0,
    "assignmentStreak" INTEGER NOT NULL DEFAULT 0,
    "quizStreak" INTEGER NOT NULL DEFAULT 0,
    "badges" TEXT NOT NULL DEFAULT '[]',
    "unlockedRewards" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reward_store_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpCost" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 100,
    "icon" TEXT NOT NULL DEFAULT 'Gift',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "reward_redemptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "xpSpent" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REDEEMED',
    "code" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT,
    "facultyId" TEXT NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 30,
    "totalMarks" INTEGER NOT NULL DEFAULT 100,
    "passMarks" INTEGER NOT NULL DEFAULT 40,
    "negativeMark" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "startTime" DATETIME,
    "endTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT NOT NULL DEFAULT '[]',
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "marks" INTEGER NOT NULL DEFAULT 5,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "totalMarks" REAL NOT NULL DEFAULT 100,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "advisor_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "topic" TEXT NOT NULL,
    "meetingUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "master_timetables" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "academicYear" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" DATETIME,
    "publishedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "master_timetables_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "master_timetable_slots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "masterTimetableId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "roomNo" TEXT,
    "building" TEXT,
    "isLab" BOOLEAN NOT NULL DEFAULT false,
    "labName" TEXT,
    CONSTRAINT "master_timetable_slots_masterTimetableId_fkey" FOREIGN KEY ("masterTimetableId") REFERENCES "master_timetables" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "timetable_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "masterTimetableId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshotData" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "timetable_versions_masterTimetableId_fkey" FOREIGN KEY ("masterTimetableId") REFERENCES "master_timetables" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "timetable_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "masterTimetableId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "performedByRole" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "timetable_audit_logs_masterTimetableId_fkey" FOREIGN KEY ("masterTimetableId") REFERENCES "master_timetables" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "roleId" TEXT NOT NULL,
    "lockedUntil" DATETIME,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false,
    "profilePhoto" TEXT,
    "passwordChangedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "email", "firstName", "id", "lastName", "passwordHash", "roleId", "status", "updatedAt") SELECT "createdAt", "email", "firstName", "id", "lastName", "passwordHash", "roleId", "status", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_roleId_idx" ON "users"("roleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "students_admissionNo_key" ON "students"("admissionNo");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE INDEX "students_admissionNo_idx" ON "students"("admissionNo");

-- CreateIndex
CREATE INDEX "students_academicYearId_idx" ON "students"("academicYearId");

-- CreateIndex
CREATE INDEX "students_departmentId_idx" ON "students"("departmentId");

-- CreateIndex
CREATE INDEX "students_programId_idx" ON "students"("programId");

-- CreateIndex
CREATE INDEX "students_courseId_idx" ON "students"("courseId");

-- CreateIndex
CREATE INDEX "students_semesterId_idx" ON "students"("semesterId");

-- CreateIndex
CREATE INDEX "students_sectionId_idx" ON "students"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_employeeId_key" ON "faculties"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_email_key" ON "faculties"("email");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_userId_key" ON "faculties"("userId");

-- CreateIndex
CREATE INDEX "faculties_employeeId_idx" ON "faculties"("employeeId");

-- CreateIndex
CREATE INDEX "faculties_departmentId_idx" ON "faculties"("departmentId");

-- CreateIndex
CREATE INDEX "attendance_date_idx" ON "attendance"("date");

-- CreateIndex
CREATE INDEX "attendance_studentId_idx" ON "attendance"("studentId");

-- CreateIndex
CREATE INDEX "attendance_facultyId_idx" ON "attendance"("facultyId");

-- CreateIndex
CREATE INDEX "exams_academicYearId_idx" ON "exams"("academicYearId");

-- CreateIndex
CREATE INDEX "exams_courseId_idx" ON "exams"("courseId");

-- CreateIndex
CREATE INDEX "exams_semesterId_idx" ON "exams"("semesterId");

-- CreateIndex
CREATE INDEX "marks_studentId_idx" ON "marks"("studentId");

-- CreateIndex
CREATE INDEX "marks_subjectId_idx" ON "marks"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "marks_examId_studentId_subjectId_key" ON "marks"("examId", "studentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_categories_name_key" ON "fee_categories"("name");

-- CreateIndex
CREATE INDEX "fee_bills_studentId_idx" ON "fee_bills"("studentId");

-- CreateIndex
CREATE INDEX "fee_bills_categoryId_idx" ON "fee_bills"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "library_books_isbn_key" ON "library_books"("isbn");

-- CreateIndex
CREATE INDEX "library_books_isbn_idx" ON "library_books"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "transport_routes_routeName_key" ON "transport_routes"("routeName");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_buildings_name_key" ON "hostel_buildings"("name");

-- CreateIndex
CREATE INDEX "subject_assignments_facultyId_idx" ON "subject_assignments"("facultyId");

-- CreateIndex
CREATE INDEX "subject_assignments_subjectId_idx" ON "subject_assignments"("subjectId");

-- CreateIndex
CREATE INDEX "subject_assignments_sectionId_idx" ON "subject_assignments"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_assignments_facultyId_subjectId_sectionId_semesterId_key" ON "subject_assignments"("facultyId", "subjectId", "sectionId", "semesterId");

-- CreateIndex
CREATE INDEX "security_audit_logs_userId_idx" ON "security_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "security_audit_logs_action_idx" ON "security_audit_logs"("action");

-- CreateIndex
CREATE INDEX "security_audit_logs_module_idx" ON "security_audit_logs"("module");

-- CreateIndex
CREATE INDEX "security_audit_logs_createdAt_idx" ON "security_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "ai_messages_studentId_idx" ON "ai_messages"("studentId");

-- CreateIndex
CREATE INDEX "ai_messages_sessionId_idx" ON "ai_messages"("sessionId");

-- CreateIndex
CREATE INDEX "assignments_facultyId_idx" ON "assignments"("facultyId");

-- CreateIndex
CREATE INDEX "assignments_subjectId_idx" ON "assignments"("subjectId");

-- CreateIndex
CREATE INDEX "assignments_sectionId_idx" ON "assignments"("sectionId");

-- CreateIndex
CREATE INDEX "assignments_semesterId_idx" ON "assignments"("semesterId");

-- CreateIndex
CREATE INDEX "assignment_submissions_assignmentId_idx" ON "assignment_submissions"("assignmentId");

-- CreateIndex
CREATE INDEX "assignment_submissions_studentId_idx" ON "assignment_submissions"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_assignmentId_studentId_key" ON "assignment_submissions"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "internships_studentId_idx" ON "internships"("studentId");

-- CreateIndex
CREATE INDEX "internship_documents_internshipId_idx" ON "internship_documents"("internshipId");

-- CreateIndex
CREATE INDEX "internship_documents_studentId_idx" ON "internship_documents"("studentId");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_idx" ON "chat_messages"("conversationId");

-- CreateIndex
CREATE INDEX "chat_messages_facultyId_idx" ON "chat_messages"("facultyId");

-- CreateIndex
CREATE INDEX "chat_messages_studentId_idx" ON "chat_messages"("studentId");

-- CreateIndex
CREATE INDEX "hod_circulars_departmentId_idx" ON "hod_circulars"("departmentId");

-- CreateIndex
CREATE INDEX "hod_circulars_publishedById_idx" ON "hod_circulars"("publishedById");

-- CreateIndex
CREATE INDEX "hod_circular_read_trackers_circularId_idx" ON "hod_circular_read_trackers"("circularId");

-- CreateIndex
CREATE INDEX "hod_circular_read_trackers_userId_idx" ON "hod_circular_read_trackers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "hod_circular_read_trackers_circularId_userId_key" ON "hod_circular_read_trackers"("circularId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "placement_applications_driveId_studentId_key" ON "placement_applications"("driveId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "admission_applications_applicationNo_key" ON "admission_applications"("applicationNo");

-- CreateIndex
CREATE UNIQUE INDEX "department_intakes_departmentId_key" ON "department_intakes"("departmentId");

-- CreateIndex
CREATE INDEX "certificate_requests_studentId_status_idx" ON "certificate_requests"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_profiles_studentId_key" ON "gamification_profiles"("studentId");

-- CreateIndex
CREATE INDEX "quiz_attempts_studentId_quizId_idx" ON "quiz_attempts"("studentId", "quizId");

-- CreateIndex
CREATE UNIQUE INDEX "master_timetables_academicYear_semester_departmentId_programId_section_version_key" ON "master_timetables"("academicYear", "semester", "departmentId", "programId", "section", "version");

-- CreateIndex
CREATE INDEX "master_timetable_slots_facultyId_dayOfWeek_periodNumber_idx" ON "master_timetable_slots"("facultyId", "dayOfWeek", "periodNumber");

-- CreateIndex
CREATE INDEX "master_timetable_slots_roomNo_dayOfWeek_periodNumber_idx" ON "master_timetable_slots"("roomNo", "dayOfWeek", "periodNumber");

-- CreateIndex
CREATE INDEX "login_history_userId_status_idx" ON "login_history"("userId", "status");

-- CreateIndex
CREATE INDEX "login_history_createdAt_idx" ON "login_history"("createdAt");

-- CreateIndex
CREATE INDEX "user_activity_logs_userId_idx" ON "user_activity_logs"("userId");

-- CreateIndex
CREATE INDEX "user_activity_logs_action_idx" ON "user_activity_logs"("action");

-- CreateIndex
CREATE INDEX "user_activity_logs_createdAt_idx" ON "user_activity_logs"("createdAt");
