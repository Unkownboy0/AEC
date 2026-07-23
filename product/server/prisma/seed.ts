import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Phase 3 database seeding...');

  // 1. Generate and Create Core Permissions (384 permissions + 18 legacy)
  const modules = [
    'Dashboard', 'Users', 'Roles', 'Students', 'Admissions', 'Faculty',
    'Departments', 'Courses', 'Subjects', 'Attendance', 'Examinations',
    'Marks', 'Results', 'Fees', 'Library', 'Hostel', 'Transport',
    'Inventory', 'Payroll', 'Certificates', 'Reports', 'Settings',
    'Notifications', 'Audit Logs'
  ];

  const actions = [
    'View', 'Create', 'Edit', 'Delete', 'Approve', 'Reject', 'Publish',
    'Archive', 'Restore', 'Export', 'Import', 'Print', 'Download',
    'Upload', 'Assign', 'Manage'
  ];

  const generatedPermissions = [];
  for (const mod of modules) {
    const modKey = mod.toLowerCase().replace(' ', '_');
    for (const act of actions) {
      const actKey = act.toLowerCase();
      generatedPermissions.push({
        name: `${modKey}:${actKey}`,
        description: `${act} permission for ${mod} module`
      });
    }
  }

  const legacyPermissions = [
    { name: 'users:read', description: 'Read system users profile' },
    { name: 'users:write', description: 'Create, update, delete system users' },
    { name: 'settings:read', description: 'Read system configuration' },
    { name: 'settings:write', description: 'Update system configuration' },
    { name: 'roles:read', description: 'Read roles and permissions' },
    { name: 'roles:write', description: 'Manage roles and permissions' },
    { name: 'audit:read', description: 'View system audit logs' },
    { name: 'academics:read', description: 'Read academic configurations' },
    { name: 'academics:write', description: 'Manage academic configurations' },
    { name: 'masters:read', description: 'Read master lists data' },
    { name: 'masters:write', description: 'Manage master lists data' },
    { name: 'backups:read', description: 'Read database backup logs' },
    { name: 'backups:write', description: 'Trigger manual database backups' },
    { name: 'files:read', description: 'Read media library files' },
    { name: 'files:write', description: 'Upload and delete media library files' },
    { name: 'notifications:read', description: 'Read notification logs' },
    { name: 'notifications:write', description: 'Send announcements and logs' },
    { name: 'reports:read', description: 'View and export system reports' },
  ];

  const permissionsData = [...generatedPermissions, ...legacyPermissions];

  const permissions = [];
  for (const perm of permissionsData) {
    const dbPerm = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
    permissions.push(dbPerm);
  }
  console.log(`🔑 Seeded ${permissions.length} permissions.`);

  // 2. Create the 17 Final Default System Roles based on Hierarchy
  const rolesData = [
    { name: 'Super Admin', description: 'Highest Authority - Full Platform Access', color: '#ef4444', icon: 'ShieldAlert', priority: 1, hierarchy: 1, isSystem: true },
    { name: 'College Admin', description: 'Full access for assigned college only', color: '#3b82f6', icon: 'Building', priority: 2, hierarchy: 2, isSystem: true },
    { name: 'Principal', description: 'Institution-wide Executive Monitoring', color: '#f59e0b', icon: 'Award', priority: 3, hierarchy: 3, isSystem: true },
    { name: 'Vice Principal', description: 'Operations & Academic Monitoring', color: '#eab308', icon: 'Award', priority: 4, hierarchy: 4, isSystem: true },
    { name: 'Academic Dean', description: 'Responsible for Academics & Curriculum', color: '#10b981', icon: 'GraduationCap', priority: 5, hierarchy: 5, isSystem: true },
    { name: 'Admission Dean', description: 'Responsible for Admissions & Onboarding', color: '#6366f1', icon: 'UserPlus', priority: 6, hierarchy: 6, isSystem: true },
    { name: 'Accounts Officer', description: 'Responsible for Fee Collection & Finance', color: '#06b6d4', icon: 'Landmark', priority: 7, hierarchy: 7, isSystem: true },
    { name: 'HOD', description: 'Department-Level Authority & Management', color: '#8b5cf6', icon: 'Users', priority: 8, hierarchy: 8, isSystem: true },
    { name: 'Mentor', description: 'Assigned Students Management & Level 1 Approvals', color: '#a855f7', icon: 'UserCheck', priority: 9, hierarchy: 9, isSystem: true },
    { name: 'Faculty', description: 'Subject-Based Access and Marks Allocation', color: '#ec4899', icon: 'BookOpen', priority: 10, hierarchy: 10, isSystem: true },
    { name: 'Student', description: 'Own Profile Access & Academic Assistant', color: '#14b8a6', icon: 'GraduationCap', priority: 11, hierarchy: 11, isSystem: true },
    { name: 'Parent', description: 'Assigned Child Access & Monitoring Only', color: '#6b7280', icon: 'Heart', priority: 12, hierarchy: 12, isSystem: true },
    { name: 'Placement Officer', description: 'Placement Drives & Corporate Relations', color: '#3b82f6', icon: 'Briefcase', priority: 13, hierarchy: 13, isSystem: true },
    { name: 'Librarian', description: 'Book Inventory & Issue Ledger Management', color: '#059669', icon: 'BookOpen', priority: 14, hierarchy: 14, isSystem: true },
    { name: 'Examination Cell', description: 'Exam Scheduling, Hall Tickets & Grade Sheets', color: '#d97706', icon: 'FileSpreadsheet', priority: 15, hierarchy: 15, isSystem: true },
    { name: 'Hostel Warden', description: 'Hostel Rooms Allocation & Hostel Attendance', color: '#4f46e5', icon: 'Home', priority: 16, hierarchy: 16, isSystem: true },
    { name: 'Transport Manager', description: 'Bus Routes, Drivers & Student Vehicle Allocation', color: '#2563eb', icon: 'Truck', priority: 17, hierarchy: 17, isSystem: true }
  ];

  const rolesMap: { [key: string]: any } = {};

  for (const r of rolesData) {
    const dbRole = await prisma.role.upsert({
      where: { name: r.name },
      update: {
        description: r.description,
        color: r.color,
        icon: r.icon,
        priority: r.priority,
        hierarchy: r.hierarchy,
        isSystem: r.isSystem,
      },
      create: r,
    });
    rolesMap[r.name] = dbRole;
  }
  console.log(`🛡️ Seeded ${rolesData.length} roles.`);

  // 3. Connect Permissions to Super Admin
  const superAdminRole = rolesMap['Super Admin'];
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log('🔗 Super Admin Role mapped with all permissions.');

  // 3b. Connect Permissions to College Admin
  const collegeAdminRole = rolesMap['College Admin'];
  let collegeAdminPermsCount = 0;
  for (const perm of permissions) {
    if (perm.name.startsWith('settings:') || perm.name.startsWith('backups:')) {
      continue;
    }
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: collegeAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: collegeAdminRole.id,
        permissionId: perm.id,
      },
    });
    collegeAdminPermsCount++;
  }
  console.log(`🔗 College Admin Role mapped with ${collegeAdminPermsCount} permissions.`);

  // 3c. Connect Permissions to Admission Dean
  const admissionDeanRole = rolesMap['Admission Dean'];
  let admissionDeanPermsCount = 0;
  for (const perm of permissions) {
    if (
      perm.name.startsWith('admissions:') ||
      perm.name.startsWith('scholarships:') ||
      perm.name.startsWith('enquiries:') ||
      perm.name.startsWith('counselling:') ||
      perm.name.startsWith('students:') ||
      perm.name.startsWith('reports:') ||
      perm.name.startsWith('fees:')
    ) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: admissionDeanRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: admissionDeanRole.id,
          permissionId: perm.id,
        },
      });
      admissionDeanPermsCount++;
    }
  }
  console.log(`🔗 Admission Dean Role mapped with ${admissionDeanPermsCount} permissions.`);

  // 4. Create default Super Admin user
  const adminEmail = 'admin@geetorus.com';
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        status: 'ACTIVE',
        roleId: superAdminRole.id,
      },
    });
    console.log(`👤 Default Super Admin created: ${adminEmail}`);
  }

  // 5. Seed College & System Settings
  const settingsData = [
    { key: 'COLLEGE_NAME', value: 'Geetorus Institute of Technology' },
    { key: 'COLLEGE_EMAIL', value: 'info@geetorus.com' },
    { key: 'COLLEGE_PHONE', value: '+91 98765 43210' },
    { key: 'COLLEGE_WEBSITE', value: 'https://geetorus.com' },
    { key: 'COLLEGE_GST', value: '33AABCC1234D1Z2' },
    { key: 'COLLEGE_ADDRESS', value: '123 Education Boulevard, Campus City, 600001' },
    { key: 'COLLEGE_UNIVERSITY', value: 'National Technical University' },
    { key: 'COLLEGE_AFFILIATION', value: 'AICTE Approved, Grade A+' },
    { key: 'SMTP_HOST', value: 'smtp.mailtrap.io' },
    { key: 'SMTP_PORT', value: '2525' },
    { key: 'SMTP_USER', value: 'geetorus-smtp-sandbox' },
    { key: 'SMTP_PASS', value: 'secret-smtp-password' },
    { key: 'SMS_GATEWAY_URL', value: 'https://api.sms-gateway.com/send' },
    { key: 'SMS_API_KEY', value: 'sms-secret-key-123' },
    { key: 'BRAND_COLOR', value: '#4f46e5' },
    { key: 'THEME', value: 'system' },
    { key: 'CURRENCY', value: 'USD' },
    { key: 'TIMEZONE', value: 'IST' },
    { key: 'APPROVAL_MODE', value: 'MENTOR_HOD' },
  ];

  for (const set of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: set.key },
      update: {},
      create: set,
    });
  }
  console.log('⚙️ Seeded system and college settings.');

  // 6. Seed Academic Year
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2026-2027' },
    update: {
      status: 'ACTIVE',
      isCurrent: true,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-05-31'),
    },
    create: {
      name: '2026-2027',
      status: 'ACTIVE',
      isCurrent: true,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-05-31'),
    },
  });
  console.log(`📅 Seeded Academic Year: ${academicYear.name}`);

  // 7. Seed Departments, Programs, Courses, Semesters & Sections
  const deptCSE = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {
      shortName: 'CSE Dept',
      description: 'Department of Computer Science & Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#4f46e5',
      email: 'cse.head@geetorus.com',
      phone: '+91 99999 11111',
      website: 'https://cse.geetorus.com',
      officeLocation: 'Block C, Room 301',
      establishedYear: 2010,
      hodName: 'Dr. John Doe',
      academicYearId: academicYear.id,
    },
    create: {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      shortName: 'CSE Dept',
      description: 'Department of Computer Science & Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#4f46e5',
      email: 'cse.head@geetorus.com',
      phone: '+91 99999 11111',
      website: 'https://cse.geetorus.com',
      officeLocation: 'Block C, Room 301',
      establishedYear: 2010,
      hodName: 'Dr. John Doe',
      academicYearId: academicYear.id,
    },
  });

  const deptECE = await prisma.department.upsert({
    where: { code: 'ECE' },
    update: {
      shortName: 'ECE Dept',
      description: 'Department of Electronics & Communication Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#10b981',
      email: 'ece.head@geetorus.com',
      phone: '+91 99999 22222',
      website: 'https://ece.geetorus.com',
      officeLocation: 'Block B, Room 201',
      establishedYear: 2012,
      hodName: 'Dr. Sarah Smith',
      academicYearId: academicYear.id,
    },
    create: {
      name: 'Electronics & Communication Engineering',
      code: 'ECE',
      shortName: 'ECE Dept',
      description: 'Department of Electronics & Communication Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#10b981',
      email: 'ece.head@geetorus.com',
      phone: '+91 99999 22222',
      website: 'https://ece.geetorus.com',
      officeLocation: 'Block B, Room 201',
      establishedYear: 2012,
      hodName: 'Dr. Sarah Smith',
      academicYearId: academicYear.id,
    },
  });

  const deptIT = await prisma.department.upsert({
    where: { code: 'IT' },
    update: { academicYearId: academicYear.id },
    create: {
      name: 'Information Technology',
      code: 'IT',
      shortName: 'IT Dept',
      description: 'Department of Information Technology',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#3b82f6',
      email: 'it.head@geetorus.com',
      phone: '+91 99999 33333',
      officeLocation: 'Block A, Room 101',
      establishedYear: 2014,
      hodName: 'Dr. Robert Vance',
      academicYearId: academicYear.id,
    },
  });

  const deptEEE = await prisma.department.upsert({
    where: { code: 'EEE' },
    update: { academicYearId: academicYear.id },
    create: {
      name: 'Electrical & Electronics Engineering',
      code: 'EEE',
      shortName: 'EEE Dept',
      description: 'Department of Electrical & Electronics Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#f59e0b',
      email: 'eee.head@geetorus.com',
      phone: '+91 99999 44444',
      officeLocation: 'Block D, Room 102',
      establishedYear: 2011,
      hodName: 'Dr. Alan Turing',
      academicYearId: academicYear.id,
    },
  });

  const deptMECH = await prisma.department.upsert({
    where: { code: 'MECH' },
    update: { academicYearId: academicYear.id },
    create: {
      name: 'Mechanical Engineering',
      code: 'MECH',
      shortName: 'MECH Dept',
      description: 'Department of Mechanical Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#ef4444',
      email: 'mech.head@geetorus.com',
      phone: '+91 99999 55555',
      officeLocation: 'Workshop Block, Room 01',
      establishedYear: 2008,
      hodName: 'Dr. Henry Ford',
      academicYearId: academicYear.id,
    },
  });

  const deptAIDS = await prisma.department.upsert({
    where: { code: 'AI&DS' },
    update: { academicYearId: academicYear.id },
    create: {
      name: 'Artificial Intelligence & Data Science',
      code: 'AI&DS',
      shortName: 'AI&DS Dept',
      description: 'Department of Artificial Intelligence & Data Science',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#8b5cf6',
      email: 'aids.head@geetorus.com',
      phone: '+91 99999 66666',
      officeLocation: 'Innovation Hub, Room 404',
      establishedYear: 2021,
      hodName: 'Dr. Geoffrey Hinton',
      academicYearId: academicYear.id,
    },
  });

  const deptCIVIL = await prisma.department.upsert({
    where: { code: 'CIVIL' },
    update: { academicYearId: academicYear.id },
    create: {
      name: 'Civil Engineering',
      code: 'CIVIL',
      shortName: 'CIVIL Dept',
      description: 'Department of Civil Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#64748b',
      email: 'civil.head@geetorus.com',
      phone: '+91 99999 77777',
      officeLocation: 'Structures Block, Room 10',
      establishedYear: 2009,
      hodName: 'Dr. Gustave Eiffel',
      academicYearId: academicYear.id,
    },
  });

  const programBTech = await prisma.program.upsert({
    where: { name_departmentId: { name: 'Bachelor of Technology', departmentId: deptCSE.id } },
    update: {
      code: 'B.Tech',
      duration: 4,
      level: 'UG',
      credits: 160,
      status: 'ACTIVE',
      coordinator: 'Prof. Alan Turing',
    },
    create: {
      name: 'Bachelor of Technology',
      code: 'B.Tech',
      duration: 4,
      level: 'UG',
      credits: 160,
      status: 'ACTIVE',
      coordinator: 'Prof. Alan Turing',
      departmentId: deptCSE.id,
    },
  });

  const courseCSE = await prisma.course.upsert({
    where: { name_programId: { name: 'Computer Science Engineering', programId: programBTech.id } },
    update: {
      code: 'CSE-101',
      duration: 4,
      credits: 160,
      regulation: 'R26',
      coordinator: 'Prof. Alan Turing',
      description: 'Standard 4-year undergraduate B.Tech program in CSE',
      status: 'ACTIVE',
      departmentId: deptCSE.id,
    },
    create: {
      name: 'Computer Science Engineering',
      code: 'CSE-101',
      duration: 4,
      credits: 160,
      regulation: 'R26',
      coordinator: 'Prof. Alan Turing',
      description: 'Standard 4-year undergraduate B.Tech program in CSE',
      status: 'ACTIVE',
      programId: programBTech.id,
      departmentId: deptCSE.id,
    },
  });

  // Semester 1
  const sem1 = await prisma.semester.upsert({
    where: { number_courseId: { number: 1, courseId: courseCSE.id } },
    update: {
      name: 'Semester 1',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-11-30'),
      status: 'ACTIVE',
      isCurrent: true,
      credits: 20,
      programId: programBTech.id,
      academicYearId: academicYear.id,
    },
    create: {
      number: 1,
      name: 'Semester 1',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-11-30'),
      status: 'ACTIVE',
      isCurrent: true,
      credits: 20,
      courseId: courseCSE.id,
      programId: programBTech.id,
      academicYearId: academicYear.id,
    },
  });

  // Section A
  const secA = await prisma.section.upsert({
    where: { name_semesterId: { name: 'Section A', semesterId: sem1.id } },
    update: {
      capacity: 60,
      classAdvisor: 'Mrs. Ada Lovelace',
      room: 'Room 305',
      status: 'ACTIVE',
      programId: programBTech.id,
      departmentId: deptCSE.id,
    },
    create: {
      name: 'Section A',
      capacity: 60,
      classAdvisor: 'Mrs. Ada Lovelace',
      room: 'Room 305',
      status: 'ACTIVE',
      semesterId: sem1.id,
      programId: programBTech.id,
      departmentId: deptCSE.id,
    },
  });

  // Subjects
  await prisma.subject.upsert({
    where: { code: 'CS101' },
    update: {
      name: 'Introduction to Programming',
      credits: 4,
      theoryHours: 3,
      practicalHours: 2,
      tutorialHours: 0,
      internalMarks: 40,
      externalMarks: 60,
      passingMarks: 40,
      isCore: true,
      isLab: true,
      subjectCoordinator: 'Mrs. Ada Lovelace',
      description: 'Basics of C/C++ programming and problem solving',
      status: 'ACTIVE',
      semesterId: sem1.id,
      departmentId: deptCSE.id,
      programId: programBTech.id,
      sectionId: secA.id,
    },
    create: {
      name: 'Introduction to Programming',
      code: 'CS101',
      credits: 4,
      theoryHours: 3,
      practicalHours: 2,
      tutorialHours: 0,
      internalMarks: 40,
      externalMarks: 60,
      passingMarks: 40,
      isCore: true,
      isLab: true,
      subjectCoordinator: 'Mrs. Ada Lovelace',
      description: 'Basics of C/C++ programming and problem solving',
      status: 'ACTIVE',
      semesterId: sem1.id,
      departmentId: deptCSE.id,
      programId: programBTech.id,
      sectionId: secA.id,
    },
  });

  await prisma.subject.upsert({
    where: { code: 'MA101' },
    update: {
      name: 'Engineering Mathematics-I',
      credits: 4,
      theoryHours: 3,
      practicalHours: 0,
      tutorialHours: 1,
      internalMarks: 40,
      externalMarks: 60,
      passingMarks: 40,
      isCore: true,
      isLab: false,
      subjectCoordinator: 'Dr. Carl Gauss',
      description: 'Calculus, linear algebra and differential equations',
      status: 'ACTIVE',
      semesterId: sem1.id,
      departmentId: deptCSE.id,
      programId: programBTech.id,
      sectionId: secA.id,
    },
    create: {
      name: 'Engineering Mathematics-I',
      code: 'MA101',
      credits: 4,
      theoryHours: 3,
      practicalHours: 0,
      tutorialHours: 1,
      internalMarks: 40,
      externalMarks: 60,
      passingMarks: 40,
      isCore: true,
      isLab: false,
      subjectCoordinator: 'Dr. Carl Gauss',
      description: 'Calculus, linear algebra and differential equations',
      status: 'ACTIVE',
      semesterId: sem1.id,
      departmentId: deptCSE.id,
      programId: programBTech.id,
      sectionId: secA.id,
    },
  });
  console.log('🏫 Seeded academic structures (Dept, Program, Course, Sem, Subjects).');

  // 8. Seed Master Data Records
  const mastersData = [
    // Genders
    { type: 'GENDER', value: 'Male' },
    { type: 'GENDER', value: 'Female' },
    { type: 'GENDER', value: 'Other' },
    // Blood Groups
    { type: 'BLOOD_GROUP', value: 'A+' },
    { type: 'BLOOD_GROUP', value: 'O+' },
    { type: 'BLOOD_GROUP', value: 'B+' },
    { type: 'BLOOD_GROUP', value: 'AB+' },
    // Religions
    { type: 'RELIGION', value: 'Hinduism' },
    { type: 'RELIGION', value: 'Islam' },
    { type: 'RELIGION', value: 'Christianity' },
    { type: 'RELIGION', value: 'Sikhism' },
    // Hostel Blocks
    { type: 'HOSTEL_BLOCK', value: 'Ramanujan Block (Boys)' },
    { type: 'HOSTEL_BLOCK', value: 'Curie Block (Girls)' },
    // Genders
    { type: 'CATEGORY', value: 'General' },
    { type: 'CATEGORY', value: 'OBC' },
    { type: 'CATEGORY', value: 'SC/ST' },
  ];

  for (const master of mastersData) {
    await prisma.masterRecord.upsert({
      where: { type_value: { type: master.type, value: master.value } },
      update: {},
      create: master,
    });
  }
  console.log('📦 Seeded master records.');

  // 9. Seed Hostel
  const hostel = await prisma.hostelBuilding.upsert({
    where: { name: 'Ramanujan Block (Boys)' },
    update: {},
    create: {
      name: 'Ramanujan Block (Boys)',
      type: 'BOYS',
      description: 'Engineering boys hostel block',
      rooms: JSON.stringify([{ roomNo: '101', capacity: 3, occupied: 0 }]),
    },
  });

  // 10. Seed Transport
  const transport = await prisma.transportRoute.upsert({
    where: { routeName: 'Route 10A - Campus Express' },
    update: {},
    create: {
      routeName: 'Route 10A - Campus Express',
      vehicleNo: 'TN-07-BY-1234',
      driverName: 'Mr. Rajesh Kumar',
      driverPhone: '+91 98400 12345',
      stops: JSON.stringify([{ stopName: 'Central Station', fee: 150 }, { stopName: 'Koyambedu', fee: 200 }]),
      monthlyFee: 150.00,
    },
  });

  // 11. Seed Faculty & HOD Users
  const facultyRole = rolesMap['Faculty'];
  const studentRole = rolesMap['Student'];
  const parentRole = rolesMap['Parent'];
  const hodRole = rolesMap['HOD'];
  const principalRole = rolesMap['Principal'];

  const passwordHash = await bcrypt.hash('Campus@123', 10);

  // ── College Admin ─────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'college.admin@geetorus.com' },
    update: { phone: '9800000001' },
    create: {
      email:        'college.admin@geetorus.com',
      passwordHash: await bcrypt.hash('ColAdmin@123', 10),
      firstName:    'College',
      lastName:     'Admin',
      phone:        '9800000001',
      status:       'ACTIVE',
      roleId:       rolesMap['College Admin'].id,
    },
  });

  // ── Vice Principal ────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'vp@geetorus.com' },
    update: { phone: '9800000002' },
    create: {
      email:        'vp@geetorus.com',
      passwordHash: await bcrypt.hash('VP@123456', 10),
      firstName:    'Vice',
      lastName:     'Principal',
      phone:        '9800000002',
      status:       'ACTIVE',
      roleId:       rolesMap['Vice Principal'].id,
    },
  });

  // ── Academic Dean ─────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'academic.dean@geetorus.com' },
    update: { phone: '9800000003' },
    create: {
      email:        'academic.dean@geetorus.com',
      passwordHash: await bcrypt.hash('AcaDean@123', 10),
      firstName:    'Academic',
      lastName:     'Dean',
      phone:        '9800000003',
      status:       'ACTIVE',
      roleId:       rolesMap['Academic Dean'].id,
    },
  });

  // ── Admission Dean (mapped to Admission Officer role) ─────────────────────
  await prisma.user.upsert({
    where: { email: 'admission.dean@geetorus.com' },
    update: { phone: '9800000004' },
    create: {
      email:        'admission.dean@geetorus.com',
      passwordHash: await bcrypt.hash('AdmDean@123', 10),
      firstName:    'Admission',
      lastName:     'Dean',
      phone:        '9800000004',
      status:       'ACTIVE',
      roleId:       rolesMap['Admission Dean'].id,
    },
  });

  console.log('👤 Seeded College Admin, VP, Academic Dean, Admission Dean accounts.');


  // Principal User
  const principalUser = await prisma.user.upsert({
    where: { email: 'principal@geetorus.com' },
    update: {},
    create: {
      email: 'principal@geetorus.com',
      passwordHash,
      firstName: 'Charles',
      lastName: 'Xavier',
      status: 'ACTIVE',
      roleId: principalRole.id,
    },
  });

  // HOD Users for all Departments
  const hodsToSeed = [
    { email: 'cse.head@geetorus.com', empId: 'HOD001', first: 'John', last: 'Doe', dept: deptCSE, name: 'Dr. John Doe', qual: 'PhD in CSE' },
    { email: 'ece.head@geetorus.com', empId: 'HOD002', first: 'Sarah', last: 'Smith', dept: deptECE, name: 'Dr. Sarah Smith', qual: 'PhD in ECE' },
    { email: 'it.head@geetorus.com', empId: 'HOD003', first: 'Robert', last: 'Vance', dept: deptIT, name: 'Dr. Robert Vance', qual: 'PhD in IT' },
    { email: 'eee.head@geetorus.com', empId: 'HOD004', first: 'Alan', last: 'Turing', dept: deptEEE, name: 'Dr. Alan Turing', qual: 'PhD in Electrical Engg' },
    { email: 'mech.head@geetorus.com', empId: 'HOD005', first: 'Henry', last: 'Ford', dept: deptMECH, name: 'Dr. Henry Ford', qual: 'PhD in Mechanical' },
    { email: 'aids.head@geetorus.com', empId: 'HOD006', first: 'Geoffrey', last: 'Hinton', dept: deptAIDS, name: 'Dr. Geoffrey Hinton', qual: 'PhD in AI' },
    { email: 'civil.head@geetorus.com', empId: 'HOD007', first: 'Gustave', last: 'Eiffel', dept: deptCIVIL, name: 'Dr. Gustave Eiffel', qual: 'PhD in Civil' },
  ];

  for (const h of hodsToSeed) {
    const u = await prisma.user.upsert({
      where: { email: h.email },
      update: {},
      create: {
        email: h.email,
        passwordHash,
        firstName: h.first,
        lastName: h.last,
        status: 'ACTIVE',
        roleId: hodRole.id,
      },
    });

    const f = await prisma.faculty.upsert({
      where: { userId: u.id },
      update: { departmentId: h.dept.id, employeeId: h.empId },
      create: {
        employeeId: h.empId,
        firstName: h.first,
        lastName: h.last,
        email: h.email,
        phone: '+91 99999 00000',
        dob: new Date('1980-01-01'),
        dateOfJoining: new Date('2015-06-01'),
        designation: 'Professor & HOD',
        qualification: h.qual,
        experience: 15,
        status: 'ACTIVE',
        departmentId: h.dept.id,
        userId: u.id,
      },
    });

    await prisma.department.update({
      where: { id: h.dept.id },
      data: { hodId: f.id, hodName: h.name },
    });
  }

  // Faculty/Mentor User (Ada Lovelace)
  const mentorUser = await prisma.user.upsert({
    where: { email: 'ada.lovelace@geetorus.com' },
    update: {},
    create: {
      email: 'ada.lovelace@geetorus.com',
      passwordHash,
      firstName: 'Ada',
      lastName: 'Lovelace',
      status: 'ACTIVE',
      roleId: facultyRole.id, // Faculty double as Mentors/Class Advisors
    },
  });

  const faculty = await prisma.faculty.upsert({
    where: { employeeId: 'EMP001' },
    update: { userId: mentorUser.id },
    create: {
      employeeId: 'EMP001',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada.lovelace@geetorus.com',
      phone: '+91 99400 12345',
      dob: new Date('1990-12-10'),
      dateOfJoining: new Date('2020-06-01'),
      designation: 'Assistant Professor',
      qualification: 'PhD in Computer Science',
      experience: 8,
      status: 'ACTIVE',
      departmentId: deptCSE.id,
      userId: mentorUser.id,
    },
  });

  // Map Class Advisor in Section
  await prisma.section.update({
    where: { id: secA.id },
    data: { classAdvisor: faculty.id },
  });

  // 12. Seed Student & Parent Users
  const studentUser = await prisma.user.upsert({
    where: { email: 'john.smith@gmail.com' },
    update: {},
    create: {
      email: 'john.smith@gmail.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Smith',
      status: 'ACTIVE',
      roleId: studentRole.id,
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@gmail.com' },
    update: {},
    create: {
      email: 'parent@gmail.com',
      passwordHash,
      firstName: 'Robert',
      lastName: 'Smith',
      status: 'ACTIVE',
      roleId: parentRole.id,
    },
  });

  const student = await prisma.student.upsert({
    where: { admissionNo: 'ADM2026001' },
    update: { userId: studentUser.id },
    create: {
      admissionNo: 'ADM2026001',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@gmail.com',
      phone: '+91 90000 12345',
      dob: new Date('2006-05-15'),
      dateOfAdmission: new Date('2026-06-15'),
      gender: 'Male',
      bloodGroup: 'O+',
      religion: 'Christianity',
      category: 'General',
      parentName: 'Robert Smith',
      parentPhone: '+91 90000 98765',
      parentEmail: 'parent@gmail.com',
      currentAddress: '456 Garden Street, Chennai',
      permanentAddress: '456 Garden Street, Chennai',
      academicYearId: academicYear.id,
      departmentId: deptCSE.id,
      programId: programBTech.id,
      courseId: courseCSE.id,
      semesterId: sem1.id,
      sectionId: secA.id,
      hostelId: hostel.id,
      roomNo: '101',
      transportRouteId: transport.id,
      transportStopId: 'Central Station',
      userId: studentUser.id,
    },
  });

  // 13. Seed Attendance
  await prisma.attendance.create({
    data: {
      date: new Date(),
      status: 'PRESENT',
      type: 'DAILY',
      studentId: student.id,
    },
  });

  // 14. Seed Exam
  const exam = await prisma.exam.create({
    data: {
      name: 'First Semester Midterm',
      type: 'INTERNAL',
      startDate: new Date('2026-09-10'),
      endDate: new Date('2026-09-15'),
      status: 'SCHEDULED',
      academicYearId: academicYear.id,
      courseId: courseCSE.id,
      semesterId: sem1.id,
      facultyId: faculty.id,
    },
  });

  // 15. Seed Mark
  const subjectCS101 = await prisma.subject.findFirst({ where: { code: 'CS101' } });
  if (subjectCS101) {
    await prisma.mark.create({
      data: {
        internalMarks: 35,
        externalMarks: 50,
        practicalMarks: 18,
        grade: 'A',
        gpa: 8.5,
        cgpa: 8.5,
        status: 'PUBLISHED',
        examId: exam.id,
        studentId: student.id,
        subjectId: subjectCS101.id,
      },
    });
  }

  // 16. Seed Fees
  const feeCat = await prisma.feeCategory.upsert({
    where: { name: 'Tuition Fees' },
    update: {},
    create: {
      name: 'Tuition Fees',
      description: 'Standard term tuition fee bill',
      amount: 1500.00,
    },
  });

  await prisma.feeBill.create({
    data: {
      amount: 1500.00,
      status: 'PENDING',
      billingDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      studentId: student.id,
      categoryId: feeCat.id,
    },
  });

  // 17. Seed Library
  await prisma.libraryBook.upsert({
    where: { isbn: '978-0262033848' },
    update: {},
    create: {
      title: 'Introduction to Algorithms',
      isbn: '978-0262033848',
      category: 'Computer Science',
      author: 'Thomas H. Cormen',
      publisher: 'MIT Press',
      totalCopies: 5,
      availableCopies: 5,
    },
  });

  // 18. Seed Ticket
  await prisma.ticket.create({
    data: {
      title: 'Classroom Projector Malfunction',
      description: 'The overhead projector in Room 305 turns off randomly during sessions.',
      status: 'OPEN',
      priority: 'MEDIUM',
      category: 'IT',
      facultyId: faculty.id,
    },
  });

  // 19. Seed Timetable Slots
  if (subjectCS101) {
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    for (const d of days) {
      await prisma.timetableSlot.create({
        data: {
          dayOfWeek: d,
          slotIndex: 1,
          startTime: '09:00',
          endTime: '09:50',
          academicYearId: academicYear.id,
          departmentId: deptCSE.id,
          semesterId: sem1.id,
          sectionId: secA.id,
          subjectId: subjectCS101.id,
          facultyId: faculty.id,
          roomNo: 'Room 305',
        },
      });
    }
  }

  // 20. Seed Workflow Leave Requests
  const leaveReq = await prisma.workflowRequest.create({
    data: {
      studentId: student.id,
      type: 'LEAVE',
      title: 'Sick Leave request',
      reason: 'Fever and medical rest advised.',
      startDate: new Date('2026-07-20'),
      endDate: new Date('2026-07-22'),
      status: 'PENDING_MENTOR',
      currentStep: 'MENTOR',
    },
  });

  await prisma.workflowHistory.create({
    data: {
      requestId: leaveReq.id,
      stage: 'STUDENT',
      action: 'SUBMIT',
      comment: 'Submitted leave application for approval.',
      actionById: studentUser.id,
      actionByName: 'John Smith',
    },
  });

  // Seed Faculty Leave & OD Requests
  const facLeaveReq = await prisma.workflowRequest.create({
    data: {
      facultyRequesterId: faculty.id,
      departmentId: deptCSE.id,
      type: 'FACULTY_LEAVE',
      title: 'Casual Leave — Family Event',
      reason: 'Attending family event. Emergency Contact: 9876543210',
      startDate: new Date('2026-07-25'),
      endDate: new Date('2026-07-26'),
      status: 'HOD_APPROVED',
      currentStep: 'DEAN',
      attachments: '["https://example.com/docs/leave_letter.pdf"]',
    },
  });

  await prisma.workflowHistory.create({
    data: {
      requestId: facLeaveReq.id,
      stage: 'FACULTY',
      action: 'SUBMIT',
      comment: 'Submitted Casual Leave request: Casual Leave — Family Event',
      actionById: mentorUser.id,
      actionByName: 'Ada Lovelace',
    },
  });

  await prisma.workflowHistory.create({
    data: {
      requestId: facLeaveReq.id,
      stage: 'HOD',
      action: 'APPROVE',
      comment: 'HOD approved and forwarded to Admission Dean for final review.',
      actionById: mentorUser.id,
      actionByName: 'Prof. Grace Hopper (HOD)',
    },
  });

  const facOdReq = await prisma.workflowRequest.create({
    data: {
      facultyRequesterId: faculty.id,
      departmentId: deptCSE.id,
      type: 'FACULTY_OD',
      title: 'Duty — International IEEE Conference Presentation',
      reason: 'Presenting research paper on AI in Education. Emergency Contact: 9876543210',
      startDate: new Date('2026-07-28'),
      endDate: new Date('2026-07-30'),
      status: 'PENDING',
      currentStep: 'HOD',
      attachments: '["https://example.com/docs/ieee_invitation.pdf"]',
    },
  });

  await prisma.workflowHistory.create({
    data: {
      requestId: facOdReq.id,
      stage: 'FACULTY',
      action: 'SUBMIT',
      comment: 'Submitted On-Duty request for IEEE conference.',
      actionById: mentorUser.id,
      actionByName: 'Ada Lovelace',
    },
  });

  // 21. Seed Counseling Record
  await prisma.counselingRecord.create({
    data: {
      studentId: student.id,
      mentorId: faculty.id,
      notes: 'John was struggling with math concepts. Provided additional reading material.',
      actionTaken: 'Assigned supplementary tutoring.',
    },
  });

  // 22. Seed Placement Records
  await prisma.placementRecord.create({
    data: {
      studentRoll: 'ADM2026001',
      company: 'Google',
      package: 35.5,
      role: 'Associate Software Engineer',
      status: 'SELECTED',
      driveDate: new Date('2026-07-10'),
    },
  });

  // 23. Seed Menu Items
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: 'LayoutDashboard', componentKey: 'dashboard', order: 1 },
    { name: 'Users', path: '/users', icon: 'Users', componentKey: 'users', permissionRequired: 'users:read', order: 2 },
    { name: 'Roles', path: '/roles', icon: 'Shield', componentKey: 'roles', permissionRequired: 'roles:read', order: 3 },
    { name: 'Academic Master', path: '/academics', icon: 'GraduationCap', componentKey: 'academics', permissionRequired: 'academics:read', order: 4 },
    { name: 'Students', path: '/students', icon: 'UserSquare', componentKey: 'students', permissionRequired: 'students:read', order: 5 },
    { name: 'Faculty', path: '/faculty', icon: 'UserCheck', componentKey: 'faculty', permissionRequired: 'faculty:read', order: 6 },
    { name: 'Attendance', path: '/attendance', icon: 'CalendarDays', componentKey: 'attendance', permissionRequired: 'attendance:read', order: 7 },
    { name: 'Examinations', path: '/exams', icon: 'FileSpreadsheet', componentKey: 'exams', permissionRequired: 'examinations:read', order: 8 },
    { name: 'Fees & Finance', path: '/fees', icon: 'Landmark', componentKey: 'fees', permissionRequired: 'fees:read', order: 9 },
    { name: 'Library', path: '/library', icon: 'BookOpen', componentKey: 'library', permissionRequired: 'library:read', order: 10 },
    { name: 'Transport', path: '/transport', icon: 'Truck', componentKey: 'transport', permissionRequired: 'transport:read', order: 11 },
    { name: 'Hostel', path: '/hostel', icon: 'Home', componentKey: 'hostel', permissionRequired: 'hostel:read', order: 12 },
    { name: 'Media Storage', path: '/media', icon: 'Database', componentKey: 'media', permissionRequired: 'files:read', order: 13 },
    { name: 'Database Backups', path: '/backups', icon: 'Server', componentKey: 'backups', permissionRequired: 'backups:read', order: 14 },
    { name: 'Notifications', path: '/notifications', icon: 'Bell', componentKey: 'notifications', permissionRequired: 'notifications:read', order: 15 },
    { name: 'Audit Logs', path: '/security', icon: 'Shield', componentKey: 'security', permissionRequired: 'audit:read', order: 16 },
    { name: 'Reports', path: '/reports', icon: 'FileBarChart', componentKey: 'reports', permissionRequired: 'reports:read', order: 17 },
    { name: 'System Settings', path: '/settings', icon: 'Settings', componentKey: 'settings', permissionRequired: 'settings:read', order: 18 },
    { name: 'Help Support', path: '/help', icon: 'HelpCircle', componentKey: 'help', order: 19 },
    { name: 'Support Tickets', path: '/support', icon: 'LifeBuoy', componentKey: 'support', order: 20 },
    { name: 'Timetable Engine', path: '/hod/timetable', icon: 'Clock', componentKey: 'timetable_engine', order: 21 },
    { name: 'Placement Engine', path: '/placements/dashboard', icon: 'Briefcase', componentKey: 'placement_engine', order: 22 },
    { name: 'Admission Center', path: '/admission-dean/dashboard', icon: 'UserPlus', componentKey: 'admission_dean_dashboard', permissionRequired: 'admissions:read', order: 23 },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.componentKey }, // mapping id as componentKey for easy upsert identification
      update: {
        name: item.name,
        path: item.path,
        icon: item.icon,
        permissionRequired: item.permissionRequired || null,
        order: item.order,
      },
      create: {
        id: item.componentKey,
        name: item.name,
        path: item.path,
        icon: item.icon,
        componentKey: item.componentKey,
        permissionRequired: item.permissionRequired || null,
        order: item.order,
      },
    });
  }
  console.log('📑 Dynamic menu items seeded.');

  // 24. Seed Department intakes
  const depts = await prisma.department.findMany();
  for (const d of depts) {
    let capacity = 120;
    if (d.code === 'CSE') capacity = 180;
    if (d.code === 'MECH' || d.code === 'CIVIL') capacity = 60;
    
    await prisma.departmentIntake.upsert({
      where: { departmentId: d.id },
      update: {},
      create: {
        departmentId: d.id,
        intakeCapacity: capacity,
        availableSeats: capacity,
        filledSeats: 0,
        reservedSeats: Math.round(capacity * 0.1),
        managementQuotaIntake: Math.round(capacity * 0.3),
        managementQuotaFilled: 0,
        governmentQuotaIntake: Math.round(capacity * 0.6),
        governmentQuotaFilled: 0,
      }
    });
  }
  console.log('🏁 Seeded Department Intakes.');

  // 25. Seed enquiries
  const enquiriesData = [
    { studentName: 'Alice Green', parentName: 'Mark Green', phone: '+91 91111 22222', email: 'alice@gmail.com', source: 'Website Lead', notes: 'Interested in B.Tech CSE' },
    { studentName: 'Bob White', parentName: 'Peter White', phone: '+91 92222 33333', email: 'bob@gmail.com', source: 'Walk-in', notes: 'Inquired about scholarships for ECE' },
    { studentName: 'Charlie Black', parentName: 'David Black', phone: '+91 93333 44444', email: 'charlie@gmail.com', source: 'Phone Call', notes: 'Asked about hostel accommodation and fee concessions' }
  ];
  for (const enq of enquiriesData) {
    await prisma.studentEnquiry.create({ data: enq });
  }
  console.log('📞 Seeded Student Enquiries.');

  // 26. Seed Counselling Session
  const session = await prisma.counsellingSession.create({
    data: {
      title: 'First Round Counselling (Merit List)',
      dateTime: new Date(Date.now() + 24 * 3600 * 1000), // tomorrow
      counsellor: 'Dr. Sarah Smith',
      notes: 'Focus on ECE & CSE allocations',
      studentIds: '[]'
    }
  });
  console.log('💬 Seeded Counselling Session.');

  // 27. Seed Admission Applications
  const cseDept = depts.find(d => d.code === 'CSE');
  const program = await prisma.program.findFirst({ where: { departmentId: cseDept?.id } });
  
  if (cseDept && program) {
    const apps = [
      {
        applicationNo: 'APP20260001',
        firstName: 'Daniel',
        lastName: 'Craig',
        parentName: 'James Craig',
        phone: '+91 98888 12345',
        email: 'daniel@gmail.com',
        gender: 'Male',
        category: 'General',
        academicMarks: 94.5,
        status: 'PENDING',
        paymentStatus: 'COMPLETED',
        scholarshipStatus: 'NONE',
        documents: JSON.stringify([
          { name: '10th Marksheet', url: 'https://campusos.s3.amazonaws.com/docs/10th.pdf', status: 'PENDING' },
          { name: '12th Marksheet', url: 'https://campusos.s3.amazonaws.com/docs/12th.pdf', status: 'PENDING' },
          { name: 'Aadhar / ID Proof', url: 'https://campusos.s3.amazonaws.com/docs/aadhar.pdf', status: 'PENDING' }
        ]),
        departmentId: cseDept.id,
        programId: program.id
      },
      {
        applicationNo: 'APP20260002',
        firstName: 'Emma',
        lastName: 'Watson',
        parentName: 'Chris Watson',
        phone: '+91 97777 54321',
        email: 'emma@gmail.com',
        gender: 'Female',
        category: 'OBC',
        academicMarks: 88.2,
        status: 'REVIEWING',
        paymentStatus: 'COMPLETED',
        scholarshipStatus: 'APPLIED',
        scholarshipType: 'Merit',
        documents: JSON.stringify([
          { name: '10th Marksheet', url: 'https://campusos.s3.amazonaws.com/docs/10th.pdf', status: 'APPROVED' },
          { name: '12th Marksheet', url: 'https://campusos.s3.amazonaws.com/docs/12th.pdf', status: 'PENDING' }
        ]),
        departmentId: cseDept.id,
        programId: program.id
      }
    ];

    for (const app of apps) {
      await prisma.admissionApplication.upsert({
        where: { applicationNo: app.applicationNo },
        update: {},
        create: app,
      });
    }
    console.log('📝 Seeded Admission Applications.');
  }

  console.log('✅ All complete enterprise academic modules seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

