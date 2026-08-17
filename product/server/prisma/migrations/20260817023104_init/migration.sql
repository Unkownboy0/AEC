-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "designation" TEXT,
    "departmentId" TEXT,
    "reportingManagerId" TEXT,
    "workspaces" TEXT,
    "activeWorkspace" TEXT,
    "approvalAuthority" BOOLEAN NOT NULL DEFAULT false,
    "dashboardConfig" TEXT,
    "notificationPreferences" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "bloodGroup" TEXT,
    "digitalSignature" TEXT,
    "qrCode" TEXT,
    "aadhaarNumber" TEXT,
    "emergencyContact" TEXT,
    "qualification" TEXT,
    "experience" TEXT,
    "skills" TEXT,
    "certificates" TEXT,
    "profileCompletion" INTEGER NOT NULL DEFAULT 0,
    "joiningDate" TIMESTAMP(3),
    "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "loginStatus" TEXT NOT NULL DEFAULT 'OFFLINE',
    "activityTimeline" TEXT,
    "designationId" TEXT,
    "parentRoleId" TEXT,
    "roleId" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false,
    "profilePhoto" TEXT,
    "passwordChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "username_counters" (
    "id" TEXT NOT NULL,
    "rolePrefix" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "username_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleCode" TEXT,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "icon" TEXT NOT NULL DEFAULT 'Shield',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "hierarchy" INTEGER NOT NULL DEFAULT 99,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "departmentId" TEXT,
    "dashboardConfig" TEXT,
    "sidebarConfig" TEXT,
    "moduleAccess" TEXT,
    "approvalLevels" TEXT,
    "reportAccess" TEXT,
    "workspaceAccess" TEXT,
    "notificationSettings" TEXT,
    "searchScope" TEXT DEFAULT 'EVERYONE',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "hierarchy" INTEGER NOT NULL DEFAULT 99,
    "departmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ACADEMIC',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "additionalPermissions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_committees" (
    "userId" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "roleInCommittee" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_committees_pkey" PRIMARY KEY ("userId","committeeId")
);

