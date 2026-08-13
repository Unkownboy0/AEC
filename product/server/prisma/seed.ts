import { PrismaClient } from '@prisma/client';
// Prisma DB Seeder for Enterprise ERP CampusOS
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
    { name: 'Governing Body', description: 'Read-heavy institution governance and strategic reporting', color: '#0f766e', icon: 'Landmark', priority: 2.1, hierarchy: 2, isSystem: true },
    { name: 'Management', description: 'Read-heavy executive institution oversight', color: '#0d9488', icon: 'BarChart3', priority: 2.2, hierarchy: 2, isSystem: true },
    { name: 'Principal', description: 'Institution-wide Executive Monitoring', color: '#f59e0b', icon: 'Award', priority: 3, hierarchy: 3, isSystem: true },
    { name: 'Vice Principal', description: 'Operations & Academic Monitoring', color: '#eab308', icon: 'Award', priority: 4, hierarchy: 4, isSystem: true },
    { name: 'Academic Dean', description: 'Responsible for Academics & Curriculum', color: '#10b981', icon: 'GraduationCap', priority: 5, hierarchy: 5, isSystem: true },
    { name: 'Admission Dean', description: 'Responsible for Admissions & Onboarding', color: '#6366f1', icon: 'UserPlus', priority: 6, hierarchy: 6, isSystem: true },
    { name: 'IQAC Dean', description: 'Head of Quality Assurance & Accreditations', color: '#059669', icon: 'ShieldCheck', priority: 6.1, hierarchy: 6, isSystem: true },
    { name: 'IQAC Executive Officer', description: 'Internal Audits & Compliance Inspector', color: '#0d9488', icon: 'ClipboardList', priority: 6.2, hierarchy: 6, isSystem: true },
    { name: 'IQAC Documentation Officer', description: 'Evidence Repository & QR Verification Officer', color: '#7c3aed', icon: 'FileCheck', priority: 6.3, hierarchy: 6, isSystem: true },
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

  // 3c. Management identities are read-heavy: dashboard/report viewing and export only.
  for (const roleName of ['Management', 'Governing Body']) {
    for (const perm of permissions.filter((item) => ['dashboard:view', 'reports:view', 'reports:read', 'reports:export'].includes(item.name))) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: rolesMap[roleName].id, permissionId: perm.id } },
        update: {}, create: { roleId: rolesMap[roleName].id, permissionId: perm.id },
      });
    }
  }

  // 3d. Connect Permissions to Admission Dean
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
    { key: 'COLLEGE_NAME', value: 'Al-Ameen Engineering College' },
    { key: 'COLLEGE_EMAIL', value: 'info@alameen.ac.in' },
    { key: 'COLLEGE_PHONE', value: '+91 424 2358877' },
    { key: 'COLLEGE_WEBSITE', value: 'https://alameen.ac.in' },
    { key: 'COLLEGE_GST', value: '33AABCA1234D1Z2' },
    { key: 'COLLEGE_ADDRESS', value: 'Karundevampalayam, Nanjai Uttukuli Post, Erode - 638104, Tamil Nadu' },
    { key: 'COLLEGE_UNIVERSITY', value: 'Affiliated to Anna University, Chennai' },
    { key: 'COLLEGE_AFFILIATION', value: 'Autonomous Institution' },
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

  // 7. Seed Departments for Al-Ameen Engineering College (Erode)
  const deptSNH = await prisma.department.upsert({
    where: { code: 'SNH' },
    update: {
      name: 'Science & Humanities',
      shortName: 'S&H',
      description: 'Science & Humanities Department (First Year Common)',
      type: 'Science & Humanities',
      status: 'ACTIVE',
      color: '#7C3AED',
      email: 'snh@alameen.ac.in',
      phone: '+91 424 2358801',
      officeLocation: 'Science Block, Room 101',
      establishedYear: 2003,
      hodName: 'Dr. M. Senthilkumar',
      academicYearId: academicYear.id,
    },
    create: {
      name: 'Science & Humanities',
      code: 'SNH',
      shortName: 'S&H',
      description: 'Science & Humanities Department (First Year Common)',
      type: 'Science & Humanities',
      status: 'ACTIVE',
      color: '#7C3AED',
      email: 'snh@alameen.ac.in',
      phone: '+91 424 2358801',
      officeLocation: 'Science Block, Room 101',
      establishedYear: 2003,
      hodName: 'Dr. M. Senthilkumar',
      academicYearId: academicYear.id,
    },
  });

  const deptCSE = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {
      name: 'Computer Science & Engineering',
      shortName: 'CSE Dept',
      description: 'Department of Computer Science & Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#4f46e5',
      email: 'cse@alameen.ac.in',
      phone: '+91 424 2358802',
      officeLocation: 'Block C, Room 301',
      establishedYear: 2003,
      hodName: 'Dr. K. Rajasekar',
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
      email: 'cse@alameen.ac.in',
      phone: '+91 424 2358802',
      officeLocation: 'Block C, Room 301',
      establishedYear: 2003,
      hodName: 'Dr. K. Rajasekar',
      academicYearId: academicYear.id,
    },
  });

  const deptIT = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {
      name: 'Information Technology',
      shortName: 'IT Dept',
      description: 'Department of Information Technology',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#3b82f6',
      email: 'it@alameen.ac.in',
      phone: '+91 424 2358803',
      officeLocation: 'Block A, Room 101',
      establishedYear: 2004,
      hodName: 'Dr. P. Karthikeyan',
      academicYearId: academicYear.id,
    },
    create: {
      name: 'Information Technology',
      code: 'IT',
      shortName: 'IT Dept',
      description: 'Department of Information Technology',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#3b82f6',
      email: 'it@alameen.ac.in',
      phone: '+91 424 2358803',
      officeLocation: 'Block A, Room 101',
      establishedYear: 2004,
      hodName: 'Dr. P. Karthikeyan',
      academicYearId: academicYear.id,
    },
  });

  const deptAIDS = await prisma.department.upsert({
    where: { code: 'AI&DS' },
    update: {
      name: 'Artificial Intelligence & Data Science',
      shortName: 'AI&DS Dept',
      description: 'Department of Artificial Intelligence & Data Science',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#8b5cf6',
      email: 'aids@alameen.ac.in',
      phone: '+91 424 2358804',
      officeLocation: 'Innovation Hub, Room 404',
      establishedYear: 2021,
      hodName: 'Dr. N. Saravanan',
      academicYearId: academicYear.id,
    },
    create: {
      name: 'Artificial Intelligence & Data Science',
      code: 'AI&DS',
      shortName: 'AI&DS Dept',
      description: 'Department of Artificial Intelligence & Data Science',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#8b5cf6',
      email: 'aids@alameen.ac.in',
      phone: '+91 424 2358804',
      officeLocation: 'Innovation Hub, Room 404',
      establishedYear: 2021,
      hodName: 'Dr. N. Saravanan',
      academicYearId: academicYear.id,
    },
  });

  const deptECE = await prisma.department.upsert({
    where: { code: 'ECE' },
    update: {
      name: 'Electronics & Communication Engineering',
      shortName: 'ECE Dept',
      description: 'Department of Electronics & Communication Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#10b981',
      email: 'ece@alameen.ac.in',
      phone: '+91 424 2358805',
      officeLocation: 'Block B, Room 201',
      establishedYear: 2003,
      hodName: 'Dr. V. Gokulakrishnan',
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
      email: 'ece@alameen.ac.in',
      phone: '+91 424 2358805',
      officeLocation: 'Block B, Room 201',
      establishedYear: 2003,
      hodName: 'Dr. V. Gokulakrishnan',
      academicYearId: academicYear.id,
    },
  });

  const deptEEE = await prisma.department.upsert({
    where: { code: 'EEE' },
    update: {
      name: 'Electrical & Electronics Engineering',
      shortName: 'EEE Dept',
      description: 'Department of Electrical & Electronics Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#f59e0b',
      email: 'eee@alameen.ac.in',
      phone: '+91 424 2358806',
      officeLocation: 'Block D, Room 102',
      establishedYear: 2003,
      hodName: 'Dr. R. Palanisamy',
      academicYearId: academicYear.id,
    },
    create: {
      name: 'Electrical & Electronics Engineering',
      code: 'EEE',
      shortName: 'EEE Dept',
      description: 'Department of Electrical & Electronics Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#f59e0b',
      email: 'eee@alameen.ac.in',
      phone: '+91 424 2358806',
      officeLocation: 'Block D, Room 102',
      establishedYear: 2003,
      hodName: 'Dr. R. Palanisamy',
      academicYearId: academicYear.id,
    },
  });

  const deptMECH = await prisma.department.upsert({
    where: { code: 'MECH' },
    update: {
      name: 'Mechanical Engineering',
      shortName: 'MECH Dept',
      description: 'Department of Mechanical Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#ef4444',
      email: 'mech@alameen.ac.in',
      phone: '+91 424 2358807',
      officeLocation: 'Workshop Block, Room 01',
      establishedYear: 2005,
      hodName: 'Dr. T. Ramesh',
      academicYearId: academicYear.id,
    },
    create: {
      name: 'Mechanical Engineering',
      code: 'MECH',
      shortName: 'MECH Dept',
      description: 'Department of Mechanical Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#ef4444',
      email: 'mech@alameen.ac.in',
      phone: '+91 424 2358807',
      officeLocation: 'Workshop Block, Room 01',
      establishedYear: 2005,
      hodName: 'Dr. T. Ramesh',
      academicYearId: academicYear.id,
    },
  });

  const deptCIVIL = await prisma.department.upsert({
    where: { code: 'CIVIL' },
    update: {
      name: 'Civil Engineering',
      shortName: 'CIVIL Dept',
      description: 'Department of Civil Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#64748b',
      email: 'civil@alameen.ac.in',
      phone: '+91 424 2358808',
      officeLocation: 'Structures Block, Room 10',
      establishedYear: 2009,
      hodName: 'Dr. M. Mohan',
      academicYearId: academicYear.id,
    },
    create: {
      name: 'Civil Engineering',
      code: 'CIVIL',
      shortName: 'CIVIL Dept',
      description: 'Department of Civil Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#64748b',
      email: 'civil@alameen.ac.in',
      phone: '+91 424 2358808',
      officeLocation: 'Structures Block, Room 10',
      establishedYear: 2009,
      hodName: 'Dr. M. Mohan',
      academicYearId: academicYear.id,
    },
  });

  const deptCSEPG = await prisma.department.upsert({
    where: { code: 'CSE-PG' },
    update: {
      name: 'Computer Science & Engineering (PG)',
      shortName: 'CSE-PG Dept',
      description: 'PG Department of Computer Science & Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#4338ca',
      email: 'csepg@alameen.ac.in',
      phone: '+91 424 2358809',
      officeLocation: 'PG Block, Room 201',
      establishedYear: 2011,
      hodName: 'Dr. S. Prabha',
      academicYearId: academicYear.id,
    },
    create: {
      name: 'Computer Science & Engineering (PG)',
      code: 'CSE-PG',
      shortName: 'CSE-PG Dept',
      description: 'PG Department of Computer Science & Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#4338ca',
      email: 'csepg@alameen.ac.in',
      phone: '+91 424 2358809',
      officeLocation: 'PG Block, Room 201',
      establishedYear: 2011,
      hodName: 'Dr. S. Prabha',
      academicYearId: academicYear.id,
    },
  });

  const deptISE = await prisma.department.upsert({
    where: { code: 'ISE' },
    update: {
      name: 'Industrial Safety Engineering (PG)',
      shortName: 'ISE Dept',
      description: 'PG Department of Industrial Safety Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#b45309',
      email: 'ise@alameen.ac.in',
      phone: '+91 424 2358810',
      officeLocation: 'Safety Lab Block, Room 102',
      establishedYear: 2014,
      hodName: 'Dr. G. Arunkumar',
      academicYearId: academicYear.id,
    },
    create: {
      name: 'Industrial Safety Engineering (PG)',
      code: 'ISE',
      shortName: 'ISE Dept',
      description: 'PG Department of Industrial Safety Engineering',
      type: 'Engineering',
      status: 'ACTIVE',
      color: '#b45309',
      email: 'ise@alameen.ac.in',
      phone: '+91 424 2358810',
      officeLocation: 'Safety Lab Block, Room 102',
      establishedYear: 2014,
      hodName: 'Dr. G. Arunkumar',
      academicYearId: academicYear.id,
    },
  });

  const deptMBA = await prisma.department.upsert({
    where: { code: 'MBA' },
    update: {
      name: 'Master of Business Administration (MBA)',
      shortName: 'MBA Dept',
      description: 'Department of Business Administration',
      type: 'Management',
      status: 'ACTIVE',
      color: '#0d9488',
      email: 'mba@alameen.ac.in',
      phone: '+91 424 2358811',
      officeLocation: 'MBA Block, Room 301',
      establishedYear: 2008,
      hodName: 'Dr. K. Priya',
      academicYearId: academicYear.id,
    },
    create: {
      name: 'Master of Business Administration (MBA)',
      code: 'MBA',
      shortName: 'MBA Dept',
      description: 'Department of Business Administration',
      type: 'Management',
      status: 'ACTIVE',
      color: '#0d9488',
      email: 'mba@alameen.ac.in',
      phone: '+91 424 2358811',
      officeLocation: 'MBA Block, Room 301',
      establishedYear: 2008,
      hodName: 'Dr. K. Priya',
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
  const academicDeanUser = await prisma.user.upsert({
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

  // One identity, two isolated workspaces. Authentication resolves permissions
  // from the active role, so COE authority does not leak into Academic Dean.
  await prisma.userWorkspace.upsert({
    where: { userId_workspaceCode: { userId: academicDeanUser.id, workspaceCode: 'COE' } },
    update: { workspaceName: 'COE Workspace', roleName: 'Examination Cell', status: 'ACTIVE' },
    create: {
      userId: academicDeanUser.id,
      workspaceCode: 'COE',
      workspaceName: 'COE Workspace',
      roleName: 'Examination Cell',
      isPrimary: false,
      status: 'ACTIVE',
    },
  });

  // ── Admission Dean ─────────────────────────────────────────────────────────
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

  // ── IQAC Dean ─────────────────────────────────────────────────────────────
  const iqacDeanUser = await prisma.user.upsert({
    where: { email: 'iqac.dean@geetorus.com' },
    update: { phone: '9800000005' },
    create: {
      email:        'iqac.dean@geetorus.com',
      passwordHash: await bcrypt.hash('IqacDean@123', 10),
      firstName:    'IQAC',
      lastName:     'Dean',
      phone:        '9800000005',
      status:       'ACTIVE',
      roleId:       rolesMap['IQAC Dean'].id,
    },
  });

  await prisma.faculty.upsert({
    where: { employeeId: 'IQAC001' },
    update: { userId: iqacDeanUser.id },
    create: {
      employeeId: 'IQAC001',
      firstName: 'IQAC',
      lastName: 'Dean',
      email: 'iqac.dean@geetorus.com',
      phone: '9800000005',
      dob: new Date('1982-03-15'),
      dateOfJoining: new Date('2016-06-01'),
      designation: 'IQAC Dean & Director of Quality Assurance',
      qualification: 'PhD in Quality Engineering',
      experience: 18,
      status: 'ACTIVE',
      departmentId: deptCSE.id,
      userId: iqacDeanUser.id,
    },
  });

  // ── IQAC Executive Officer ────────────────────────────────────────────────
  const iqacExecUser = await prisma.user.upsert({
    where: { email: 'iqac.exec@geetorus.com' },
    update: { phone: '9800000006' },
    create: {
      email:        'iqac.exec@geetorus.com',
      passwordHash: await bcrypt.hash('IqacExec@123', 10),
      firstName:    'IQAC Executive',
      lastName:     'Officer',
      phone:        '9800000006',
      status:       'ACTIVE',
      roleId:       rolesMap['IQAC Executive Officer'].id,
    },
  });

  await prisma.faculty.upsert({
    where: { employeeId: 'IQAC002' },
    update: { userId: iqacExecUser.id },
    create: {
      employeeId: 'IQAC002',
      firstName: 'IQAC Executive',
      lastName: 'Officer',
      email: 'iqac.exec@geetorus.com',
      phone: '9800000006',
      dob: new Date('1988-08-20'),
      dateOfJoining: new Date('2019-06-01'),
      designation: 'IQAC Executive Inspector',
      qualification: 'M.Tech in Engineering Audit',
      experience: 10,
      status: 'ACTIVE',
      departmentId: deptCSE.id,
      userId: iqacExecUser.id,
    },
  });

  // ── IQAC Documentation Officer ───────────────────────────────────────────
  const iqacDocUser = await prisma.user.upsert({
    where: { email: 'iqac.doc@geetorus.com' },
    update: { phone: '9800000007' },
    create: {
      email:        'iqac.doc@geetorus.com',
      passwordHash: await bcrypt.hash('IqacDoc@123', 10),
      firstName:    'IQAC Documentation',
      lastName:     'Officer',
      phone:        '9800000007',
      status:       'ACTIVE',
      roleId:       rolesMap['IQAC Documentation Officer'].id,
    },
  });

  await prisma.faculty.upsert({
    where: { employeeId: 'IQAC003' },
    update: { userId: iqacDocUser.id },
    create: {
      employeeId: 'IQAC003',
      firstName: 'IQAC Documentation',
      lastName: 'Officer',
      email: 'iqac.doc@geetorus.com',
      phone: '9800000007',
      dob: new Date('1991-11-10'),
      dateOfJoining: new Date('2021-06-01'),
      designation: 'Evidence Repository Lead',
      qualification: 'M.Sc Information Systems',
      experience: 7,
      status: 'ACTIVE',
      departmentId: deptCSE.id,
      userId: iqacDocUser.id,
    },
  });

  console.log('👤 Seeded College Admin, VP, Academic Dean, Admission Dean, IQAC Office accounts.');


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

  // 28. Seed Enterprise Core Demo Accounts & Department Clusters
  await seedEnterpriseDemoAccountsAndData(rolesMap);

  console.log('✅ All complete enterprise academic modules & demo accounts seeded successfully!');
}

async function seedEnterpriseDemoAccountsAndData(rolesMap: Record<string, any>) {
  console.log('🚀 Seeding Enterprise Core Accounts & 4 Department Clusters (CSE, IT, ECE, EEE)...');

  const defaultPassword = process.env.DEMO_DEPARTMENT_PASSWORD || 'Campus@123';
  const hashedDefaultPassword = await bcrypt.hash(defaultPassword, 10);

  // Core Executive Accounts
  const coreAccounts = [
    { email: 'admin@geetorus.com', password: 'Admin@123', firstName: 'Super', lastName: 'Admin', roleName: 'Super Admin' },
    { email: 'college.admin@geetorus.com', password: 'ColAdmin@123', firstName: 'College', lastName: 'Admin', roleName: 'College Admin' },
    { email: 'principal@geetorus.com', password: 'Campus@123', firstName: 'Dr. Subramanian', lastName: 'Ramasamy', roleName: 'Principal' },
    { email: 'vp@geetorus.com', password: 'VP@123456', firstName: 'Dr. Meenakshi', lastName: 'Sundaram', roleName: 'Vice Principal' },
    { email: 'academic.dean@geetorus.com', password: 'AcaDean@123', firstName: 'Dr. Rajesh', lastName: 'Kannan', roleName: 'Academic Dean' },
    { email: 'admission.dean@geetorus.com', password: 'AdmDean@123', firstName: 'Dr. Anand', lastName: 'Venkatesh', roleName: 'Admission Dean' },
    { email: 'iqac.dean@geetorus.com', password: 'IQAC@123', firstName: 'Dr. Swaminathan', lastName: 'Iyer', roleName: 'IQAC Dean' },
  ];

  const executiveUserMap: Record<string, any> = {};

  for (const acc of coreAccounts) {
    const role = rolesMap[acc.roleName] || rolesMap['Super Admin'];
    const pHash = await bcrypt.hash(acc.password, 10);
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        firstName: acc.firstName,
        lastName: acc.lastName,
        roleId: role.id,
      },
      create: {
        email: acc.email,
        passwordHash: pHash,
        firstName: acc.firstName,
        lastName: acc.lastName,
        roleId: role.id,
        status: 'ACTIVE',
      },
    });
    executiveUserMap[acc.roleName] = user;

    // Ensure UserRole record
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id, isPrimary: true },
    });
  }

  const deptCodes = ['CSE', 'IT', 'ECE', 'EEE'];
  const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  const facultyRole = rolesMap['Faculty'];
  const hodRole = rolesMap['HOD'];
  const mentorRole = rolesMap['Mentor'];
  const studentRole = rolesMap['Student'];
  const parentRole = rolesMap['Parent'];

  for (const deptCode of deptCodes) {
    const dept = await prisma.department.findUnique({ where: { code: deptCode } });
    if (!dept) continue;

    let program = await prisma.program.findFirst({ where: { departmentId: dept.id } });
    if (!program) {
      program = await prisma.program.create({
        data: {
          name: `B.Tech ${deptCode}`,
          code: `B.TECH-${deptCode}`,
          departmentId: dept.id,
        },
      });
    }

    let course = await prisma.course.findFirst({ where: { departmentId: dept.id } });
    if (!course) {
      course = await prisma.course.create({
        data: {
          name: `${dept.name} Engineering`,
          code: `${deptCode}-ENG`,
          duration: 4,
          programId: program.id,
          departmentId: dept.id,
        },
      });
    }

    let semester = await prisma.semester.findFirst({ where: { courseId: course.id } });
    if (!semester && academicYear) {
      semester = await prisma.semester.create({
        data: {
          number: 1,
          name: 'Semester 1',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-11-30'),
          courseId: course.id,
          programId: program.id,
          academicYearId: academicYear.id,
        },
      });
    }

    let section = semester ? await prisma.section.findFirst({ where: { semesterId: semester.id } }) : null;
    if (!section && semester) {
      section = await prisma.section.create({
        data: {
          name: 'Section A',
          semesterId: semester.id,
          programId: program.id,
          departmentId: dept.id,
        },
      });
    }

    // 1. HOD User & Faculty Profile
    const hodEmail = `hod.${deptCode.toLowerCase()}@geetorus.com`;
    const hodUser = await prisma.user.upsert({
      where: { email: hodEmail },
      update: { roleId: hodRole.id, departmentId: dept.id },
      create: {
        email: hodEmail,
        passwordHash: hashedDefaultPassword,
        firstName: `${deptCode} Head`,
        lastName: 'of Department',
        designation: 'HOD & Professor',
        departmentId: dept.id,
        roleId: hodRole.id,
        status: 'ACTIVE',
      },
    });

    await prisma.department.update({
      where: { id: dept.id },
      data: { hodId: hodUser.id, hodName: `${hodUser.firstName} ${hodUser.lastName}` },
    });

    await prisma.departmentMembership.upsert({
      where: { userId_departmentId_role: { userId: hodUser.id, departmentId: dept.id, role: 'HOD' } },
      update: {},
      create: { userId: hodUser.id, departmentId: dept.id, role: 'HOD', isPrimary: true },
    });

    const hodFaculty = await prisma.faculty.upsert({
      where: { email: hodEmail },
      update: { departmentId: dept.id },
      create: {
        employeeId: `EMP-${deptCode}-HOD`,
        firstName: hodUser.firstName,
        lastName: hodUser.lastName,
        email: hodEmail,
        phone: '+91 98765 00000',
        dob: new Date('1978-05-15'),
        dateOfJoining: new Date('2010-06-01'),
        designation: 'HOD & Professor',
        qualification: 'Ph.D in Computer Science',
        experience: 18,
        departmentId: dept.id,
        userId: hodUser.id,
      },
    });

    // 2. 5 Faculty Users & Profiles
    const facultyUsers = [];
    const facultyProfiles = [];
    for (let f = 1; f <= 5; f++) {
      const fEmail = `faculty${f}.${deptCode.toLowerCase()}@geetorus.com`;
      const fUser = await prisma.user.upsert({
        where: { email: fEmail },
        update: { roleId: facultyRole.id, departmentId: dept.id },
        create: {
          email: fEmail,
          passwordHash: hashedDefaultPassword,
          firstName: `${deptCode} Faculty`,
          lastName: `Member ${f}`,
          designation: f % 2 === 0 ? 'Associate Professor' : 'Assistant Professor',
          departmentId: dept.id,
          roleId: facultyRole.id,
          status: 'ACTIVE',
        },
      });

      await prisma.departmentMembership.upsert({
        where: { userId_departmentId_role: { userId: fUser.id, departmentId: dept.id, role: 'FACULTY' } },
        update: {},
        create: { userId: fUser.id, departmentId: dept.id, role: 'FACULTY', isPrimary: true },
      });

      const fProfile = await prisma.faculty.upsert({
        where: { email: fEmail },
        update: { departmentId: dept.id },
        create: {
          employeeId: `EMP-${deptCode}-FAC0${f}`,
          firstName: fUser.firstName,
          lastName: fUser.lastName,
          email: fEmail,
          phone: `+91 98765 1000${f}`,
          dob: new Date('1985-08-20'),
          dateOfJoining: new Date('2015-07-15'),
          designation: fUser.designation || 'Assistant Professor',
          qualification: 'M.E / M.Tech',
          experience: 8 + f,
          departmentId: dept.id,
          userId: fUser.id,
        },
      });
      facultyUsers.push(fUser);
      facultyProfiles.push(fProfile);
    }

    // 3. 2 Mentors Users & Profiles (Dual Role: Faculty + Mentor)
    const mentorProfiles = [];
    for (let m = 1; m <= 2; m++) {
      const mEmail = `mentor${m}.${deptCode.toLowerCase()}@geetorus.com`;
      const mUser = await prisma.user.upsert({
        where: { email: mEmail },
        update: { roleId: mentorRole.id, departmentId: dept.id },
        create: {
          email: mEmail,
          passwordHash: hashedDefaultPassword,
          firstName: `${deptCode} Academic Mentor`,
          lastName: `${m}`,
          designation: 'Assistant Professor & Student Mentor',
          departmentId: dept.id,
          roleId: mentorRole.id,
          status: 'ACTIVE',
        },
      });

      // Dual roles mapping: Primary Mentor, Secondary Faculty
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: mUser.id, roleId: mentorRole.id } },
        update: {},
        create: { userId: mUser.id, roleId: mentorRole.id, isPrimary: true },
      });

      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: mUser.id, roleId: facultyRole.id } },
        update: {},
        create: { userId: mUser.id, roleId: facultyRole.id, isPrimary: false },
      });

      await prisma.departmentMembership.upsert({
        where: { userId_departmentId_role: { userId: mUser.id, departmentId: dept.id, role: 'MENTOR' } },
        update: {},
        create: { userId: mUser.id, departmentId: dept.id, role: 'MENTOR', isPrimary: true },
      });

      const mProfile = await prisma.faculty.upsert({
        where: { email: mEmail },
        update: { departmentId: dept.id },
        create: {
          employeeId: `EMP-${deptCode}-MTR0${m}`,
          firstName: mUser.firstName,
          lastName: mUser.lastName,
          email: mEmail,
          phone: `+91 98765 2000${m}`,
          dob: new Date('1988-03-12'),
          dateOfJoining: new Date('2018-06-01'),
          designation: 'Assistant Professor & Mentor',
          qualification: 'Ph.D Pursuing',
          experience: 6 + m,
          departmentId: dept.id,
          userId: mUser.id,
        },
      });
      mentorProfiles.push(mProfile);
    }

    // 4. 40 Students & 40 Parents
    const studentProfiles = [];
    for (let s = 1; s <= 40; s++) {
      const sNum = String(s).padStart(3, '0');
      const sEmail = `student${sNum}.${deptCode.toLowerCase()}@geetorus.com`;
      const sUser = await prisma.user.upsert({
        where: { email: sEmail },
        update: { roleId: studentRole.id, departmentId: dept.id },
        create: {
          email: sEmail,
          passwordHash: hashedDefaultPassword,
          firstName: `${deptCode} Student`,
          lastName: `${sNum}`,
          departmentId: dept.id,
          roleId: studentRole.id,
          status: 'ACTIVE',
        },
      });

      const chosenMentorProfile = s <= 20 ? mentorProfiles[0] : mentorProfiles[1];

      const sProfile = await prisma.student.upsert({
        where: { admissionNo: `ADM-${deptCode}-2026-${sNum}` },
        update: {
          departmentId: dept.id,
          mentorId: chosenMentorProfile.id,
        },
        create: {
          admissionNo: `ADM-${deptCode}-2026-${sNum}`,
          firstName: sUser.firstName,
          lastName: sUser.lastName,
          email: sEmail,
          phone: `+91 99940 ${deptCode.length}${sNum}`,
          dob: new Date('2004-04-10'),
          dateOfAdmission: new Date('2026-07-01'),
          gender: s % 2 === 0 ? 'Female' : 'Male',
          status: 'ACTIVE',
          parentName: `Parent of ${sUser.firstName}`,
          parentPhone: `+91 98420 ${deptCode.length}${sNum}`,
          parentEmail: `parent${sNum}.${deptCode.toLowerCase()}@geetorus.com`,
          currentAddress: 'Campus Hostel Block A',
          permanentAddress: 'Erode, Tamil Nadu',
          academicYearId: academicYear?.id || '',
          departmentId: dept.id,
          programId: program?.id || '',
          courseId: course?.id || '',
          semesterId: semester?.id || '',
          sectionId: section?.id || '',
          userId: sUser.id,
          mentorId: chosenMentorProfile.id,
        },
      });
      studentProfiles.push(sProfile);

      // Mentor Assignment Record
      if (academicYear && program && semester && section) {
        await prisma.mentorAssignment.upsert({
          where: { id: `MTR-${deptCode}-${chosenMentorProfile.id}-${sProfile.id}` },
          update: { status: 'ACTIVE' },
          create: {
            id: `MTR-${deptCode}-${chosenMentorProfile.id}-${sProfile.id}`,
            mentorId: chosenMentorProfile.id,
            studentId: sProfile.id,
            departmentId: dept.id,
            programId: program.id,
            semesterId: semester.id,
            sectionId: section.id,
            academicYearId: academicYear.id,
            assignedBy: hodUser.id,
            status: 'ACTIVE',
          },
        });
      }

      // Parent User & ParentProfile
      const pEmail = `parent${sNum}.${deptCode.toLowerCase()}@geetorus.com`;
      const pUser = await prisma.user.upsert({
        where: { email: pEmail },
        update: { roleId: parentRole.id },
        create: {
          email: pEmail,
          passwordHash: hashedDefaultPassword,
          firstName: `Parent of`,
          lastName: `${deptCode} ${sNum}`,
          roleId: parentRole.id,
          status: 'ACTIVE',
        },
      });

      const parentProf = await prisma.parentProfile.upsert({
        where: { userId: pUser.id },
        update: {},
        create: {
          userId: pUser.id,
          occupation: 'Business / Professional',
          alternatePhone: `+91 98420 ${deptCode.length}${sNum}`,
          address: 'Tamil Nadu, India',
        },
      });

      await prisma.parentStudentRelation.upsert({
        where: { parentId_studentId: { parentId: parentProf.id, studentId: sProfile.id } },
        update: {},
        create: {
          parentId: parentProf.id,
          studentId: sProfile.id,
          relationType: 'FATHER',
          isPrimary: true,
        },
      });
    }

    // 5. Seed Department Tasks (Academic Dean -> HOD -> Faculty & Mentors)
    const academicDeanUser = executiveUserMap['Academic Dean'];
    if (academicDeanUser) {
      const task1Number = `TSK-${deptCode}-2026-001`;
      const task1 = await prisma.task.upsert({
        where: { taskNumber: task1Number },
        update: { status: 'IN_PROGRESS', completionPercent: 65 },
        create: {
          taskNumber: task1Number,
          title: `Submit ${deptCode} Annual IQAC Self-Audit & Course Outcome Matrix`,
          description: `Comprehensive review of curriculum outcomes, PO-CO mappings, and laboratory equipment compliance for ${deptCode} department.`,
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          departmentId: dept.id,
          createdById: academicDeanUser.id,
          status: 'IN_PROGRESS',
          completionPercent: 65,
          visibility: 'DEPARTMENT',
        },
      });

      await prisma.taskAssignee.upsert({
        where: { taskId_assigneeId: { taskId: task1.id, assigneeId: hodUser.id } },
        update: { status: 'ACCEPTED', completionPercent: 65 },
        create: {
          taskId: task1.id,
          assigneeId: hodUser.id,
          status: 'ACCEPTED',
          completionPercent: 65,
          seenAt: new Date(Date.now() - 24 * 3600 * 1000),
          acceptedAt: new Date(Date.now() - 20 * 3600 * 1000),
        },
      });

      // Task Discussion Comment
      const comment1 = await prisma.taskComment.create({
        data: {
          taskId: task1.id,
          authorId: hodUser.id,
          content: `Initial CO-PO mapping data collected from all 5 faculty members. Final report synthesis in progress.`,
        },
      });

      // Notification to HOD
      await prisma.notification.create({
        data: {
          recipientId: hodUser.id,
          eventType: 'TASK_ASSIGNED',
          title: `New Department Task Assigned by Academic Dean`,
          message: task1.title,
          relatedEntityType: 'TASK',
          relatedEntityId: task1.id,
          deepLinkRoute: `/tasks/${task1.id}`,
        },
      });
    }

    // 6. Department Chat Conversation
    const deptChat = await prisma.conversation.create({
      data: {
        type: 'DEPARTMENT',
        title: `${deptCode} Official Faculty & Mentor Forum`,
        departmentId: dept.id,
      },
    });

    await prisma.conversationParticipant.create({
      data: { conversationId: deptChat.id, userId: hodUser.id, role: 'ADMIN' },
    });

    for (const fUser of facultyUsers) {
      await prisma.conversationParticipant.create({
        data: { conversationId: deptChat.id, userId: fUser.id, role: 'MEMBER' },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: deptChat.id,
        senderId: hodUser.id,
        content: `Welcome team to the official ${deptCode} channel. Please submit your internal marks by this Friday.`,
      },
    });
  }

  // Seed WMCS Reusable Task Templates
  console.log('📋 Seeding central Task Template Library...');
  const templates = [
    { name: 'NAAC Criteria 4 Data Preparation', category: 'NAAC_DOCUMENTATION', suggestedTimelineDays: 14, slaHours: 72, defaultPriority: 'HIGH' },
    { name: 'NBA SAR Self Assessment Verification', category: 'NBA_DOCUMENTATION', suggestedTimelineDays: 10, slaHours: 48, defaultPriority: 'HIGH' },
    { name: 'NIRF Data & Placement Collection', category: 'IQAC_WORK', suggestedTimelineDays: 7, slaHours: 48, defaultPriority: 'MEDIUM' },
    { name: 'Semester Laboratory Outcome Audit', category: 'DEPARTMENT_AUDIT', suggestedTimelineDays: 5, slaHours: 24, defaultPriority: 'MEDIUM' },
    { name: 'Faculty Subject Outcome Mapping Review', category: 'TIMETABLE_REVIEW', suggestedTimelineDays: 3, slaHours: 24, defaultPriority: 'MEDIUM' },
  ];

  for (const tpl of templates) {
    const existing = await prisma.taskTemplate.findFirst({ where: { name: tpl.name } });
    if (!existing) {
      await prisma.taskTemplate.create({
        data: {
          name: tpl.name,
          category: tpl.category,
          description: `Standardized compliance template for ${tpl.name}.`,
          defaultChecklist: JSON.stringify([
            { id: 'chk-1', title: 'Collect raw documentation', isCompleted: false },
            { id: 'chk-2', title: 'Verify departmental HOD approval', isCompleted: false },
            { id: 'chk-3', title: 'Submit for Dean & IQAC Review', isCompleted: false },
          ]),
          suggestedTimelineDays: tpl.suggestedTimelineDays,
          slaHours: tpl.slaHours,
          defaultPriority: tpl.defaultPriority,
        },
      });
    }
  }

  // Seed SOP & Governance Knowledge Base Items
  console.log('📚 Seeding Governance SOP & Policy Library...');
  const sops = [
    { title: 'GEETORUS Academic & Exam Evaluation Regulation 2026', category: 'POLICY', content: 'Standard operating procedure for internal mark verification, revaluation policies, and COE question paper encryption.' },
    { title: 'NAAC & NBA Audit Readiness Guidelines', category: 'NAAC', content: 'Comprehensive checklist for department lab maintenance, student outcome attainment metrics, and publication verifications.' },
    { title: 'Campus Safety & Emergency Escalation Protocol', category: 'SAFETY', content: 'Emergency response guidelines for hostel, laboratory, transport, and administrative emergency handling.' },
  ];

  for (const sop of sops) {
    const existing = await prisma.sopLibraryItem.findFirst({ where: { title: sop.title } });
    if (!existing) {
      await prisma.sopLibraryItem.create({
        data: {
          title: sop.title,
          category: sop.category,
          content: sop.content,
          status: 'PUBLISHED',
        },
      });
    }
  }

  console.log('✅ Enterprise core accounts, WMCS task templates, SOP library, tasks & chats seeded successfully!');
}


main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