-- CreateTable
CREATE TABLE "permission_delegations" (
    "id" TEXT NOT NULL,
    "delegatorId" TEXT NOT NULL,
    "delegateeId" TEXT NOT NULL,
    "roleId" TEXT,
    "customPermissions" TEXT,
    "reason" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_workspaces" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceCode" TEXT NOT NULL,
    "workspaceName" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rbac_audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "affectedUsers" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rbac_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_audits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT,
    "permissionId" TEXT,
    "action" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "endpoint" TEXT,
    "result" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL DEFAULT 'GENERAL',
    "action" TEXT NOT NULL DEFAULT 'VIEW',
    "description" TEXT,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loginTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutTime" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
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
    "hodUserId" TEXT,
    "hodName" TEXT,
    "documents" TEXT NOT NULL DEFAULT '[]',
    "academicYearId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 4,
    "level" TEXT NOT NULL DEFAULT 'UG',
    "credits" INTEGER NOT NULL DEFAULT 160,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "coordinator" TEXT,
    "departmentId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
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
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "credits" INTEGER NOT NULL DEFAULT 20,
    "courseId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 60,
    "classAdvisor" TEXT,
    "room" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "semesterId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
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
    "regulationId" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "assignedFacultyId" TEXT,
    "assignedHodId" TEXT,
    "assignedDeanId" TEXT,
    "assignedCoordinatorId" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "semesterId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "sectionId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "effectiveYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_outcomes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_specific_outcomes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_specific_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_outcomes" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bloomLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_po_mappings" (
    "id" TEXT NOT NULL,
    "coId" TEXT NOT NULL,
    "targetCode" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "correlationLevel" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "co_po_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_units" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalHours" INTEGER NOT NULL DEFAULT 9,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_topics" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "topicNumber" TEXT,
    "title" TEXT NOT NULL,
    "subTopics" TEXT,
    "learningOutcomes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_materials" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "unitId" TEXT,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER,
    "authorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_bank_items" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "unitId" TEXT,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT,
    "answer" TEXT,
    "bloomLevel" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "year" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_bank_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_experiments" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "expNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "equipment" TEXT,
    "procedure" TEXT,
    "vivaQuestions" TEXT,
    "manualUrl" TEXT,
    "simulationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_version_logs" (
    "id" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "changeSummary" TEXT NOT NULL,
    "snapshotData" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_version_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_records" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "extra" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "device" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_logs" (
    "id" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "backupType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_files" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "folder" TEXT NOT NULL DEFAULT '/',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3),
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_template_mappings" (
    "templateId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "permission_template_mappings_pkey" PRIMARY KEY ("templateId","permissionId")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "admissionNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dob" TIMESTAMP(3) NOT NULL,
    "dateOfAdmission" TIMESTAMP(3) NOT NULL,
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
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "dateOfJoining" TIMESTAMP(3) NOT NULL,
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
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DAILY',
    "remarks" TEXT,
    "studentId" TEXT,
    "facultyId" TEXT,
    "subjectId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INTERNAL',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "schedule" TEXT NOT NULL DEFAULT '[]',
    "hallAllocation" TEXT NOT NULL DEFAULT '[]',
    "invigilators" TEXT NOT NULL DEFAULT '[]',
    "academicYearId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "facultyId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marks" (
    "id" TEXT NOT NULL,
    "internalMarks" INTEGER NOT NULL DEFAULT 0,
    "externalMarks" INTEGER NOT NULL DEFAULT 0,
    "practicalMarks" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT NOT NULL DEFAULT 'F',
    "gpa" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "cgpa" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_type_settings" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_type_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_schedule_entries" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "departmentId" TEXT,
    "programId" TEXT,
    "sectionId" TEXT,
    "examDate" TIMESTAMP(3) NOT NULL,
    "session" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "durationMins" INTEGER NOT NULL,
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_schedule_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_timetable_publications" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "revisionReason" TEXT,
    "previousVersionId" TEXT,
    "snapshotJson" TEXT NOT NULL,
    "publishedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_timetable_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "floor" TEXT,
    "capacity" INTEGER NOT NULL,
    "blockedSeats" INTEGER NOT NULL DEFAULT 0,
    "accessibleSeats" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_seat_allocations" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "scheduleEntryId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "allocatedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_seat_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invigilation_assignments" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "scheduleEntryId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "reportingTime" TEXT NOT NULL,
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "assignedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "replacementForId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invigilation_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_incidents" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "scheduleEntryId" TEXT,
    "roomId" TEXT,
    "studentId" TEXT,
    "facultyId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidential" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reportedById" TEXT NOT NULL,
    "resolvedById" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_bills" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "scholarshipDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "fine" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "billingDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentHistory" TEXT NOT NULL DEFAULT '[]',
    "receipts" TEXT NOT NULL DEFAULT '[]',
    "invoiceNumber" TEXT,
    "academicYearLabel" TEXT,
    "semesterLabel" TEXT,
    "allowPartialPayment" BOOLEAN NOT NULL DEFAULT true,
    "studentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payments" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT,
    "transactionId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "provider" TEXT,
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "externalReference" TEXT,
    "proofUrl" TEXT,
    "paymentDate" TIMESTAMP(3),
    "remarks" TEXT,
    "rejectionReason" TEXT,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "billId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" TEXT NOT NULL,
    "structureNumber" TEXT NOT NULL,
    "academicYearLabel" TEXT NOT NULL,
    "programId" TEXT,
    "departmentId" TEXT,
    "year" INTEGER,
    "semester" INTEGER,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "installmentOptions" TEXT,
    "lateFeeRules" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_ledger_entries" (
    "id" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "description" TEXT NOT NULL,
    "paymentId" TEXT,
    "billId" TEXT,
    "studentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "metadataJson" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_closings" (
    "id" TEXT NOT NULL,
    "closingNumber" TEXT NOT NULL,
    "closingDate" DATE NOT NULL,
    "accountantId" TEXT NOT NULL,
    "expectedTotal" DOUBLE PRECISION NOT NULL,
    "actualTotal" DOUBLE PRECISION NOT NULL,
    "onlineTotal" DOUBLE PRECISION NOT NULL,
    "offlineTotal" DOUBLE PRECISION NOT NULL,
    "cashTotal" DOUBLE PRECISION NOT NULL,
    "upiTotal" DOUBLE PRECISION NOT NULL,
    "bankTotal" DOUBLE PRECISION NOT NULL,
    "chequeTotal" DOUBLE PRECISION NOT NULL,
    "ddTotal" DOUBLE PRECISION NOT NULL,
    "refundTotal" DOUBLE PRECISION NOT NULL,
    "adjustmentTotal" DOUBLE PRECISION NOT NULL,
    "difference" DOUBLE PRECISION NOT NULL,
    "cashCount" DOUBLE PRECISION,
    "remarks" TEXT,
    "supportUrl" TEXT,
    "snapshotJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "returnReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_closings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_closing_approvals" (
    "id" TEXT NOT NULL,
    "closingId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "actorId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_closing_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "amount" DOUBLE PRECISION NOT NULL,
    "originalAmount" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "remarks" TEXT,
    "supportUrl" TEXT,
    "metadataJson" TEXT,
    "studentId" TEXT,
    "billId" TEXT,
    "paymentId" TEXT,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "decisionReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_reconciliations" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "paymentId" TEXT,
    "exceptionType" TEXT NOT NULL,
    "campusAmount" DOUBLE PRECISION,
    "gatewayAmount" DOUBLE PRECISION,
    "settlementAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "remarks" TEXT,
    "proofUrl" TEXT,
    "resolutionJson" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_books" (
    "id" TEXT NOT NULL,
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
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_routes" (
    "id" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT NOT NULL,
    "stops" TEXT NOT NULL DEFAULT '[]',
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_buildings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BOYS',
    "description" TEXT,
    "rooms" TEXT NOT NULL DEFAULT '[]',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "replies" TEXT NOT NULL DEFAULT '[]',
    "facultyId" TEXT,
    "studentId" TEXT,
    "assignedToUserId" TEXT,
    "routedAt" TIMESTAMP(3),
    "resolutionRemarks" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_requests" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING_MENTOR',
    "currentStep" TEXT NOT NULL DEFAULT 'MENTOR',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "mentor_id" TEXT,
    "faculty_id" TEXT,
    "class_advisor_id" TEXT,
    "department_id" TEXT,
    "faculty_requester_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_history" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comment" TEXT,
    "actionById" TEXT NOT NULL,
    "actionByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_slots" (
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
    "roomNo" TEXT,
    "isLab" BOOLEAN NOT NULL DEFAULT false,
    "slotType" TEXT NOT NULL DEFAULT 'THEORY',
    "revisionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetable_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counseling_records" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counseling_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_records" (
    "id" TEXT NOT NULL,
    "studentRoll" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "package" DOUBLE PRECISION NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "driveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Layers',
    "componentKey" TEXT NOT NULL,
    "permissionRequired" TEXT,
    "parentPath" TEXT,
    "group" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_assignments" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "isMentor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "teaching_group_departments" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teaching_group_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_group_sections" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teaching_group_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_group_students" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teaching_group_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_audit_logs" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "marksObtained" INTEGER,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_assignments" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internships" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT,
    "duration" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_documents" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "internshipId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internship_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
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
    "sentTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredTime" TIMESTAMP(3),
    "readTime" TIMESTAMP(3),
    "deletedByFaculty" BOOLEAN NOT NULL DEFAULT false,
    "deletedByStudent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hod_circulars" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "description" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "images" TEXT NOT NULL DEFAULT '[]',
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" TEXT NOT NULL,
    "publishedById" TEXT NOT NULL,

    CONSTRAINT "hod_circulars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hod_circular_read_trackers" (
    "id" TEXT NOT NULL,
    "circularId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DELIVERED',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hod_circular_read_trackers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_drives" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "industry" TEXT,
    "hrContact" TEXT,
    "package" DOUBLE PRECISION NOT NULL,
    "role" TEXT NOT NULL,
    "eligibilityCgpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eligibilityDept" TEXT,
    "eligibilityYear" TEXT,
    "maxArrears" INTEGER NOT NULL DEFAULT 0,
    "minAttendance" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "driveDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_drives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_applications" (
    "id" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "offerLetterUrl" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_id_cards" (
    "id" TEXT NOT NULL,
    "cardVersion" INTEGER NOT NULL DEFAULT 1,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "revocationReason" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "qrCodeUrl" TEXT,
    "cardPdfUrl" TEXT,
    "cardPngUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_id_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_publishes" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetable_publishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_applications" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT,
    "category" TEXT,
    "academicMarks" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "scholarshipStatus" TEXT NOT NULL DEFAULT 'NONE',
    "scholarshipType" TEXT,
    "scholarshipAmount" DOUBLE PRECISION,
    "documents" TEXT NOT NULL DEFAULT '[]',
    "verificationHistory" TEXT NOT NULL DEFAULT '[]',
    "waitlistNumber" INTEGER,
    "counsellingStatus" TEXT NOT NULL DEFAULT 'NOT_SCHEDULED',
    "counsellingSessionId" TEXT,
    "counsellingNotes" TEXT,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_applications" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "clarificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarship_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_enquiries" (
    "id" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "parentName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedCounsellor" TEXT,
    "followUpDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counselling_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "counsellor" TEXT NOT NULL,
    "notes" TEXT,
    "studentIds" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counselling_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_intakes" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "intakeCapacity" INTEGER NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "filledSeats" INTEGER NOT NULL DEFAULT 0,
    "reservedSeats" INTEGER NOT NULL DEFAULT 0,
    "managementQuotaIntake" INTEGER NOT NULL DEFAULT 0,
    "managementQuotaFilled" INTEGER NOT NULL DEFAULT 0,
    "governmentQuotaIntake" INTEGER NOT NULL DEFAULT 0,
    "governmentQuotaFilled" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_requests" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "issuedUrl" TEXT,
    "verificationHash" TEXT,
    "qrCodeUrl" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification_profiles" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "attendanceStreak" INTEGER NOT NULL DEFAULT 0,
    "assignmentStreak" INTEGER NOT NULL DEFAULT 0,
    "quizStreak" INTEGER NOT NULL DEFAULT 0,
    "badges" TEXT NOT NULL DEFAULT '[]',
    "unlockedRewards" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gamification_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_store_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpCost" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 100,
    "icon" TEXT NOT NULL DEFAULT 'Gift',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_store_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_redemptions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "xpSpent" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REDEEMED',
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT,
    "facultyId" TEXT NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 30,
    "totalMarks" INTEGER NOT NULL DEFAULT 100,
    "passMarks" INTEGER NOT NULL DEFAULT 40,
    "negativeMark" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT NOT NULL DEFAULT '[]',
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "marks" INTEGER NOT NULL DEFAULT 5,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_sessions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "topic" TEXT NOT NULL,
    "meetingUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advisor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_timetables" (
    "id" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_timetables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_timetable_slots" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "master_timetable_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_versions" (
    "id" TEXT NOT NULL,
    "masterTimetableId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshotData" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timetable_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_audit_logs" (
    "id" TEXT NOT NULL,
    "masterTimetableId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "performedByRole" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timetable_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "specialization" TEXT,
    "qualifications" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "achievements" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports_teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'MEN',
    "coachId" TEXT,
    "captainId" TEXT,
    "members" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports_tournaments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INTRA_COLLEGE',
    "venue" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "organizer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "teamsCount" INTEGER NOT NULL DEFAULT 0,
    "winnerTeam" TEXT,
    "runnerTeam" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports_equipments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL DEFAULT 0,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "location" TEXT NOT NULL DEFAULT 'Main Sports Complex',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports_bookings" (
    "id" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "bookedBy" TEXT NOT NULL,
    "bookerName" TEXT NOT NULL,
    "bookerRole" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sports_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports_achievements" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "tournamentName" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "medal" TEXT NOT NULL,
    "position" TEXT,
    "certificateUrl" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sports_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_achievements" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ACADEMIC',
    "description" TEXT,
    "issuedBy" TEXT,
    "issueDate" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_leave_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "departmentId" TEXT,
    "type" TEXT NOT NULL,
    "requestCategory" TEXT DEFAULT 'PERSONAL',
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "durationType" TEXT DEFAULT 'FULL_DAY',
    "totalDays" INTEGER NOT NULL DEFAULT 1,
    "eventName" TEXT,
    "eventLocation" TEXT,
    "emergencyContact" TEXT,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_MENTOR',
    "studentStatus" TEXT DEFAULT 'SUBMITTED',
    "mentorStatus" TEXT DEFAULT 'PENDING',
    "hodStatus" TEXT DEFAULT 'PENDING',
    "finalStatus" TEXT DEFAULT 'PENDING',
    "workflowStatus" TEXT DEFAULT 'PENDING_MENTOR',
    "priority" TEXT DEFAULT 'NORMAL',
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "studentActionRequired" BOOLEAN NOT NULL DEFAULT false,
    "mentorId" TEXT,
    "mentorApprovedAt" TIMESTAMP(3),
    "mentorRemarks" TEXT,
    "hodId" TEXT,
    "hodApprovedAt" TIMESTAMP(3),
    "hodRemarks" TEXT,
    "forwardedToHodAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "attendanceUpdated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_approvals" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approverRole" TEXT NOT NULL,
    "approvalLevel" INTEGER NOT NULL DEFAULT 1,
    "decision" TEXT NOT NULL,
    "remarks" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "actedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,

    CONSTRAINT "request_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_workflow_history" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedRole" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_workflow_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_attachments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "fileUrl" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_leave_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL DEFAULT 1,
    "attachmentUrl" TEXT,
    "substitutions" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'PENDING_HOD',
    "hodId" TEXT,
    "hodApprovedAt" TIMESTAMP(3),
    "hodRemarks" TEXT,
    "principalId" TEXT,
    "principalApprovedAt" TIMESTAMP(3),
    "principalRemarks" TEXT,
    "isActingPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "principal_delegation_logs" (
    "id" TEXT NOT NULL,
    "principalUserId" TEXT NOT NULL,
    "actingUserId" TEXT NOT NULL,
    "actingUserRole" TEXT NOT NULL DEFAULT 'Vice Principal',
    "actionType" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "targetEntityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "principal_delegation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutional_circulars" (
    "id" TEXT NOT NULL,
    "circularNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "broadcastLevel" TEXT NOT NULL DEFAULT 'ALL_CAMPUS',
    "departmentId" TEXT,
    "authorId" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutional_circulars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circular_read_receipts" (
    "id" TEXT NOT NULL,
    "circularId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circular_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_change_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "requestedChanges" TEXT NOT NULL,
    "approvalMode" TEXT NOT NULL DEFAULT 'DIRECT_UPDATE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "proofDocumentUrl" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewerRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requesterRole" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filters" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "fileReference" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_download_audits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "targetEntityId" TEXT,
    "targetEntityType" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_download_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_kpi_definitions" (
    "id" TEXT NOT NULL,
    "kpiCode" TEXT NOT NULL,
    "kpiName" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "formulaDefinition" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "allowedRoles" TEXT NOT NULL,
    "allowedWorkspaces" TEXT NOT NULL,
    "refreshStrategy" TEXT NOT NULL DEFAULT 'LIVE_QUERY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_kpi_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_attendance_summaries" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT,
    "semesterId" TEXT,
    "sectionId" TEXT,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "presentCount" INTEGER NOT NULL DEFAULT 0,
    "absentCount" INTEGER NOT NULL DEFAULT 0,
    "leaveCount" INTEGER NOT NULL DEFAULT 0,
    "odCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_attendance_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_result_summaries" (
    "id" TEXT NOT NULL,
    "examinationId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "subjectId" TEXT,
    "appearedCount" INTEGER NOT NULL DEFAULT 0,
    "passedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "absentCount" INTEGER NOT NULL DEFAULT 0,
    "averageMark" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_result_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "workspaceCode" TEXT NOT NULL DEFAULT 'DEFAULT',
    "datasetCode" TEXT NOT NULL,
    "configuration" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "departmentId" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" TEXT NOT NULL,
    "savedReportId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "scheduleType" TEXT NOT NULL DEFAULT 'WEEKLY',
    "outputFormat" TEXT NOT NULL DEFAULT 'PDF',
    "deliveryChannels" TEXT NOT NULL DEFAULT '["IN_APP"]',
    "recipientScope" TEXT NOT NULL DEFAULT 'OWNER',
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_matrix_rules" (
    "id" TEXT NOT NULL,
    "workflowType" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "approverRole" TEXT NOT NULL,
    "approverId" TEXT,
    "conditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_matrix_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports_attendances" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teamId" TEXT,
    "sport" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sports_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "occupation" TEXT,
    "alternatePhone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_student_relations" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'FATHER',
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_student_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "taskNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ACADEMIC_DOCUMENTATION',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "departmentId" TEXT,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_SEEN',
    "visibility" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "checklist" TEXT,
    "estimatedHours" DOUBLE PRECISION,
    "colorLabel" TEXT,
    "slaHours" INTEGER,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringRule" TEXT,
    "templateId" TEXT,
    "parentTaskId" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "remarks" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_dependencies" (
    "id" TEXT NOT NULL,
    "predecessorTaskId" TEXT NOT NULL,
    "successorTaskId" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'FINISH_TO_START',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ACADEMIC_DOCUMENTATION',
    "description" TEXT,
    "defaultChecklist" TEXT,
    "suggestedTimelineDays" INTEGER NOT NULL DEFAULT 7,
    "slaHours" INTEGER NOT NULL DEFAULT 48,
    "defaultPriority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "approvalFlow" TEXT,
    "departmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_documents" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'CIRCULAR',
    "departmentId" TEXT,
    "authorId" TEXT NOT NULL,
    "lifecycleState" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "fileUrl" TEXT,
    "keywords" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "governance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_signatures" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signerRole" TEXT NOT NULL,
    "signatureHash" TEXT NOT NULL,
    "qrVerificationToken" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "digital_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sop_library_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'POLICY',
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "accessRoles" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sop_library_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignees" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_SEEN',
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "seenAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_status_histories" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "previousPercent" INTEGER,
    "newPercent" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comment_mentions" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "mentionedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_comment_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_read_receipts" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'LOCAL',
    "checksum" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploaderId" TEXT NOT NULL,
    "taskId" TEXT,
    "taskCommentId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_versions" (
    "id" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT,
    "uploaderId" TEXT NOT NULL,
    "changeNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "deepLinkRoute" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "deliveryState" TEXT NOT NULL DEFAULT 'DELIVERED',
    "deliveryChannel" TEXT NOT NULL DEFAULT 'IN_APP',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "taskAlerts" BOOLEAN NOT NULL DEFAULT true,
    "messageAlerts" BOOLEAN NOT NULL DEFAULT true,
    "academicAlerts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "appVersion" TEXT,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ONE_TO_ONE',
    "title" TEXT,
    "departmentId" TEXT,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "replyToId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_read_receipts" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_presence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "previousValues" TEXT,
    "newValues" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_tasks" (
    "id" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ACADEMIC_REPORT',
    "expectedOutput" TEXT,
    "instructions" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "confidentialityLevel" TEXT NOT NULL DEFAULT 'INTERNAL',
    "assignmentMode" TEXT NOT NULL DEFAULT 'SINGLE_DEPARTMENT',
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "scheduledPublishAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reminderConfig" TEXT,
    "submissionRequirements" TEXT,
    "templateId" TEXT,
    "createdById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_task_assignments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "assignedHodUserId" TEXT NOT NULL,
    "assignmentCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "viewedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "originalDueAt" TIMESTAMP(3) NOT NULL,
    "currentDueAt" TIMESTAMP(3) NOT NULL,
    "assignedById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_task_files" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "fileScope" TEXT NOT NULL DEFAULT 'REFERENCE',
    "fileCategory" TEXT,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storageReference" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "uploadedById" TEXT NOT NULL,
    "scanStatus" TEXT NOT NULL DEFAULT 'CLEAN',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supersededById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_task_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_task_queries" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "parentQueryId" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "visibility" TEXT NOT NULL DEFAULT 'ASSIGNMENT_PRIVATE',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_task_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_task_submissions" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "submissionVersion" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "checklistData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submittedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewAction" TEXT,
    "reviewRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_task_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_task_timeline" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "eventType" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "departmentId" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "remarks" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_task_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_task_reminders" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "reminderType" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_task_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iqac_audits" (
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

    CONSTRAINT "iqac_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iqac_audit_departments" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iqac_audit_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iqac_requirements" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "criterion" TEXT,
    "keyIndicator" TEXT,
    "metricCode" TEXT,
    "sourceType" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iqac_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iqac_evidence" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileReference" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'UPLOAD',
    "sourceEntityId" TEXT,
    "repositoryKey" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iqac_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iqac_observations" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "evidenceId" TEXT,
    "authorId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OBSERVATION',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "iqac_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iqac_audit_timeline" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "iqac_audit_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_task_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ACADEMIC_REPORT',
    "defaultTitle" TEXT,
    "defaultInstructions" TEXT,
    "submissionRequirements" TEXT,
    "defaultChecklist" TEXT,
    "defaultFileRequirements" TEXT,
    "defaultPriority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "reminderPattern" TEXT,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_coordination_requests" (
    "id" TEXT NOT NULL,
    "requestCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestType" TEXT NOT NULL DEFAULT 'GENERAL_VERIFICATION',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "departmentId" TEXT NOT NULL,
    "assignedHodUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "responseNotes" TEXT,
    "responseFiles" TEXT DEFAULT '[]',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewRemarks" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_coordination_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_hod_assignments" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "hodUserId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "removalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_hod_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "principal_statuses" (
    "id" TEXT NOT NULL,
    "principalUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "reason" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "activeDelegationId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "principal_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "principal_delegations" (
    "id" TEXT NOT NULL,
    "principalUserId" TEXT NOT NULL,
    "actingUserId" TEXT NOT NULL,
    "actingUserRole" TEXT NOT NULL DEFAULT 'Vice Principal',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "principalStatus" TEXT NOT NULL DEFAULT 'OFFLINE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "delegatedCategories" TEXT NOT NULL DEFAULT '[]',
    "delegatedPermissions" TEXT NOT NULL DEFAULT '[]',
    "delegatedScope" TEXT NOT NULL DEFAULT '{}',
    "financialThreshold" DOUBLE PRECISION,
    "emergencyContactNote" TEXT,
    "messageToVp" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedDeviceId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokedReason" TEXT,
    "expiredAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "principal_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_assignments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "title" TEXT,
    "applicantName" TEXT,
    "departmentName" TEXT,
    "assignedUserId" TEXT NOT NULL,
    "originalAssigneeId" TEXT,
    "assignedRole" TEXT NOT NULL,
    "assignmentType" TEXT NOT NULL DEFAULT 'DIRECT',
    "delegationId" TEXT,
    "departmentId" TEXT,
    "workflowStage" TEXT DEFAULT 'PRINCIPAL',
    "financialAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "actionByUserId" TEXT,
    "actionByRole" TEXT,
    "actionAsRole" TEXT,
    "actionRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegation_handovers" (
    "id" TEXT NOT NULL,
    "delegationId" TEXT NOT NULL,
    "principalUserId" TEXT NOT NULL,
    "actingUserId" TEXT NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "returnedCount" INTEGER NOT NULL DEFAULT 0,
    "pendingCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delegation_handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegation_action_logs" (
    "id" TEXT NOT NULL,
    "delegationId" TEXT,
    "module" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "performedByRole" TEXT NOT NULL,
    "performedAsRole" TEXT NOT NULL DEFAULT 'ACTING_PRINCIPAL',
    "delegatedByUserId" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "remarks" TEXT,
    "attachmentId" TEXT,
    "ipAddress" TEXT,
    "deviceId" TEXT,
    "platform" TEXT DEFAULT 'WEB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delegation_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "idempotencyKey" TEXT,
    "providerResponse" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circulars" (
    "id" TEXT NOT NULL,
    "circularNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "description" TEXT,
    "content" TEXT NOT NULL,
    "broadcastLevel" TEXT NOT NULL DEFAULT 'ALL_CAMPUS',
    "departmentId" TEXT,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT,
    "publishedAs" TEXT,
    "delegationId" TEXT,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "referenceLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "effectiveDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "publishDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "targetDepartments" TEXT NOT NULL DEFAULT '[]',
    "targetYears" TEXT NOT NULL DEFAULT '[]',
    "targetSemesters" TEXT NOT NULL DEFAULT '[]',
    "targetSections" TEXT NOT NULL DEFAULT '[]',
    "targetRoles" TEXT NOT NULL DEFAULT '[]',
    "selectedUserIds" TEXT NOT NULL DEFAULT '[]',
    "acknowledgementRequired" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circulars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circular_recipients" (
    "id" TEXT NOT NULL,
    "circularId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DELIVERED',
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circular_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflow_events" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actorUserId" TEXT,
    "actorNameSnapshot" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorDisplayRole" TEXT,
    "performedAsRole" TEXT,
    "delegationId" TEXT,
    "remarks" TEXT,
    "attachmentId" TEXT,
    "metadataJson" TEXT,
    "sequenceNumber" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_workflow_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_attachments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "uploadedByUserId" TEXT,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "replacedByAttachmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_authors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_issues" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "borrowerType" TEXT NOT NULL DEFAULT 'STUDENT',
    "accessionNo" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "renewalCount" INTEGER NOT NULL DEFAULT 0,
    "maxRenewals" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "fineAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fineStatus" TEXT,
    "remarks" TEXT,
    "issuedById" TEXT NOT NULL,
    "returnedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_reservations" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "reservedById" TEXT NOT NULL,
    "reserverType" TEXT NOT NULL DEFAULT 'STUDENT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "fulfilledAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_fines" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "borrowerType" TEXT NOT NULL DEFAULT 'STUDENT',
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "feePaymentId" TEXT,
    "waivedById" TEXT,
    "waivedReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_fines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_digital_resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EBOOK',
    "url" TEXT,
    "fileKey" TEXT,
    "isbn" TEXT,
    "author" TEXT,
    "publisher" TEXT,
    "category" TEXT,
    "description" TEXT,
    "accessLevel" TEXT NOT NULL DEFAULT 'ALL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_digital_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_blocks" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalFloors" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_floors" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_rooms" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "roomType" TEXT NOT NULL DEFAULT 'STANDARD',
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "occupied" INTEGER NOT NULL DEFAULT 0,
    "amenities" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_beds" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bedNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_allocations" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bedId" TEXT,
    "academicYear" TEXT NOT NULL,
    "allocationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vacationDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "allocatedById" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_room_changes" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromRoomId" TEXT NOT NULL,
    "toRoomId" TEXT NOT NULL,
    "fromBedId" TEXT,
    "toBedId" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_room_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_wardens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "designation" TEXT NOT NULL DEFAULT 'WARDEN',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_wardens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_mess" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'VEG',
    "capacity" INTEGER NOT NULL,
    "menuSchedule" TEXT NOT NULL DEFAULT '{}',
    "timings" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_mess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_mess_attendance" (
    "id" TEXT NOT NULL,
    "messId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "meal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_mess_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_night_attendance" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "recordedBy" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_night_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_outings" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "outDate" TIMESTAMP(3) NOT NULL,
    "outTime" TEXT NOT NULL,
    "expectedReturn" TIMESTAMP(3) NOT NULL,
    "actualReturn" TIMESTAMP(3),
    "purpose" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_outings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_visitors" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "visitorPhone" TEXT NOT NULL,
    "visitorIdType" TEXT,
    "visitorIdNo" TEXT,
    "purpose" TEXT NOT NULL,
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'CHECKED_IN',
    "verifiedById" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_complaints" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "studentId" TEXT,
    "roomId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "assignedToId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "ticketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_discipline" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MINOR',
    "action" TEXT,
    "actionBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECORDED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BUS',
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "capacity" INTEGER NOT NULL,
    "fuelType" TEXT NOT NULL DEFAULT 'DIESEL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "insuranceExpiry" TIMESTAMP(3),
    "fitnessExpiry" TIMESTAMP(3),
    "permitExpiry" TIMESTAMP(3),
    "registrationNo" TEXT,
    "gpsDeviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_stops" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "landmark" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "sequence" INTEGER NOT NULL,
    "pickupTime" TEXT,
    "dropTime" TEXT,
    "fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_drivers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "licenseNo" TEXT NOT NULL,
    "licenseExpiry" TIMESTAMP(3) NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "address" TEXT,
    "photo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_route_vehicles" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "conductorId" TEXT,
    "shift" TEXT NOT NULL DEFAULT 'MORNING',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_route_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_allocations" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "passengerType" TEXT NOT NULL DEFAULT 'STUDENT',
    "academicYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_attendance" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "passengerId" TEXT NOT NULL,
    "passengerType" TEXT NOT NULL DEFAULT 'STUDENT',
    "date" DATE NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BOARDED',
    "boardingTime" TIMESTAMP(3),
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_maintenance" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ROUTINE',
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vendorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_fuel" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "costPerUnit" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "odometer" INTEGER,
    "filledById" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_fuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_breakdowns" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "routeId" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "reportedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_passes" (
    "id" TEXT NOT NULL,
    "passNumber" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterType" TEXT NOT NULL DEFAULT 'STUDENT',
    "purpose" TEXT NOT NULL,
    "destination" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "vehicleNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "qrToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gate_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_records" (
    "id" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitorPhone" TEXT NOT NULL,
    "visitorEmail" TEXT,
    "visitorIdType" TEXT,
    "visitorIdNo" TEXT,
    "organization" TEXT,
    "purpose" TEXT NOT NULL,
    "hostId" TEXT,
    "hostType" TEXT,
    "hostName" TEXT,
    "vehicleNo" TEXT,
    "entryGate" TEXT,
    "exitGate" TEXT,
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" TIMESTAMP(3),
    "photo" TEXT,
    "badgeNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CHECKED_IN',
    "verifiedById" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_exit_logs" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "personType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "gate" TEXT,
    "method" TEXT NOT NULL DEFAULT 'QR_SCAN',
    "verifiedById" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "entry_exit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_incidents" (
    "id" TEXT NOT NULL,
    "incidentNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "witnesses" TEXT NOT NULL DEFAULT '[]',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "assignedToId" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_verifications" (
    "id" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'QR',
    "result" TEXT NOT NULL,
    "qrPayload" TEXT,
    "responseData" TEXT,
    "ipAddress" TEXT,
    "deviceId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appraisal_configs" (
    "id" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "configuredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appraisal_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appraisal_categories" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "maxPoints" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appraisal_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appraisal_subcategories" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "maxPoints" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "pointsPerItem" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "maxItems" INTEGER,
    "evidenceRequired" BOOLEAN NOT NULL DEFAULT true,
    "verificationAuthority" TEXT NOT NULL DEFAULT 'HOD',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appraisal_subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appraisal_submissions" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weightedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "returnReason" TEXT,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appraisal_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appraisal_entries" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "claimedPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verifiedPoints" DOUBLE PRECISION,
    "evidenceId" TEXT,
    "evidenceUrl" TEXT,
    "evidenceType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CLAIMED',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appraisal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appraisal_verifications" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "verifierRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appraisal_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_items" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL DEFAULT 'FACULTY',
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileKey" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "fileHash" TEXT,
    "externalUrl" TEXT,
    "doi" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "academicYear" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_links" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "linkedModule" TEXT NOT NULL,
    "linkedId" TEXT NOT NULL,
    "linkedType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "headerHtml" TEXT,
    "footerHtml" TEXT,
    "signatories" TEXT NOT NULL DEFAULT '[]',
    "requiresFinancialClearance" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "autoFields" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_generations" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "purpose" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "currentStep" TEXT NOT NULL DEFAULT 'OFFICE_REVIEW',
    "qrVerificationHash" TEXT,
    "generatedPdfUrl" TEXT,
    "signedPdfUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "signedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "returnReason" TEXT,
    "turnaroundHours" DOUBLE PRECISION,
    "financialClearance" BOOLEAN NOT NULL DEFAULT false,
    "financialClearanceAt" TIMESTAMP(3),
    "financialClearanceBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "items" TEXT NOT NULL DEFAULT '[]',
    "estimatedAmount" DOUBLE PRECISION NOT NULL,
    "budgetHead" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentStep" TEXT NOT NULL DEFAULT 'HOD',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "remarks" TEXT,
    "approvedAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_quotations" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorName" TEXT NOT NULL,
    "quotationNo" TEXT,
    "quotationDate" TIMESTAMP(3) NOT NULL,
    "items" TEXT NOT NULL DEFAULT '[]',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "validUntil" TIMESTAMP(3),
    "terms" TEXT,
    "attachmentUrl" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "requestId" TEXT,
    "vendorId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "items" TEXT NOT NULL DEFAULT '[]',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "terms" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" TEXT NOT NULL,
    "grnNumber" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" TEXT NOT NULL,
    "items" TEXT NOT NULL DEFAULT '[]',
    "remarks" TEXT,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "inspectedById" TEXT,
    "inspectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "description" TEXT,
    "departmentId" TEXT NOT NULL,
    "locationId" TEXT,
    "custodianId" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseOrderId" TEXT,
    "vendorId" TEXT,
    "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "warrantyExpiry" TIMESTAMP(3),
    "amcExpiry" TIMESTAMP(3),
    "amcVendorId" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "photo" TEXT,
    "qrCode" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_movements" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "fromDeptId" TEXT,
    "toDeptId" TEXT,
    "fromCustodianId" TEXT,
    "toCustodianId" TEXT,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "reason" TEXT,
    "approvedById" TEXT,
    "performedById" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_services" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vendorId" TEXT,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'NOS',
    "description" TEXT,
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimumStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "departmentId" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "previousStock" DOUBLE PRECISION NOT NULL,
    "newStock" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "departmentId" TEXT,
    "issuedToId" TEXT,
    "performedById" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "vendorCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SUPPLIER',
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "tanNumber" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "website" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "bankName" TEXT,
    "bankBranch" TEXT,
    "bankAccount" TEXT,
    "ifscCode" TEXT,
    "products" TEXT NOT NULL DEFAULT '[]',
    "documents" TEXT NOT NULL DEFAULT '[]',
    "rating" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_contacts" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "buildingId" TEXT,
    "roomId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reportedById" TEXT NOT NULL,
    "reportedByType" TEXT NOT NULL DEFAULT 'STAFF',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "photos" TEXT NOT NULL DEFAULT '[]',
    "assignedToId" TEXT,
    "ticketId" TEXT,
    "assetId" TEXT,
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "partsUsed" TEXT NOT NULL DEFAULT '[]',
    "slaHours" INTEGER,
    "triageRemarks" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "feedback" TEXT,
    "feedbackRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_technicians" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "specialization" TEXT NOT NULL DEFAULT 'GENERAL',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_technicians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_works" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "technicianId" TEXT,
    "description" TEXT NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "hoursWorked" DOUBLE PRECISION,
    "partsUsed" TEXT NOT NULL DEFAULT '[]',
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "remarks" TEXT,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookable_resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "building" TEXT,
    "floor" TEXT,
    "capacity" INTEGER,
    "amenities" TEXT NOT NULL DEFAULT '[]',
    "photo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookable_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_bookings" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "bookedById" TEXT NOT NULL,
    "bookedByRole" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "attendees" INTEGER,
    "equipmentNeeded" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "conflictCheckPassed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meetingType" TEXT NOT NULL DEFAULT 'REGULAR',
    "venue" TEXT,
    "onlineLink" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "chairPersonId" TEXT NOT NULL,
    "coordinatorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_invitees" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "rsvpStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "attendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_invitees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_agenda" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "presenterId" TEXT,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_minutes" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "preparedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_minutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_action_items" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "taskId" TEXT,
    "completedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "piId" TEXT NOT NULL,
    "coPiIds" TEXT NOT NULL DEFAULT '[]',
    "departmentId" TEXT NOT NULL,
    "fundingAgency" TEXT,
    "fundingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "description" TEXT,
    "objectives" TEXT,
    "milestones" TEXT NOT NULL DEFAULT '[]',
    "reports" TEXT NOT NULL DEFAULT '[]',
    "publications" TEXT NOT NULL DEFAULT '[]',
    "evidenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_publications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL DEFAULT '[]',
    "journal" TEXT,
    "conference" TEXT,
    "volume" TEXT,
    "issue" TEXT,
    "pages" TEXT,
    "year" INTEGER NOT NULL,
    "doi" TEXT,
    "isbn" TEXT,
    "impactFactor" DOUBLE PRECISION,
    "indexing" TEXT,
    "type" TEXT NOT NULL DEFAULT 'JOURNAL',
    "abstract" TEXT,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "url" TEXT,
    "evidenceId" TEXT,
    "departmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inventors" TEXT NOT NULL DEFAULT '[]',
    "applicationNo" TEXT,
    "filingDate" TIMESTAMP(3),
    "publicationDate" TIMESTAMP(3),
    "grantDate" TIMESTAMP(3),
    "patentNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'FILED',
    "country" TEXT NOT NULL DEFAULT 'India',
    "type" TEXT NOT NULL DEFAULT 'UTILITY',
    "abstract" TEXT,
    "documents" TEXT NOT NULL DEFAULT '[]',
    "evidenceId" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_schemes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "description" TEXT,
    "eligibility" TEXT NOT NULL DEFAULT '{}',
    "amount" DOUBLE PRECISION,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "renewalCriteria" TEXT,
    "documents" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "academicYear" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "maxBeneficiaries" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarship_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_applications_v2" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "applicationData" TEXT NOT NULL DEFAULT '{}',
    "documents" TEXT NOT NULL DEFAULT '[]',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "remarks" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarship_applications_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_disbursements" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "disbursementDate" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "reference" TEXT,
    "feePaymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "processedById" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scholarship_disbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "description" TEXT,
    "logo" TEXT,
    "coordinatorId" TEXT,
    "departmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_memberships" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_events" (
    "id" TEXT NOT NULL,
    "clubId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EVENT',
    "description" TEXT,
    "venue" TEXT,
    "onlineLink" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "registrationDeadline" TIMESTAMP(3),
    "maxParticipants" INTEGER,
    "eligibility" TEXT,
    "departmentId" TEXT,
    "organizerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "budget" DOUBLE PRECISION,
    "budgetApproved" BOOLEAN NOT NULL DEFAULT false,
    "poster" TEXT,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_certificates" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PARTICIPATION',
    "certificateUrl" TEXT,
    "qrHash" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "originalStudentId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "batch" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "degreeAwarded" TEXT,
    "yearOfGraduation" INTEGER NOT NULL,
    "cgpa" DOUBLE PRECISION,
    "photo" TEXT,
    "currentOrganization" TEXT,
    "currentDesignation" TEXT,
    "currentLocation" TEXT,
    "linkedin" TEXT,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "consentToConnect" BOOLEAN NOT NULL DEFAULT false,
    "consentToMentor" BOOLEAN NOT NULL DEFAULT false,
    "communicationPrefs" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_employment" (
    "id" TEXT NOT NULL,
    "alumniId" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "location" TEXT,
    "type" TEXT NOT NULL DEFAULT 'EMPLOYMENT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_employment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "sourceModule" TEXT,
    "sourceId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "venue" TEXT,
    "onlineLink" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'INSTITUTION',
    "departmentId" TEXT,
    "createdById" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "targetAudience" TEXT NOT NULL DEFAULT '[]',
    "color" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "reminderMinutes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_alerts" (
    "id" TEXT NOT NULL,
    "alertNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'HIGH',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "instructions" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'CAMPUS_WIDE',
    "scopeDetails" TEXT,
    "initiatedById" TEXT NOT NULL,
    "initiatedByRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolution" TEXT,
    "updateHistory" TEXT NOT NULL DEFAULT '[]',
    "channels" TEXT NOT NULL DEFAULT '["IN_APP","PUSH"]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_acknowledgements" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "message" TEXT,
    "location" TEXT,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_acknowledgements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_activities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "organizerId" TEXT NOT NULL,
    "responsibleStaffId" TEXT,
    "departmentId" TEXT,
    "programId" TEXT,
    "targetYear" INTEGER,
    "targetSection" TEXT,
    "audience" TEXT NOT NULL DEFAULT '[]',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "venue" TEXT,
    "onlineLink" TEXT,
    "capacity" INTEGER,
    "registrationRequired" BOOLEAN NOT NULL DEFAULT false,
    "attendanceRequired" BOOLEAN NOT NULL DEFAULT true,
    "assessmentRequired" BOOLEAN NOT NULL DEFAULT false,
    "certificateAvailable" BOOLEAN NOT NULL DEFAULT false,
    "evidenceRequired" BOOLEAN NOT NULL DEFAULT false,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "budget" DOUBLE PRECISION,
    "budgetApproved" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_sessions" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "title" TEXT,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "venue" TEXT,
    "trainerId" TEXT,
    "trainerName" TEXT,
    "topic" TEXT,
    "sessionOrder" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_attendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "recordedById" TEXT,
    "correctionHistory" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_assessments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "activityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'COMPLETION',
    "maxScore" DOUBLE PRECISION,
    "score" DOUBLE PRECISION,
    "grade" TEXT,
    "feedback" TEXT,
    "evaluatedById" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_skills" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "evidenceId" TEXT,
    "level" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "steps" TEXT NOT NULL DEFAULT '[]',
    "conditions" TEXT NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "configuredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_teaching_assignments" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "homeDepartmentId" TEXT NOT NULL,
    "teachingDepartmentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "semesterId" TEXT,
    "sectionId" TEXT,
    "academicYearId" TEXT,
    "periodsPerWeek" INTEGER NOT NULL DEFAULT 3,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "requestedById" TEXT,
    "approvedById" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_teaching_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_department_transfers" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "fromDepartmentId" TEXT NOT NULL,
    "toDepartmentId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "designationImpact" TEXT,
    "handoverNotes" TEXT,
    "supportingDocUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "currentApproverRole" TEXT NOT NULL DEFAULT 'RECEIVING_HOD',
    "approvalHistory" TEXT NOT NULL DEFAULT '[]',
    "initiatedById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_department_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_leave_policies" (
    "id" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "annualQuota" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "monthlyLimit" DOUBLE PRECISION DEFAULT 3,
    "consecutiveLimit" DOUBLE PRECISION DEFAULT 3,
    "carryForwardAllowed" BOOLEAN NOT NULL DEFAULT false,
    "maxCarryForward" DOUBLE PRECISION DEFAULT 0,
    "minAdvanceNoticeDays" INTEGER NOT NULL DEFAULT 1,
    "attachmentRequired" BOOLEAN NOT NULL DEFAULT false,
    "attachmentThresholdDays" INTEGER NOT NULL DEFAULT 3,
    "halfDayAllowed" BOOLEAN NOT NULL DEFAULT true,
    "probationAllowed" BOOLEAN NOT NULL DEFAULT true,
    "blackoutDates" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_leave_ledger" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2026-2027',
    "openingBalance" DOUBLE PRECISION NOT NULL,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingBalance" DOUBLE PRECISION NOT NULL,
    "transactionType" TEXT NOT NULL,
    "referenceRequestId" TEXT,
    "remarks" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faculty_leave_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_slot_overrides" (
    "id" TEXT NOT NULL,
    "timetableSlotId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "periodNumber" INTEGER NOT NULL DEFAULT 1,
    "originalFacultyId" TEXT NOT NULL,
    "substituteFacultyId" TEXT NOT NULL,
    "leaveRequestId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "attendanceTaken" BOOLEAN NOT NULL DEFAULT false,
    "attendanceTakenAt" TIMESTAMP(3),
    "attendanceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetable_slot_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_office_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DOC',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "contentJson" TEXT NOT NULL DEFAULT '{}',
    "contentHtml" TEXT,
    "templateKey" TEXT,
    "authorId" TEXT NOT NULL,
    "departmentId" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "targetScope" TEXT NOT NULL DEFAULT 'PRIVATE',
    "targetUsers" TEXT NOT NULL DEFAULT '[]',
    "targetRoles" TEXT NOT NULL DEFAULT '[]',
    "workflowStep" TEXT,
    "assignedReviewerId" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedById" TEXT,
    "lockedAt" TIMESTAMP(3),
    "tags" TEXT NOT NULL DEFAULT '[]',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_office_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_document_versions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "contentSnapshot" TEXT NOT NULL,
    "changeSummary" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campus_document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_document_comments" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "anchorData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_document_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_form_responses" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "respondentId" TEXT,
    "respondentEmail" TEXT,
    "respondentName" TEXT,
    "answersJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campus_form_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_drive_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER DEFAULT 0,
    "fileUrl" TEXT,
    "documentId" TEXT,
    "ownerId" TEXT NOT NULL,
    "departmentId" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'PERSONAL',
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isTrashed" BOOLEAN NOT NULL DEFAULT false,
    "trashedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_drive_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_revisions" (
    "id" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL DEFAULT 0,
    "revisionCode" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "changeSummary" TEXT,
    "comparisonDiff" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetable_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_import_batches" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "revisionId" TEXT,
    "sourceFileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileType" TEXT NOT NULL DEFAULT 'XLSX',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "warningRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "conflictRows" INTEGER NOT NULL DEFAULT 0,
    "mappingJson" TEXT NOT NULL DEFAULT '{}',
    "parsedRowsJson" TEXT NOT NULL DEFAULT '[]',
    "errorsJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetable_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_issue_reports" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "timetableSlotId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolutionNotes" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetable_issue_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_faculty_allocations" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "requiredTheoryHours" INTEGER NOT NULL DEFAULT 4,
    "requiredLabHours" INTEGER NOT NULL DEFAULT 0,
    "allocatedTheoryHours" INTEGER NOT NULL DEFAULT 0,
    "allocatedLabHours" INTEGER NOT NULL DEFAULT 0,
    "isCrossDepartment" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_faculty_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "username_counters_rolePrefix_year_key" ON "username_counters"("rolePrefix", "year");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_roleCode_key" ON "roles"("roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "designations_title_key" ON "designations"("title");

-- CreateIndex
CREATE UNIQUE INDEX "designations_code_key" ON "designations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "committees_name_key" ON "committees"("name");

-- CreateIndex
CREATE UNIQUE INDEX "committees_code_key" ON "committees"("code");

-- CreateIndex
CREATE INDEX "permission_delegations_delegatorId_idx" ON "permission_delegations"("delegatorId");

-- CreateIndex
CREATE INDEX "permission_delegations_delegateeId_idx" ON "permission_delegations"("delegateeId");

-- CreateIndex
CREATE INDEX "user_workspaces_userId_idx" ON "user_workspaces"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_workspaces_userId_workspaceCode_key" ON "user_workspaces"("userId", "workspaceCode");

-- CreateIndex
CREATE INDEX "rbac_audit_logs_entityType_entityId_idx" ON "rbac_audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "rbac_audit_logs_changedBy_idx" ON "rbac_audit_logs"("changedBy");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_name_key" ON "permission_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_code_key" ON "permission_groups"("code");

-- CreateIndex
CREATE INDEX "permission_audits_userId_idx" ON "permission_audits"("userId");

-- CreateIndex
CREATE INDEX "permission_audits_action_idx" ON "permission_audits"("action");

-- CreateIndex
CREATE INDEX "permission_audits_createdAt_idx" ON "permission_audits"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refreshToken_key" ON "user_sessions"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "login_history_userId_status_idx" ON "login_history"("userId", "status");

-- CreateIndex
CREATE INDEX "login_history_createdAt_idx" ON "login_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "programs_departmentId_idx" ON "programs"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "programs_name_departmentId_key" ON "programs"("name", "departmentId");

-- CreateIndex
CREATE INDEX "courses_programId_idx" ON "courses"("programId");

-- CreateIndex
CREATE INDEX "courses_departmentId_idx" ON "courses"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_name_programId_key" ON "courses"("name", "programId");

-- CreateIndex
CREATE INDEX "semesters_courseId_idx" ON "semesters"("courseId");

-- CreateIndex
CREATE INDEX "semesters_programId_idx" ON "semesters"("programId");

-- CreateIndex
CREATE INDEX "semesters_academicYearId_idx" ON "semesters"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_number_courseId_key" ON "semesters"("number", "courseId");

-- CreateIndex
CREATE INDEX "sections_semesterId_idx" ON "sections"("semesterId");

-- CreateIndex
CREATE INDEX "sections_programId_idx" ON "sections"("programId");

-- CreateIndex
CREATE INDEX "sections_departmentId_idx" ON "sections"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "sections_name_semesterId_key" ON "sections"("name", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "subjects_semesterId_idx" ON "subjects"("semesterId");

-- CreateIndex
CREATE INDEX "subjects_departmentId_idx" ON "subjects"("departmentId");

-- CreateIndex
CREATE INDEX "subjects_programId_idx" ON "subjects"("programId");

-- CreateIndex
CREATE INDEX "subjects_sectionId_idx" ON "subjects"("sectionId");

-- CreateIndex
CREATE INDEX "subjects_regulationId_idx" ON "subjects"("regulationId");

-- CreateIndex
CREATE UNIQUE INDEX "regulations_code_key" ON "regulations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "program_outcomes_code_key" ON "program_outcomes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "master_records_type_value_key" ON "master_records"("type", "value");

-- CreateIndex
CREATE INDEX "user_activity_logs_userId_idx" ON "user_activity_logs"("userId");

-- CreateIndex
CREATE INDEX "user_activity_logs_action_idx" ON "user_activity_logs"("action");

-- CreateIndex
CREATE INDEX "user_activity_logs_createdAt_idx" ON "user_activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "media_files_path_key" ON "media_files"("path");

-- CreateIndex
CREATE UNIQUE INDEX "permission_templates_name_key" ON "permission_templates"("name");

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
CREATE UNIQUE INDEX "exam_type_settings_code_key" ON "exam_type_settings"("code");

-- CreateIndex
CREATE INDEX "exam_schedule_entries_examId_status_examDate_session_idx" ON "exam_schedule_entries"("examId", "status", "examDate", "session");

-- CreateIndex
CREATE INDEX "exam_schedule_entries_departmentId_programId_sectionId_idx" ON "exam_schedule_entries"("departmentId", "programId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_schedule_entries_examId_subjectId_sectionId_examDate_s_key" ON "exam_schedule_entries"("examId", "subjectId", "sectionId", "examDate", "session", "version");

-- CreateIndex
CREATE INDEX "exam_timetable_publications_examId_status_idx" ON "exam_timetable_publications"("examId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "exam_timetable_publications_examId_version_key" ON "exam_timetable_publications"("examId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "exam_rooms_code_key" ON "exam_rooms"("code");

-- CreateIndex
CREATE INDEX "exam_rooms_building_active_idx" ON "exam_rooms"("building", "active");

-- CreateIndex
CREATE INDEX "exam_seat_allocations_studentId_status_idx" ON "exam_seat_allocations"("studentId", "status");

-- CreateIndex
CREATE INDEX "exam_seat_allocations_examId_scheduleEntryId_roomId_idx" ON "exam_seat_allocations"("examId", "scheduleEntryId", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_seat_allocations_scheduleEntryId_studentId_key" ON "exam_seat_allocations"("scheduleEntryId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_seat_allocations_scheduleEntryId_roomId_seatNumber_key" ON "exam_seat_allocations"("scheduleEntryId", "roomId", "seatNumber");

-- CreateIndex
CREATE INDEX "invigilation_assignments_facultyId_status_idx" ON "invigilation_assignments"("facultyId", "status");

-- CreateIndex
CREATE INDEX "invigilation_assignments_examId_roomId_idx" ON "invigilation_assignments"("examId", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "invigilation_assignments_scheduleEntryId_facultyId_key" ON "invigilation_assignments"("scheduleEntryId", "facultyId");

-- CreateIndex
CREATE INDEX "exam_incidents_examId_status_idx" ON "exam_incidents"("examId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "fee_categories_name_key" ON "fee_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "fee_bills_invoiceNumber_key" ON "fee_bills"("invoiceNumber");

-- CreateIndex
CREATE INDEX "fee_bills_studentId_idx" ON "fee_bills"("studentId");

-- CreateIndex
CREATE INDEX "fee_bills_categoryId_idx" ON "fee_bills"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_receiptNumber_key" ON "fee_payments"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_transactionId_key" ON "fee_payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_providerOrderId_key" ON "fee_payments"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_providerPaymentId_key" ON "fee_payments"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_idempotencyKey_key" ON "fee_payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "fee_payments_billId_status_idx" ON "fee_payments"("billId", "status");

-- CreateIndex
CREATE INDEX "fee_payments_studentId_createdAt_idx" ON "fee_payments"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "fee_payments_status_source_idx" ON "fee_payments"("status", "source");

-- CreateIndex
CREATE UNIQUE INDEX "fee_structures_structureNumber_key" ON "fee_structures"("structureNumber");

-- CreateIndex
CREATE INDEX "fee_structures_academicYearLabel_status_idx" ON "fee_structures"("academicYearLabel", "status");

-- CreateIndex
CREATE INDEX "fee_structures_departmentId_programId_idx" ON "fee_structures"("departmentId", "programId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_ledger_entries_entryNumber_key" ON "finance_ledger_entries"("entryNumber");

-- CreateIndex
CREATE INDEX "finance_ledger_entries_studentId_postedAt_idx" ON "finance_ledger_entries"("studentId", "postedAt");

-- CreateIndex
CREATE INDEX "finance_ledger_entries_billId_postedAt_idx" ON "finance_ledger_entries"("billId", "postedAt");

-- CreateIndex
CREATE INDEX "finance_ledger_entries_paymentId_idx" ON "finance_ledger_entries"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_ledger_entries_sourceType_sourceId_entryType_key" ON "finance_ledger_entries"("sourceType", "sourceId", "entryType");

-- CreateIndex
CREATE UNIQUE INDEX "daily_closings_closingNumber_key" ON "daily_closings"("closingNumber");

-- CreateIndex
CREATE INDEX "daily_closings_status_closingDate_idx" ON "daily_closings"("status", "closingDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_closings_accountantId_closingDate_key" ON "daily_closings"("accountantId", "closingDate");

-- CreateIndex
CREATE INDEX "daily_closing_approvals_closingId_createdAt_idx" ON "daily_closing_approvals"("closingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "finance_requests_requestNumber_key" ON "finance_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "finance_requests_requestType_status_createdAt_idx" ON "finance_requests"("requestType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "finance_requests_studentId_createdAt_idx" ON "finance_requests"("studentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "finance_reconciliations_caseNumber_key" ON "finance_reconciliations"("caseNumber");

-- CreateIndex
CREATE INDEX "finance_reconciliations_status_exceptionType_idx" ON "finance_reconciliations"("status", "exceptionType");

-- CreateIndex
CREATE INDEX "finance_reconciliations_paymentId_idx" ON "finance_reconciliations"("paymentId");

-- CreateIndex
CREATE INDEX "financial_audit_logs_resourceType_resourceId_createdAt_idx" ON "financial_audit_logs"("resourceType", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "financial_audit_logs_actorId_createdAt_idx" ON "financial_audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "library_books_isbn_key" ON "library_books"("isbn");

-- CreateIndex
CREATE INDEX "library_books_isbn_idx" ON "library_books"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "transport_routes_routeName_key" ON "transport_routes"("routeName");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_buildings_name_key" ON "hostel_buildings"("name");

-- CreateIndex
CREATE INDEX "tickets_assignedToUserId_idx" ON "tickets"("assignedToUserId");

-- CreateIndex
CREATE INDEX "timetable_slots_facultyId_dayOfWeek_slotIndex_idx" ON "timetable_slots"("facultyId", "dayOfWeek", "slotIndex");

-- CreateIndex
CREATE INDEX "timetable_slots_roomNo_dayOfWeek_slotIndex_idx" ON "timetable_slots"("roomNo", "dayOfWeek", "slotIndex");

-- CreateIndex
CREATE INDEX "timetable_slots_departmentId_academicYearId_semesterId_idx" ON "timetable_slots"("departmentId", "academicYearId", "semesterId");

-- CreateIndex
CREATE INDEX "timetable_slots_revisionId_idx" ON "timetable_slots"("revisionId");

-- CreateIndex
CREATE INDEX "subject_assignments_facultyId_idx" ON "subject_assignments"("facultyId");

-- CreateIndex
CREATE INDEX "subject_assignments_subjectId_idx" ON "subject_assignments"("subjectId");

-- CreateIndex
CREATE INDEX "subject_assignments_sectionId_idx" ON "subject_assignments"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_assignments_facultyId_subjectId_sectionId_semesterI_key" ON "subject_assignments"("facultyId", "subjectId", "sectionId", "semesterId");

-- CreateIndex
CREATE INDEX "teaching_groups_facultyId_idx" ON "teaching_groups"("facultyId");

-- CreateIndex
CREATE INDEX "teaching_groups_subjectId_idx" ON "teaching_groups"("subjectId");

-- CreateIndex
CREATE INDEX "teaching_groups_academicYearId_idx" ON "teaching_groups"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "teaching_groups_name_subjectId_facultyId_academicYearId_sem_key" ON "teaching_groups"("name", "subjectId", "facultyId", "academicYearId", "semester");

-- CreateIndex
CREATE INDEX "teaching_group_departments_departmentId_idx" ON "teaching_group_departments"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "teaching_group_departments_groupId_departmentId_key" ON "teaching_group_departments"("groupId", "departmentId");

-- CreateIndex
CREATE INDEX "teaching_group_sections_sectionId_idx" ON "teaching_group_sections"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "teaching_group_sections_groupId_sectionId_key" ON "teaching_group_sections"("groupId", "sectionId");

-- CreateIndex
CREATE INDEX "teaching_group_students_studentId_idx" ON "teaching_group_students"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "teaching_group_students_groupId_studentId_key" ON "teaching_group_students"("groupId", "studentId");

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
CREATE UNIQUE INDEX "digital_id_cards_verificationToken_key" ON "digital_id_cards"("verificationToken");

-- CreateIndex
CREATE INDEX "digital_id_cards_ownerId_idx" ON "digital_id_cards"("ownerId");

-- CreateIndex
CREATE INDEX "digital_id_cards_userId_idx" ON "digital_id_cards"("userId");

-- CreateIndex
CREATE INDEX "digital_id_cards_verificationToken_idx" ON "digital_id_cards"("verificationToken");

-- CreateIndex
CREATE INDEX "digital_id_cards_status_idx" ON "digital_id_cards"("status");

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
CREATE UNIQUE INDEX "master_timetables_academicYear_semester_departmentId_progra_key" ON "master_timetables"("academicYear", "semester", "departmentId", "programId", "section", "version");

-- CreateIndex
CREATE INDEX "master_timetable_slots_facultyId_dayOfWeek_periodNumber_idx" ON "master_timetable_slots"("facultyId", "dayOfWeek", "periodNumber");

-- CreateIndex
CREATE INDEX "master_timetable_slots_roomNo_dayOfWeek_periodNumber_idx" ON "master_timetable_slots"("roomNo", "dayOfWeek", "periodNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sports_profiles_userId_key" ON "sports_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_leave_requests_requestNumber_key" ON "student_leave_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "student_leave_requests_studentId_idx" ON "student_leave_requests"("studentId");

-- CreateIndex
CREATE INDEX "student_leave_requests_mentorId_idx" ON "student_leave_requests"("mentorId");

-- CreateIndex
CREATE INDEX "student_leave_requests_hodId_idx" ON "student_leave_requests"("hodId");

-- CreateIndex
CREATE INDEX "student_leave_requests_departmentId_idx" ON "student_leave_requests"("departmentId");

-- CreateIndex
CREATE INDEX "student_leave_requests_status_idx" ON "student_leave_requests"("status");

-- CreateIndex
CREATE INDEX "student_leave_requests_workflowStatus_idx" ON "student_leave_requests"("workflowStatus");

-- CreateIndex
CREATE INDEX "student_leave_requests_startDate_endDate_idx" ON "student_leave_requests"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "request_approvals_requestId_idx" ON "request_approvals"("requestId");

-- CreateIndex
CREATE INDEX "request_approvals_approverId_idx" ON "request_approvals"("approverId");

-- CreateIndex
CREATE INDEX "request_workflow_history_requestId_idx" ON "request_workflow_history"("requestId");

-- CreateIndex
CREATE INDEX "request_workflow_history_performedBy_idx" ON "request_workflow_history"("performedBy");

-- CreateIndex
CREATE INDEX "request_attachments_requestId_idx" ON "request_attachments"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_leave_requests_requestNumber_key" ON "faculty_leave_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "faculty_leave_requests_facultyId_idx" ON "faculty_leave_requests"("facultyId");

-- CreateIndex
CREATE INDEX "faculty_leave_requests_departmentId_idx" ON "faculty_leave_requests"("departmentId");

-- CreateIndex
CREATE INDEX "faculty_leave_requests_status_idx" ON "faculty_leave_requests"("status");

-- CreateIndex
CREATE INDEX "faculty_leave_requests_startDate_endDate_idx" ON "faculty_leave_requests"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "principal_delegation_logs_principalUserId_idx" ON "principal_delegation_logs"("principalUserId");

-- CreateIndex
CREATE INDEX "principal_delegation_logs_actingUserId_idx" ON "principal_delegation_logs"("actingUserId");

-- CreateIndex
CREATE INDEX "principal_delegation_logs_actionType_idx" ON "principal_delegation_logs"("actionType");

-- CreateIndex
CREATE INDEX "principal_delegation_logs_createdAt_idx" ON "principal_delegation_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "institutional_circulars_circularNumber_key" ON "institutional_circulars"("circularNumber");

-- CreateIndex
CREATE INDEX "institutional_circulars_broadcastLevel_idx" ON "institutional_circulars"("broadcastLevel");

-- CreateIndex
CREATE INDEX "institutional_circulars_departmentId_idx" ON "institutional_circulars"("departmentId");

-- CreateIndex
CREATE INDEX "institutional_circulars_publishedAt_idx" ON "institutional_circulars"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "circular_read_receipts_circularId_userId_key" ON "circular_read_receipts"("circularId", "userId");

-- CreateIndex
CREATE INDEX "profile_change_requests_userId_idx" ON "profile_change_requests"("userId");

-- CreateIndex
CREATE INDEX "profile_change_requests_status_idx" ON "profile_change_requests"("status");

-- CreateIndex
CREATE INDEX "export_jobs_requestedBy_idx" ON "export_jobs"("requestedBy");

-- CreateIndex
CREATE INDEX "export_jobs_status_idx" ON "export_jobs"("status");

-- CreateIndex
CREATE INDEX "export_jobs_createdAt_idx" ON "export_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "document_download_audits_userId_idx" ON "document_download_audits"("userId");

-- CreateIndex
CREATE INDEX "document_download_audits_action_idx" ON "document_download_audits"("action");

-- CreateIndex
CREATE INDEX "document_download_audits_createdAt_idx" ON "document_download_audits"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_kpi_definitions_kpiCode_key" ON "analytics_kpi_definitions"("kpiCode");

-- CreateIndex
CREATE INDEX "analytics_kpi_definitions_kpiCode_idx" ON "analytics_kpi_definitions"("kpiCode");

-- CreateIndex
CREATE INDEX "analytics_kpi_definitions_module_idx" ON "analytics_kpi_definitions"("module");

-- CreateIndex
CREATE INDEX "daily_attendance_summaries_departmentId_idx" ON "daily_attendance_summaries"("departmentId");

-- CreateIndex
CREATE INDEX "daily_attendance_summaries_date_idx" ON "daily_attendance_summaries"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_attendance_summaries_date_departmentId_sectionId_key" ON "daily_attendance_summaries"("date", "departmentId", "sectionId");

-- CreateIndex
CREATE INDEX "academic_result_summaries_departmentId_idx" ON "academic_result_summaries"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_result_summaries_examinationId_departmentId_subjec_key" ON "academic_result_summaries"("examinationId", "departmentId", "subjectId");

-- CreateIndex
CREATE INDEX "saved_reports_ownerUserId_idx" ON "saved_reports"("ownerUserId");

-- CreateIndex
CREATE INDEX "saved_reports_datasetCode_idx" ON "saved_reports"("datasetCode");

-- CreateIndex
CREATE INDEX "report_schedules_nextRunAt_idx" ON "report_schedules"("nextRunAt");

-- CreateIndex
CREATE INDEX "report_schedules_status_idx" ON "report_schedules"("status");

-- CreateIndex
CREATE INDEX "department_memberships_userId_idx" ON "department_memberships"("userId");

-- CreateIndex
CREATE INDEX "department_memberships_departmentId_idx" ON "department_memberships"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "department_memberships_userId_departmentId_role_key" ON "department_memberships"("userId", "departmentId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_userId_key" ON "parent_profiles"("userId");

-- CreateIndex
CREATE INDEX "parent_student_relations_studentId_idx" ON "parent_student_relations"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "parent_student_relations_parentId_studentId_key" ON "parent_student_relations"("parentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_taskNumber_key" ON "tasks"("taskNumber");

-- CreateIndex
CREATE INDEX "tasks_createdById_idx" ON "tasks"("createdById");

-- CreateIndex
CREATE INDEX "tasks_departmentId_idx" ON "tasks"("departmentId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "tasks_category_idx" ON "tasks"("category");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_predecessorTaskId_successorTaskId_key" ON "task_dependencies"("predecessorTaskId", "successorTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "governance_documents_documentNumber_key" ON "governance_documents"("documentNumber");

-- CreateIndex
CREATE INDEX "governance_documents_departmentId_idx" ON "governance_documents"("departmentId");

-- CreateIndex
CREATE INDEX "governance_documents_lifecycleState_idx" ON "governance_documents"("lifecycleState");

-- CreateIndex
CREATE UNIQUE INDEX "digital_signatures_qrVerificationToken_key" ON "digital_signatures"("qrVerificationToken");

-- CreateIndex
CREATE INDEX "digital_signatures_documentId_idx" ON "digital_signatures"("documentId");

-- CreateIndex
CREATE INDEX "task_assignees_assigneeId_idx" ON "task_assignees"("assigneeId");

-- CreateIndex
CREATE INDEX "task_assignees_taskId_idx" ON "task_assignees"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignees_taskId_assigneeId_key" ON "task_assignees"("taskId", "assigneeId");

-- CreateIndex
CREATE INDEX "task_status_histories_taskId_idx" ON "task_status_histories"("taskId");

-- CreateIndex
CREATE INDEX "task_comments_taskId_idx" ON "task_comments"("taskId");

-- CreateIndex
CREATE INDEX "task_comments_authorId_idx" ON "task_comments"("authorId");

-- CreateIndex
CREATE INDEX "task_comments_parentId_idx" ON "task_comments"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "task_comment_mentions_commentId_mentionedUserId_key" ON "task_comment_mentions"("commentId", "mentionedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_read_receipts_commentId_userId_key" ON "comment_read_receipts"("commentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_storedName_key" ON "attachments"("storedName");

-- CreateIndex
CREATE INDEX "attachments_uploaderId_idx" ON "attachments"("uploaderId");

-- CreateIndex
CREATE INDEX "attachments_taskId_idx" ON "attachments"("taskId");

-- CreateIndex
CREATE INDEX "attachments_taskCommentId_idx" ON "attachments"("taskCommentId");

-- CreateIndex
CREATE INDEX "file_versions_attachmentId_idx" ON "file_versions"("attachmentId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_isRead_idx" ON "notifications"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_eventType_idx" ON "notifications"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE INDEX "device_tokens_deviceId_idx" ON "device_tokens"("deviceId");

-- CreateIndex
CREATE INDEX "conversations_departmentId_idx" ON "conversations"("departmentId");

-- CreateIndex
CREATE INDEX "conversations_taskId_idx" ON "conversations"("taskId");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_idx" ON "conversation_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "message_attachments_messageId_idx" ON "message_attachments"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "message_read_receipts_messageId_userId_key" ON "message_read_receipts"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_presence_userId_key" ON "user_presence"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "academic_tasks_taskCode_key" ON "academic_tasks"("taskCode");

-- CreateIndex
CREATE INDEX "academic_tasks_createdById_idx" ON "academic_tasks"("createdById");

-- CreateIndex
CREATE INDEX "academic_tasks_status_idx" ON "academic_tasks"("status");

-- CreateIndex
CREATE INDEX "academic_tasks_priority_idx" ON "academic_tasks"("priority");

-- CreateIndex
CREATE INDEX "academic_tasks_category_idx" ON "academic_tasks"("category");

-- CreateIndex
CREATE INDEX "academic_tasks_dueAt_idx" ON "academic_tasks"("dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "academic_task_assignments_assignmentCode_key" ON "academic_task_assignments"("assignmentCode");

-- CreateIndex
CREATE INDEX "academic_task_assignments_taskId_idx" ON "academic_task_assignments"("taskId");

-- CreateIndex
CREATE INDEX "academic_task_assignments_departmentId_idx" ON "academic_task_assignments"("departmentId");

-- CreateIndex
CREATE INDEX "academic_task_assignments_assignedHodUserId_idx" ON "academic_task_assignments"("assignedHodUserId");

-- CreateIndex
CREATE INDEX "academic_task_assignments_status_idx" ON "academic_task_assignments"("status");

-- CreateIndex
CREATE INDEX "academic_task_assignments_currentDueAt_idx" ON "academic_task_assignments"("currentDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "academic_task_assignments_taskId_departmentId_key" ON "academic_task_assignments"("taskId", "departmentId");

-- CreateIndex
CREATE INDEX "academic_task_files_taskId_idx" ON "academic_task_files"("taskId");

-- CreateIndex
CREATE INDEX "academic_task_files_assignmentId_idx" ON "academic_task_files"("assignmentId");

-- CreateIndex
CREATE INDEX "academic_task_files_fileScope_idx" ON "academic_task_files"("fileScope");

-- CreateIndex
CREATE INDEX "academic_task_files_uploadedById_idx" ON "academic_task_files"("uploadedById");

-- CreateIndex
CREATE INDEX "academic_task_queries_taskId_idx" ON "academic_task_queries"("taskId");

-- CreateIndex
CREATE INDEX "academic_task_queries_assignmentId_idx" ON "academic_task_queries"("assignmentId");

-- CreateIndex
CREATE INDEX "academic_task_queries_status_idx" ON "academic_task_queries"("status");

-- CreateIndex
CREATE INDEX "academic_task_queries_createdById_idx" ON "academic_task_queries"("createdById");

-- CreateIndex
CREATE INDEX "academic_task_submissions_assignmentId_idx" ON "academic_task_submissions"("assignmentId");

-- CreateIndex
CREATE INDEX "academic_task_submissions_status_idx" ON "academic_task_submissions"("status");

-- CreateIndex
CREATE INDEX "academic_task_submissions_submittedById_idx" ON "academic_task_submissions"("submittedById");

-- CreateIndex
CREATE INDEX "academic_task_timeline_taskId_idx" ON "academic_task_timeline"("taskId");

-- CreateIndex
CREATE INDEX "academic_task_timeline_assignmentId_idx" ON "academic_task_timeline"("assignmentId");

-- CreateIndex
CREATE INDEX "academic_task_timeline_actorUserId_idx" ON "academic_task_timeline"("actorUserId");

-- CreateIndex
CREATE INDEX "academic_task_timeline_createdAt_idx" ON "academic_task_timeline"("createdAt");

-- CreateIndex
CREATE INDEX "academic_task_reminders_taskId_idx" ON "academic_task_reminders"("taskId");

-- CreateIndex
CREATE INDEX "academic_task_reminders_assignmentId_idx" ON "academic_task_reminders"("assignmentId");

-- CreateIndex
CREATE INDEX "academic_task_reminders_scheduledAt_idx" ON "academic_task_reminders"("scheduledAt");

-- CreateIndex
CREATE INDEX "academic_task_reminders_status_idx" ON "academic_task_reminders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "iqac_audits_auditCode_key" ON "iqac_audits"("auditCode");

-- CreateIndex
CREATE INDEX "iqac_audits_createdById_idx" ON "iqac_audits"("createdById");

-- CreateIndex
CREATE INDEX "iqac_audits_status_idx" ON "iqac_audits"("status");

-- CreateIndex
CREATE INDEX "iqac_audits_dueAt_idx" ON "iqac_audits"("dueAt");

-- CreateIndex
CREATE INDEX "iqac_audit_departments_departmentId_status_idx" ON "iqac_audit_departments"("departmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "iqac_audit_departments_auditId_departmentId_key" ON "iqac_audit_departments"("auditId", "departmentId");

-- CreateIndex
CREATE INDEX "iqac_requirements_auditId_idx" ON "iqac_requirements"("auditId");

-- CreateIndex
CREATE INDEX "iqac_evidence_departmentId_status_idx" ON "iqac_evidence"("departmentId", "status");

-- CreateIndex
CREATE INDEX "iqac_evidence_requirementId_idx" ON "iqac_evidence"("requirementId");

-- CreateIndex
CREATE INDEX "iqac_evidence_repositoryKey_idx" ON "iqac_evidence"("repositoryKey");

-- CreateIndex
CREATE UNIQUE INDEX "iqac_evidence_auditId_departmentId_requirementId_version_key" ON "iqac_evidence"("auditId", "departmentId", "requirementId", "version");

-- CreateIndex
CREATE INDEX "iqac_observations_auditId_idx" ON "iqac_observations"("auditId");

-- CreateIndex
CREATE INDEX "iqac_observations_evidenceId_idx" ON "iqac_observations"("evidenceId");

-- CreateIndex
CREATE INDEX "iqac_audit_timeline_auditId_createdAt_idx" ON "iqac_audit_timeline"("auditId", "createdAt");

-- CreateIndex
CREATE INDEX "academic_task_templates_createdById_idx" ON "academic_task_templates"("createdById");

-- CreateIndex
CREATE INDEX "academic_task_templates_category_idx" ON "academic_task_templates"("category");

-- CreateIndex
CREATE UNIQUE INDEX "admission_coordination_requests_requestCode_key" ON "admission_coordination_requests"("requestCode");

-- CreateIndex
CREATE INDEX "admission_coordination_requests_departmentId_idx" ON "admission_coordination_requests"("departmentId");

-- CreateIndex
CREATE INDEX "admission_coordination_requests_assignedHodUserId_idx" ON "admission_coordination_requests"("assignedHodUserId");

-- CreateIndex
CREATE INDEX "admission_coordination_requests_status_idx" ON "admission_coordination_requests"("status");

-- CreateIndex
CREATE INDEX "admission_coordination_requests_createdById_idx" ON "admission_coordination_requests"("createdById");

-- CreateIndex
CREATE INDEX "department_hod_assignments_departmentId_idx" ON "department_hod_assignments"("departmentId");

-- CreateIndex
CREATE INDEX "department_hod_assignments_hodUserId_idx" ON "department_hod_assignments"("hodUserId");

-- CreateIndex
CREATE INDEX "department_hod_assignments_isActive_idx" ON "department_hod_assignments"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "principal_statuses_principalUserId_key" ON "principal_statuses"("principalUserId");

-- CreateIndex
CREATE INDEX "principal_delegations_principalUserId_idx" ON "principal_delegations"("principalUserId");

-- CreateIndex
CREATE INDEX "principal_delegations_actingUserId_idx" ON "principal_delegations"("actingUserId");

-- CreateIndex
CREATE INDEX "principal_delegations_status_idx" ON "principal_delegations"("status");

-- CreateIndex
CREATE INDEX "approval_assignments_requestId_idx" ON "approval_assignments"("requestId");

-- CreateIndex
CREATE INDEX "approval_assignments_assignedUserId_idx" ON "approval_assignments"("assignedUserId");

-- CreateIndex
CREATE INDEX "approval_assignments_delegationId_idx" ON "approval_assignments"("delegationId");

-- CreateIndex
CREATE INDEX "approval_assignments_status_idx" ON "approval_assignments"("status");

-- CreateIndex
CREATE INDEX "delegation_handovers_principalUserId_idx" ON "delegation_handovers"("principalUserId");

-- CreateIndex
CREATE INDEX "delegation_handovers_delegationId_idx" ON "delegation_handovers"("delegationId");

-- CreateIndex
CREATE INDEX "delegation_action_logs_performedByUserId_idx" ON "delegation_action_logs"("performedByUserId");

-- CreateIndex
CREATE INDEX "delegation_action_logs_recordId_idx" ON "delegation_action_logs"("recordId");

-- CreateIndex
CREATE INDEX "delegation_action_logs_actionType_idx" ON "delegation_action_logs"("actionType");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_idempotencyKey_key" ON "notification_deliveries"("idempotencyKey");

-- CreateIndex
CREATE INDEX "notification_deliveries_notificationId_idx" ON "notification_deliveries"("notificationId");

-- CreateIndex
CREATE INDEX "notification_deliveries_recipientId_idx" ON "notification_deliveries"("recipientId");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_idx" ON "notification_deliveries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "circulars_circularNumber_key" ON "circulars"("circularNumber");

-- CreateIndex
CREATE INDEX "circulars_broadcastLevel_idx" ON "circulars"("broadcastLevel");

-- CreateIndex
CREATE INDEX "circulars_departmentId_idx" ON "circulars"("departmentId");

-- CreateIndex
CREATE INDEX "circulars_authorId_idx" ON "circulars"("authorId");

-- CreateIndex
CREATE INDEX "circulars_publishedAt_idx" ON "circulars"("publishedAt");

-- CreateIndex
CREATE INDEX "circular_recipients_userId_idx" ON "circular_recipients"("userId");

-- CreateIndex
CREATE INDEX "circular_recipients_status_idx" ON "circular_recipients"("status");

-- CreateIndex
CREATE UNIQUE INDEX "circular_recipients_circularId_userId_key" ON "circular_recipients"("circularId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_workflow_events_idempotencyKey_key" ON "approval_workflow_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "approval_workflow_events_requestId_idx" ON "approval_workflow_events"("requestId");

-- CreateIndex
CREATE INDEX "approval_workflow_events_eventType_idx" ON "approval_workflow_events"("eventType");

-- CreateIndex
CREATE INDEX "approval_workflow_events_actorUserId_idx" ON "approval_workflow_events"("actorUserId");

-- CreateIndex
CREATE INDEX "approval_attachments_requestId_idx" ON "approval_attachments"("requestId");

-- CreateIndex
CREATE INDEX "approval_attachments_status_idx" ON "approval_attachments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "library_categories_name_key" ON "library_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "library_categories_code_key" ON "library_categories"("code");

-- CreateIndex
CREATE INDEX "library_issues_bookId_status_idx" ON "library_issues"("bookId", "status");

-- CreateIndex
CREATE INDEX "library_issues_borrowerId_borrowerType_idx" ON "library_issues"("borrowerId", "borrowerType");

-- CreateIndex
CREATE INDEX "library_issues_dueDate_status_idx" ON "library_issues"("dueDate", "status");

-- CreateIndex
CREATE INDEX "library_reservations_bookId_status_idx" ON "library_reservations"("bookId", "status");

-- CreateIndex
CREATE INDEX "library_reservations_reservedById_idx" ON "library_reservations"("reservedById");

-- CreateIndex
CREATE INDEX "library_fines_borrowerId_status_idx" ON "library_fines"("borrowerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_blocks_hostelId_name_key" ON "hostel_blocks"("hostelId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_floors_blockId_number_key" ON "hostel_floors"("blockId", "number");

-- CreateIndex
CREATE INDEX "hostel_rooms_status_idx" ON "hostel_rooms"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_rooms_floorId_roomNumber_key" ON "hostel_rooms"("floorId", "roomNumber");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_beds_roomId_bedNumber_key" ON "hostel_beds"("roomId", "bedNumber");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_allocations_bedId_key" ON "hostel_allocations"("bedId");

-- CreateIndex
CREATE INDEX "hostel_allocations_studentId_status_idx" ON "hostel_allocations"("studentId", "status");

-- CreateIndex
CREATE INDEX "hostel_allocations_roomId_status_idx" ON "hostel_allocations"("roomId", "status");

-- CreateIndex
CREATE INDEX "hostel_room_changes_studentId_idx" ON "hostel_room_changes"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_wardens_userId_hostelId_key" ON "hostel_wardens"("userId", "hostelId");

-- CreateIndex
CREATE INDEX "hostel_mess_attendance_studentId_date_idx" ON "hostel_mess_attendance"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_mess_attendance_messId_studentId_date_meal_key" ON "hostel_mess_attendance"("messId", "studentId", "date", "meal");

-- CreateIndex
CREATE INDEX "hostel_night_attendance_studentId_date_idx" ON "hostel_night_attendance"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_night_attendance_hostelId_studentId_date_key" ON "hostel_night_attendance"("hostelId", "studentId", "date");

-- CreateIndex
CREATE INDEX "hostel_outings_studentId_status_idx" ON "hostel_outings"("studentId", "status");

-- CreateIndex
CREATE INDEX "hostel_visitors_studentId_idx" ON "hostel_visitors"("studentId");

-- CreateIndex
CREATE INDEX "hostel_visitors_hostelId_entryTime_idx" ON "hostel_visitors"("hostelId", "entryTime");

-- CreateIndex
CREATE INDEX "hostel_complaints_hostelId_status_idx" ON "hostel_complaints"("hostelId", "status");

-- CreateIndex
CREATE INDEX "hostel_complaints_studentId_idx" ON "hostel_complaints"("studentId");

-- CreateIndex
CREATE INDEX "hostel_discipline_studentId_idx" ON "hostel_discipline"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicleNumber_key" ON "vehicles"("vehicleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "transport_stops_routeId_sequence_key" ON "transport_stops"("routeId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "transport_drivers_licenseNo_key" ON "transport_drivers"("licenseNo");

-- CreateIndex
CREATE UNIQUE INDEX "transport_route_vehicles_routeId_vehicleId_shift_key" ON "transport_route_vehicles"("routeId", "vehicleId", "shift");

-- CreateIndex
CREATE INDEX "transport_allocations_passengerId_passengerType_idx" ON "transport_allocations"("passengerId", "passengerType");

-- CreateIndex
CREATE INDEX "transport_allocations_routeId_status_idx" ON "transport_allocations"("routeId", "status");

-- CreateIndex
CREATE INDEX "transport_attendance_passengerId_date_idx" ON "transport_attendance"("passengerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "transport_attendance_routeId_passengerId_date_direction_key" ON "transport_attendance"("routeId", "passengerId", "date", "direction");

-- CreateIndex
CREATE INDEX "transport_maintenance_vehicleId_status_idx" ON "transport_maintenance"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "transport_fuel_vehicleId_date_idx" ON "transport_fuel"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "transport_breakdowns_vehicleId_status_idx" ON "transport_breakdowns"("vehicleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "gate_passes_passNumber_key" ON "gate_passes"("passNumber");

-- CreateIndex
CREATE UNIQUE INDEX "gate_passes_qrToken_key" ON "gate_passes"("qrToken");

-- CreateIndex
CREATE INDEX "gate_passes_requesterId_requesterType_idx" ON "gate_passes"("requesterId", "requesterType");

-- CreateIndex
CREATE INDEX "gate_passes_status_validFrom_idx" ON "gate_passes"("status", "validFrom");

-- CreateIndex
CREATE INDEX "visitor_records_entryTime_idx" ON "visitor_records"("entryTime");

-- CreateIndex
CREATE INDEX "visitor_records_hostId_idx" ON "visitor_records"("hostId");

-- CreateIndex
CREATE INDEX "visitor_records_status_idx" ON "visitor_records"("status");

-- CreateIndex
CREATE INDEX "entry_exit_logs_personId_personType_idx" ON "entry_exit_logs"("personId", "personType");

-- CreateIndex
CREATE INDEX "entry_exit_logs_timestamp_idx" ON "entry_exit_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "security_incidents_incidentNumber_key" ON "security_incidents"("incidentNumber");

-- CreateIndex
CREATE INDEX "security_incidents_type_status_idx" ON "security_incidents"("type", "status");

-- CreateIndex
CREATE INDEX "security_incidents_reportedAt_idx" ON "security_incidents"("reportedAt");

-- CreateIndex
CREATE INDEX "security_verifications_targetId_targetType_idx" ON "security_verifications"("targetId", "targetType");

-- CreateIndex
CREATE INDEX "security_verifications_verifierId_idx" ON "security_verifications"("verifierId");

-- CreateIndex
CREATE INDEX "security_verifications_timestamp_idx" ON "security_verifications"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "appraisal_configs_academicYear_title_key" ON "appraisal_configs"("academicYear", "title");

-- CreateIndex
CREATE UNIQUE INDEX "appraisal_categories_configId_code_key" ON "appraisal_categories"("configId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "appraisal_subcategories_categoryId_code_key" ON "appraisal_subcategories"("categoryId", "code");

-- CreateIndex
CREATE INDEX "appraisal_submissions_facultyId_academicYear_idx" ON "appraisal_submissions"("facultyId", "academicYear");

-- CreateIndex
CREATE INDEX "appraisal_submissions_status_idx" ON "appraisal_submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "appraisal_submissions_configId_facultyId_academicYear_key" ON "appraisal_submissions"("configId", "facultyId", "academicYear");

-- CreateIndex
CREATE INDEX "appraisal_entries_submissionId_idx" ON "appraisal_entries"("submissionId");

-- CreateIndex
CREATE INDEX "appraisal_entries_subcategoryId_idx" ON "appraisal_entries"("subcategoryId");

-- CreateIndex
CREATE INDEX "appraisal_verifications_submissionId_idx" ON "appraisal_verifications"("submissionId");

-- CreateIndex
CREATE INDEX "evidence_items_ownerId_ownerType_idx" ON "evidence_items"("ownerId", "ownerType");

-- CreateIndex
CREATE INDEX "evidence_items_category_academicYear_idx" ON "evidence_items"("category", "academicYear");

-- CreateIndex
CREATE INDEX "evidence_items_fileHash_idx" ON "evidence_items"("fileHash");

-- CreateIndex
CREATE INDEX "evidence_links_linkedModule_linkedId_idx" ON "evidence_links"("linkedModule", "linkedId");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_links_evidenceId_linkedModule_linkedId_key" ON "evidence_links"("evidenceId", "linkedModule", "linkedId");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_templates_name_key" ON "certificate_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_templates_code_key" ON "certificate_templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_generations_requestNumber_key" ON "certificate_generations"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_generations_qrVerificationHash_key" ON "certificate_generations"("qrVerificationHash");

-- CreateIndex
CREATE INDEX "certificate_generations_studentId_status_idx" ON "certificate_generations"("studentId", "status");

-- CreateIndex
CREATE INDEX "certificate_generations_templateId_idx" ON "certificate_generations"("templateId");

-- CreateIndex
CREATE INDEX "certificate_generations_status_createdAt_idx" ON "certificate_generations"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_requestNumber_key" ON "purchase_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "purchase_requests_departmentId_status_idx" ON "purchase_requests"("departmentId", "status");

-- CreateIndex
CREATE INDEX "purchase_requests_requestedById_idx" ON "purchase_requests"("requestedById");

-- CreateIndex
CREATE INDEX "purchase_quotations_requestId_idx" ON "purchase_quotations"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNumber_key" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_vendorId_idx" ON "purchase_orders"("vendorId");

-- CreateIndex
CREATE INDEX "purchase_orders_departmentId_status_idx" ON "purchase_orders"("departmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_grnNumber_key" ON "goods_receipts"("grnNumber");

-- CreateIndex
CREATE INDEX "goods_receipts_poId_idx" ON "goods_receipts"("poId");

-- CreateIndex
CREATE UNIQUE INDEX "assets_assetId_key" ON "assets"("assetId");

-- CreateIndex
CREATE INDEX "assets_departmentId_status_idx" ON "assets"("departmentId", "status");

-- CreateIndex
CREATE INDEX "assets_category_idx" ON "assets"("category");

-- CreateIndex
CREATE INDEX "assets_custodianId_idx" ON "assets"("custodianId");

-- CreateIndex
CREATE INDEX "asset_movements_assetId_idx" ON "asset_movements"("assetId");

-- CreateIndex
CREATE INDEX "asset_services_assetId_idx" ON "asset_services"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_itemCode_key" ON "inventory_items"("itemCode");

-- CreateIndex
CREATE INDEX "inventory_items_category_idx" ON "inventory_items"("category");

-- CreateIndex
CREATE INDEX "inventory_items_departmentId_idx" ON "inventory_items"("departmentId");

-- CreateIndex
CREATE INDEX "inventory_transactions_itemId_type_idx" ON "inventory_transactions"("itemId", "type");

-- CreateIndex
CREATE INDEX "inventory_transactions_createdAt_idx" ON "inventory_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_vendorCode_key" ON "vendors"("vendorCode");

-- CreateIndex
CREATE INDEX "vendors_gstNumber_idx" ON "vendors"("gstNumber");

-- CreateIndex
CREATE INDEX "vendors_status_idx" ON "vendors"("status");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_requests_requestNumber_key" ON "maintenance_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "maintenance_requests_category_status_idx" ON "maintenance_requests"("category", "status");

-- CreateIndex
CREATE INDEX "maintenance_requests_reportedById_idx" ON "maintenance_requests"("reportedById");

-- CreateIndex
CREATE INDEX "maintenance_requests_assignedToId_idx" ON "maintenance_requests"("assignedToId");

-- CreateIndex
CREATE INDEX "maintenance_requests_priority_status_idx" ON "maintenance_requests"("priority", "status");

-- CreateIndex
CREATE INDEX "maintenance_works_requestId_idx" ON "maintenance_works"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "bookable_resources_code_key" ON "bookable_resources"("code");

-- CreateIndex
CREATE INDEX "bookable_resources_type_status_idx" ON "bookable_resources"("type", "status");

-- CreateIndex
CREATE INDEX "resource_bookings_resourceId_startTime_endTime_idx" ON "resource_bookings"("resourceId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "resource_bookings_bookedById_idx" ON "resource_bookings"("bookedById");

-- CreateIndex
CREATE INDEX "resource_bookings_status_idx" ON "resource_bookings"("status");

-- CreateIndex
CREATE INDEX "meetings_scheduledDate_idx" ON "meetings"("scheduledDate");

-- CreateIndex
CREATE INDEX "meetings_committeeId_idx" ON "meetings"("committeeId");

-- CreateIndex
CREATE INDEX "meetings_chairPersonId_idx" ON "meetings"("chairPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_invitees_meetingId_userId_key" ON "meeting_invitees"("meetingId", "userId");

-- CreateIndex
CREATE INDEX "meeting_agenda_meetingId_idx" ON "meeting_agenda"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_minutes_meetingId_key" ON "meeting_minutes"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_action_items_meetingId_idx" ON "meeting_action_items"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_action_items_assigneeId_idx" ON "meeting_action_items"("assigneeId");

-- CreateIndex
CREATE INDEX "research_projects_piId_idx" ON "research_projects"("piId");

-- CreateIndex
CREATE INDEX "research_projects_departmentId_idx" ON "research_projects"("departmentId");

-- CreateIndex
CREATE INDEX "research_projects_status_idx" ON "research_projects"("status");

-- CreateIndex
CREATE UNIQUE INDEX "research_publications_doi_key" ON "research_publications"("doi");

-- CreateIndex
CREATE INDEX "research_publications_year_type_idx" ON "research_publications"("year", "type");

-- CreateIndex
CREATE INDEX "research_publications_departmentId_idx" ON "research_publications"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "patents_applicationNo_key" ON "patents"("applicationNo");

-- CreateIndex
CREATE INDEX "patents_status_idx" ON "patents"("status");

-- CreateIndex
CREATE INDEX "patents_departmentId_idx" ON "patents"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "scholarship_schemes_code_key" ON "scholarship_schemes"("code");

-- CreateIndex
CREATE INDEX "scholarship_applications_v2_studentId_idx" ON "scholarship_applications_v2"("studentId");

-- CreateIndex
CREATE INDEX "scholarship_applications_v2_status_idx" ON "scholarship_applications_v2"("status");

-- CreateIndex
CREATE UNIQUE INDEX "scholarship_applications_v2_schemeId_studentId_academicYear_key" ON "scholarship_applications_v2"("schemeId", "studentId", "academicYear");

-- CreateIndex
CREATE INDEX "scholarship_disbursements_applicationId_idx" ON "scholarship_disbursements"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_name_key" ON "clubs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_code_key" ON "clubs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "club_memberships_clubId_studentId_key" ON "club_memberships"("clubId", "studentId");

-- CreateIndex
CREATE INDEX "club_events_startDate_idx" ON "club_events"("startDate");

-- CreateIndex
CREATE INDEX "club_events_clubId_idx" ON "club_events"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_eventId_studentId_key" ON "event_registrations"("eventId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendance_eventId_studentId_date_key" ON "event_attendance"("eventId", "studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "event_certificates_qrHash_key" ON "event_certificates"("qrHash");

-- CreateIndex
CREATE UNIQUE INDEX "event_certificates_eventId_studentId_type_key" ON "event_certificates"("eventId", "studentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_profiles_userId_key" ON "alumni_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_profiles_originalStudentId_key" ON "alumni_profiles"("originalStudentId");

-- CreateIndex
CREATE INDEX "alumni_profiles_departmentId_idx" ON "alumni_profiles"("departmentId");

-- CreateIndex
CREATE INDEX "alumni_profiles_batch_idx" ON "alumni_profiles"("batch");

-- CreateIndex
CREATE INDEX "alumni_profiles_yearOfGraduation_idx" ON "alumni_profiles"("yearOfGraduation");

-- CreateIndex
CREATE INDEX "alumni_employment_alumniId_idx" ON "alumni_employment"("alumniId");

-- CreateIndex
CREATE INDEX "calendar_events_startDate_endDate_idx" ON "calendar_events"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "calendar_events_eventType_idx" ON "calendar_events"("eventType");

-- CreateIndex
CREATE INDEX "calendar_events_scope_departmentId_idx" ON "calendar_events"("scope", "departmentId");

-- CreateIndex
CREATE INDEX "calendar_events_sourceModule_sourceId_idx" ON "calendar_events"("sourceModule", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_alerts_alertNumber_key" ON "emergency_alerts"("alertNumber");

-- CreateIndex
CREATE INDEX "emergency_alerts_status_idx" ON "emergency_alerts"("status");

-- CreateIndex
CREATE INDEX "emergency_alerts_type_idx" ON "emergency_alerts"("type");

-- CreateIndex
CREATE INDEX "emergency_alerts_createdAt_idx" ON "emergency_alerts"("createdAt");

-- CreateIndex
CREATE INDEX "emergency_acknowledgements_alertId_idx" ON "emergency_acknowledgements"("alertId");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_acknowledgements_alertId_userId_key" ON "emergency_acknowledgements"("alertId", "userId");

-- CreateIndex
CREATE INDEX "campus_activities_category_status_idx" ON "campus_activities"("category", "status");

-- CreateIndex
CREATE INDEX "campus_activities_departmentId_idx" ON "campus_activities"("departmentId");

-- CreateIndex
CREATE INDEX "campus_activities_startDate_idx" ON "campus_activities"("startDate");

-- CreateIndex
CREATE INDEX "activity_sessions_activityId_date_idx" ON "activity_sessions"("activityId", "date");

-- CreateIndex
CREATE INDEX "activity_attendance_studentId_date_idx" ON "activity_attendance"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "activity_attendance_sessionId_studentId_date_key" ON "activity_attendance"("sessionId", "studentId", "date");

-- CreateIndex
CREATE INDEX "activity_assessments_studentId_activityId_idx" ON "activity_assessments"("studentId", "activityId");

-- CreateIndex
CREATE INDEX "student_skills_studentId_idx" ON "student_skills"("studentId");

-- CreateIndex
CREATE INDEX "student_skills_skillName_idx" ON "student_skills"("skillName");

-- CreateIndex
CREATE UNIQUE INDEX "student_skills_studentId_skillName_source_key" ON "student_skills"("studentId", "skillName", "source");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_code_key" ON "workflow_definitions"("code");

-- CreateIndex
CREATE INDEX "workflow_definitions_module_isActive_idx" ON "workflow_definitions"("module", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_code_version_key" ON "workflow_definitions"("code", "version");

-- CreateIndex
CREATE INDEX "faculty_teaching_assignments_facultyId_idx" ON "faculty_teaching_assignments"("facultyId");

-- CreateIndex
CREATE INDEX "faculty_teaching_assignments_homeDepartmentId_idx" ON "faculty_teaching_assignments"("homeDepartmentId");

-- CreateIndex
CREATE INDEX "faculty_teaching_assignments_teachingDepartmentId_idx" ON "faculty_teaching_assignments"("teachingDepartmentId");

-- CreateIndex
CREATE INDEX "faculty_teaching_assignments_status_idx" ON "faculty_teaching_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_department_transfers_transferNumber_key" ON "faculty_department_transfers"("transferNumber");

-- CreateIndex
CREATE INDEX "faculty_department_transfers_facultyId_idx" ON "faculty_department_transfers"("facultyId");

-- CreateIndex
CREATE INDEX "faculty_department_transfers_fromDepartmentId_idx" ON "faculty_department_transfers"("fromDepartmentId");

-- CreateIndex
CREATE INDEX "faculty_department_transfers_toDepartmentId_idx" ON "faculty_department_transfers"("toDepartmentId");

-- CreateIndex
CREATE INDEX "faculty_department_transfers_status_idx" ON "faculty_department_transfers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_leave_policies_leaveType_key" ON "faculty_leave_policies"("leaveType");

-- CreateIndex
CREATE INDEX "faculty_leave_ledger_facultyId_leaveType_academicYear_idx" ON "faculty_leave_ledger"("facultyId", "leaveType", "academicYear");

-- CreateIndex
CREATE INDEX "faculty_leave_ledger_referenceRequestId_idx" ON "faculty_leave_ledger"("referenceRequestId");

-- CreateIndex
CREATE INDEX "timetable_slot_overrides_originalFacultyId_date_idx" ON "timetable_slot_overrides"("originalFacultyId", "date");

-- CreateIndex
CREATE INDEX "timetable_slot_overrides_substituteFacultyId_date_idx" ON "timetable_slot_overrides"("substituteFacultyId", "date");

-- CreateIndex
CREATE INDEX "timetable_slot_overrides_leaveRequestId_idx" ON "timetable_slot_overrides"("leaveRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_slot_overrides_timetableSlotId_date_key" ON "timetable_slot_overrides"("timetableSlotId", "date");

-- CreateIndex
CREATE INDEX "campus_office_documents_authorId_idx" ON "campus_office_documents"("authorId");

-- CreateIndex
CREATE INDEX "campus_office_documents_departmentId_idx" ON "campus_office_documents"("departmentId");

-- CreateIndex
CREATE INDEX "campus_office_documents_type_idx" ON "campus_office_documents"("type");

-- CreateIndex
CREATE INDEX "campus_office_documents_status_idx" ON "campus_office_documents"("status");

-- CreateIndex
CREATE INDEX "campus_document_versions_documentId_idx" ON "campus_document_versions"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "campus_document_versions_documentId_versionNumber_key" ON "campus_document_versions"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX "campus_document_comments_documentId_idx" ON "campus_document_comments"("documentId");

-- CreateIndex
CREATE INDEX "campus_form_responses_documentId_idx" ON "campus_form_responses"("documentId");

-- CreateIndex
CREATE INDEX "campus_form_responses_respondentId_idx" ON "campus_form_responses"("respondentId");

-- CreateIndex
CREATE INDEX "campus_drive_items_ownerId_idx" ON "campus_drive_items"("ownerId");

-- CreateIndex
CREATE INDEX "campus_drive_items_departmentId_idx" ON "campus_drive_items"("departmentId");

-- CreateIndex
CREATE INDEX "campus_drive_items_parentId_idx" ON "campus_drive_items"("parentId");

-- CreateIndex
CREATE INDEX "campus_drive_items_scope_idx" ON "campus_drive_items"("scope");

-- CreateIndex
CREATE INDEX "timetable_revisions_departmentId_status_idx" ON "timetable_revisions"("departmentId", "status");

-- CreateIndex
CREATE INDEX "timetable_revisions_effectiveFrom_idx" ON "timetable_revisions"("effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_revisions_departmentId_academicYearId_semesterId__key" ON "timetable_revisions"("departmentId", "academicYearId", "semesterId", "revisionNumber");

-- CreateIndex
CREATE INDEX "timetable_import_batches_departmentId_status_idx" ON "timetable_import_batches"("departmentId", "status");

-- CreateIndex
CREATE INDEX "timetable_issue_reports_departmentId_status_idx" ON "timetable_issue_reports"("departmentId", "status");

-- CreateIndex
CREATE INDEX "timetable_issue_reports_facultyId_idx" ON "timetable_issue_reports"("facultyId");

-- CreateIndex
CREATE INDEX "department_faculty_allocations_departmentId_academicYearId_idx" ON "department_faculty_allocations"("departmentId", "academicYearId");

-- CreateIndex
CREATE INDEX "department_faculty_allocations_facultyId_idx" ON "department_faculty_allocations"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "department_faculty_allocations_departmentId_semesterId_sect_key" ON "department_faculty_allocations"("departmentId", "semesterId", "sectionId", "subjectId", "facultyId", "academicYearId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_committees" ADD CONSTRAINT "user_committees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_committees" ADD CONSTRAINT "user_committees_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_workspaces" ADD CONSTRAINT "user_workspaces_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "permission_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "regulations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_assignedFacultyId_fkey" FOREIGN KEY ("assignedFacultyId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_outcomes" ADD CONSTRAINT "course_outcomes_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_po_mappings" ADD CONSTRAINT "co_po_mappings_coId_fkey" FOREIGN KEY ("coId") REFERENCES "course_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_units" ADD CONSTRAINT "curriculum_units_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_topics" ADD CONSTRAINT "curriculum_topics_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "curriculum_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_materials" ADD CONSTRAINT "curriculum_materials_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_materials" ADD CONSTRAINT "curriculum_materials_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "curriculum_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_materials" ADD CONSTRAINT "curriculum_materials_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "curriculum_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_experiments" ADD CONSTRAINT "lab_experiments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_template_mappings" ADD CONSTRAINT "permission_template_mappings_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "permission_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_template_mappings" ADD CONSTRAINT "permission_template_mappings_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_programDepartmentId_fkey" FOREIGN KEY ("programDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "hostel_buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_transportRouteId_fkey" FOREIGN KEY ("transportRouteId") REFERENCES "transport_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_bills" ADD CONSTRAINT "fee_bills_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_bills" ADD CONSTRAINT "fee_bills_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "fee_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_billId_fkey" FOREIGN KEY ("billId") REFERENCES "fee_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "fee_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_billId_fkey" FOREIGN KEY ("billId") REFERENCES "fee_bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_accountantId_fkey" FOREIGN KEY ("accountantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_closing_approvals" ADD CONSTRAINT "daily_closing_approvals_closingId_fkey" FOREIGN KEY ("closingId") REFERENCES "daily_closings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_closing_approvals" ADD CONSTRAINT "daily_closing_approvals_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_requests" ADD CONSTRAINT "finance_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_requests" ADD CONSTRAINT "finance_requests_billId_fkey" FOREIGN KEY ("billId") REFERENCES "fee_bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_requests" ADD CONSTRAINT "finance_requests_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "fee_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_requests" ADD CONSTRAINT "finance_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_requests" ADD CONSTRAINT "finance_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_reconciliations" ADD CONSTRAINT "finance_reconciliations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "fee_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_reconciliations" ADD CONSTRAINT "finance_reconciliations_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_audit_logs" ADD CONSTRAINT "financial_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_requests" ADD CONSTRAINT "workflow_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_requests" ADD CONSTRAINT "workflow_requests_faculty_requester_id_fkey" FOREIGN KEY ("faculty_requester_id") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "workflow_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "timetable_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_records" ADD CONSTRAINT "counseling_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_records" ADD CONSTRAINT "counseling_records_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_groups" ADD CONSTRAINT "teaching_groups_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_groups" ADD CONSTRAINT "teaching_groups_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_groups" ADD CONSTRAINT "teaching_groups_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_group_departments" ADD CONSTRAINT "teaching_group_departments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "teaching_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_group_departments" ADD CONSTRAINT "teaching_group_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_group_sections" ADD CONSTRAINT "teaching_group_sections_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "teaching_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_group_sections" ADD CONSTRAINT "teaching_group_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_group_students" ADD CONSTRAINT "teaching_group_students_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "teaching_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_group_students" ADD CONSTRAINT "teaching_group_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internships" ADD CONSTRAINT "internships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_documents" ADD CONSTRAINT "internship_documents_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "internships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_documents" ADD CONSTRAINT "internship_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hod_circulars" ADD CONSTRAINT "hod_circulars_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hod_circulars" ADD CONSTRAINT "hod_circulars_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hod_circular_read_trackers" ADD CONSTRAINT "hod_circular_read_trackers_circularId_fkey" FOREIGN KEY ("circularId") REFERENCES "hod_circulars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hod_circular_read_trackers" ADD CONSTRAINT "hod_circular_read_trackers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_intakes" ADD CONSTRAINT "department_intakes_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_timetables" ADD CONSTRAINT "master_timetables_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_timetable_slots" ADD CONSTRAINT "master_timetable_slots_masterTimetableId_fkey" FOREIGN KEY ("masterTimetableId") REFERENCES "master_timetables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_versions" ADD CONSTRAINT "timetable_versions_masterTimetableId_fkey" FOREIGN KEY ("masterTimetableId") REFERENCES "master_timetables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_audit_logs" ADD CONSTRAINT "timetable_audit_logs_masterTimetableId_fkey" FOREIGN KEY ("masterTimetableId") REFERENCES "master_timetables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_leave_requests" ADD CONSTRAINT "student_leave_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_leave_requests" ADD CONSTRAINT "student_leave_requests_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_approvals" ADD CONSTRAINT "request_approvals_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "student_leave_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_workflow_history" ADD CONSTRAINT "request_workflow_history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "student_leave_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "student_leave_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_leave_requests" ADD CONSTRAINT "faculty_leave_requests_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_leave_requests" ADD CONSTRAINT "faculty_leave_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institutional_circulars" ADD CONSTRAINT "institutional_circulars_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institutional_circulars" ADD CONSTRAINT "institutional_circulars_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circular_read_receipts" ADD CONSTRAINT "circular_read_receipts_circularId_fkey" FOREIGN KEY ("circularId") REFERENCES "institutional_circulars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circular_read_receipts" ADD CONSTRAINT "circular_read_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_change_requests" ADD CONSTRAINT "profile_change_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_savedReportId_fkey" FOREIGN KEY ("savedReportId") REFERENCES "saved_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_memberships" ADD CONSTRAINT "department_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_memberships" ADD CONSTRAINT "department_memberships_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_relations" ADD CONSTRAINT "parent_student_relations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_relations" ADD CONSTRAINT "parent_student_relations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_predecessorTaskId_fkey" FOREIGN KEY ("predecessorTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_successorTaskId_fkey" FOREIGN KEY ("successorTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_signatures" ADD CONSTRAINT "digital_signatures_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "governance_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_status_histories" ADD CONSTRAINT "task_status_histories_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_status_histories" ADD CONSTRAINT "task_status_histories_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "task_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comment_mentions" ADD CONSTRAINT "task_comment_mentions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "task_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comment_mentions" ADD CONSTRAINT "task_comment_mentions_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_read_receipts" ADD CONSTRAINT "comment_read_receipts_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "task_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_read_receipts" ADD CONSTRAINT "comment_read_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_taskCommentId_fkey" FOREIGN KEY ("taskCommentId") REFERENCES "task_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_presence" ADD CONSTRAINT "user_presence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_tasks" ADD CONSTRAINT "academic_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_assignments" ADD CONSTRAINT "academic_task_assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "academic_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_assignments" ADD CONSTRAINT "academic_task_assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_assignments" ADD CONSTRAINT "academic_task_assignments_assignedHodUserId_fkey" FOREIGN KEY ("assignedHodUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_assignments" ADD CONSTRAINT "academic_task_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_files" ADD CONSTRAINT "academic_task_files_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "academic_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_files" ADD CONSTRAINT "academic_task_files_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "academic_task_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_files" ADD CONSTRAINT "academic_task_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_queries" ADD CONSTRAINT "academic_task_queries_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "academic_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_queries" ADD CONSTRAINT "academic_task_queries_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "academic_task_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_queries" ADD CONSTRAINT "academic_task_queries_parentQueryId_fkey" FOREIGN KEY ("parentQueryId") REFERENCES "academic_task_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_queries" ADD CONSTRAINT "academic_task_queries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_queries" ADD CONSTRAINT "academic_task_queries_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_submissions" ADD CONSTRAINT "academic_task_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "academic_task_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_submissions" ADD CONSTRAINT "academic_task_submissions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_submissions" ADD CONSTRAINT "academic_task_submissions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_timeline" ADD CONSTRAINT "academic_task_timeline_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "academic_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_timeline" ADD CONSTRAINT "academic_task_timeline_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "academic_task_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_timeline" ADD CONSTRAINT "academic_task_timeline_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_timeline" ADD CONSTRAINT "academic_task_timeline_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_reminders" ADD CONSTRAINT "academic_task_reminders_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "academic_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_reminders" ADD CONSTRAINT "academic_task_reminders_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "academic_task_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_audits" ADD CONSTRAINT "iqac_audits_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_audit_departments" ADD CONSTRAINT "iqac_audit_departments_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "iqac_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_audit_departments" ADD CONSTRAINT "iqac_audit_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_requirements" ADD CONSTRAINT "iqac_requirements_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "iqac_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_evidence" ADD CONSTRAINT "iqac_evidence_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "iqac_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_evidence" ADD CONSTRAINT "iqac_evidence_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_evidence" ADD CONSTRAINT "iqac_evidence_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "iqac_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_evidence" ADD CONSTRAINT "iqac_evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_evidence" ADD CONSTRAINT "iqac_evidence_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_observations" ADD CONSTRAINT "iqac_observations_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "iqac_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_observations" ADD CONSTRAINT "iqac_observations_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "iqac_evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_observations" ADD CONSTRAINT "iqac_observations_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_audit_timeline" ADD CONSTRAINT "iqac_audit_timeline_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "iqac_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iqac_audit_timeline" ADD CONSTRAINT "iqac_audit_timeline_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_task_templates" ADD CONSTRAINT "academic_task_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_coordination_requests" ADD CONSTRAINT "admission_coordination_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_coordination_requests" ADD CONSTRAINT "admission_coordination_requests_assignedHodUserId_fkey" FOREIGN KEY ("assignedHodUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_coordination_requests" ADD CONSTRAINT "admission_coordination_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_coordination_requests" ADD CONSTRAINT "admission_coordination_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_hod_assignments" ADD CONSTRAINT "department_hod_assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_hod_assignments" ADD CONSTRAINT "department_hod_assignments_hodUserId_fkey" FOREIGN KEY ("hodUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_assignments" ADD CONSTRAINT "approval_assignments_delegationId_fkey" FOREIGN KEY ("delegationId") REFERENCES "principal_delegations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_handovers" ADD CONSTRAINT "delegation_handovers_delegationId_fkey" FOREIGN KEY ("delegationId") REFERENCES "principal_delegations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_action_logs" ADD CONSTRAINT "delegation_action_logs_delegationId_fkey" FOREIGN KEY ("delegationId") REFERENCES "principal_delegations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circular_recipients" ADD CONSTRAINT "circular_recipients_circularId_fkey" FOREIGN KEY ("circularId") REFERENCES "circulars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_categories" ADD CONSTRAINT "library_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "library_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_issues" ADD CONSTRAINT "library_issues_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "library_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "library_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_fines" ADD CONSTRAINT "library_fines_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "library_issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_blocks" ADD CONSTRAINT "hostel_blocks_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "hostel_buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_floors" ADD CONSTRAINT "hostel_floors_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "hostel_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "hostel_floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_beds" ADD CONSTRAINT "hostel_beds_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "hostel_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "hostel_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "hostel_beds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_stops" ADD CONSTRAINT "transport_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transport_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_route_vehicles" ADD CONSTRAINT "transport_route_vehicles_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transport_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_route_vehicles" ADD CONSTRAINT "transport_route_vehicles_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_route_vehicles" ADD CONSTRAINT "transport_route_vehicles_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "transport_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_allocations" ADD CONSTRAINT "transport_allocations_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transport_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_allocations" ADD CONSTRAINT "transport_allocations_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "transport_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_maintenance" ADD CONSTRAINT "transport_maintenance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_fuel" ADD CONSTRAINT "transport_fuel_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_breakdowns" ADD CONSTRAINT "transport_breakdowns_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appraisal_categories" ADD CONSTRAINT "appraisal_categories_configId_fkey" FOREIGN KEY ("configId") REFERENCES "appraisal_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appraisal_subcategories" ADD CONSTRAINT "appraisal_subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "appraisal_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appraisal_submissions" ADD CONSTRAINT "appraisal_submissions_configId_fkey" FOREIGN KEY ("configId") REFERENCES "appraisal_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appraisal_entries" ADD CONSTRAINT "appraisal_entries_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "appraisal_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appraisal_entries" ADD CONSTRAINT "appraisal_entries_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "appraisal_subcategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appraisal_verifications" ADD CONSTRAINT "appraisal_verifications_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "appraisal_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_generations" ADD CONSTRAINT "certificate_generations_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_quotations" ADD CONSTRAINT "purchase_quotations_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "purchase_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_movements" ADD CONSTRAINT "asset_movements_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_services" ADD CONSTRAINT "asset_services_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_contacts" ADD CONSTRAINT "vendor_contacts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_works" ADD CONSTRAINT "maintenance_works_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "maintenance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_works" ADD CONSTRAINT "maintenance_works_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "maintenance_technicians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_bookings" ADD CONSTRAINT "resource_bookings_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "bookable_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_invitees" ADD CONSTRAINT "meeting_invitees_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_agenda" ADD CONSTRAINT "meeting_agenda_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_minutes" ADD CONSTRAINT "meeting_minutes_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_items" ADD CONSTRAINT "meeting_action_items_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_applications_v2" ADD CONSTRAINT "scholarship_applications_v2_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "scholarship_schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_disbursements" ADD CONSTRAINT "scholarship_disbursements_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "scholarship_applications_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_events" ADD CONSTRAINT "club_events_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "club_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "club_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_certificates" ADD CONSTRAINT "event_certificates_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "club_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_employment" ADD CONSTRAINT "alumni_employment_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "alumni_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_acknowledgements" ADD CONSTRAINT "emergency_acknowledgements_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "emergency_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "campus_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_attendance" ADD CONSTRAINT "activity_attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "activity_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_assessments" ADD CONSTRAINT "activity_assessments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "activity_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_teaching_assignments" ADD CONSTRAINT "faculty_teaching_assignments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_teaching_assignments" ADD CONSTRAINT "faculty_teaching_assignments_homeDepartmentId_fkey" FOREIGN KEY ("homeDepartmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_teaching_assignments" ADD CONSTRAINT "faculty_teaching_assignments_teachingDepartmentId_fkey" FOREIGN KEY ("teachingDepartmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_teaching_assignments" ADD CONSTRAINT "faculty_teaching_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_department_transfers" ADD CONSTRAINT "faculty_department_transfers_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_department_transfers" ADD CONSTRAINT "faculty_department_transfers_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_department_transfers" ADD CONSTRAINT "faculty_department_transfers_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_leave_ledger" ADD CONSTRAINT "faculty_leave_ledger_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slot_overrides" ADD CONSTRAINT "timetable_slot_overrides_timetableSlotId_fkey" FOREIGN KEY ("timetableSlotId") REFERENCES "timetable_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_office_documents" ADD CONSTRAINT "campus_office_documents_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_office_documents" ADD CONSTRAINT "campus_office_documents_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_document_versions" ADD CONSTRAINT "campus_document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "campus_office_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_document_versions" ADD CONSTRAINT "campus_document_versions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_document_comments" ADD CONSTRAINT "campus_document_comments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "campus_office_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_document_comments" ADD CONSTRAINT "campus_document_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_form_responses" ADD CONSTRAINT "campus_form_responses_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "campus_office_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_drive_items" ADD CONSTRAINT "campus_drive_items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_drive_items" ADD CONSTRAINT "campus_drive_items_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_revisions" ADD CONSTRAINT "timetable_revisions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_revisions" ADD CONSTRAINT "timetable_revisions_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_revisions" ADD CONSTRAINT "timetable_revisions_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_revisions" ADD CONSTRAINT "timetable_revisions_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_import_batches" ADD CONSTRAINT "timetable_import_batches_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_import_batches" ADD CONSTRAINT "timetable_import_batches_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_import_batches" ADD CONSTRAINT "timetable_import_batches_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_import_batches" ADD CONSTRAINT "timetable_import_batches_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "timetable_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_import_batches" ADD CONSTRAINT "timetable_import_batches_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_issue_reports" ADD CONSTRAINT "timetable_issue_reports_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_issue_reports" ADD CONSTRAINT "timetable_issue_reports_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_issue_reports" ADD CONSTRAINT "timetable_issue_reports_timetableSlotId_fkey" FOREIGN KEY ("timetableSlotId") REFERENCES "timetable_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_issue_reports" ADD CONSTRAINT "timetable_issue_reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_faculty_allocations" ADD CONSTRAINT "department_faculty_allocations_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_faculty_allocations" ADD CONSTRAINT "department_faculty_allocations_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_faculty_allocations" ADD CONSTRAINT "department_faculty_allocations_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_faculty_allocations" ADD CONSTRAINT "department_faculty_allocations_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_faculty_allocations" ADD CONSTRAINT "department_faculty_allocations_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_faculty_allocations" ADD CONSTRAINT "department_faculty_allocations_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
