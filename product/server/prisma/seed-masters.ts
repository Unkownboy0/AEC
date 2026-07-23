import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Phase 4 Master Data...');

  // 1. Seed 5 Academic Years
  const academicYears = [
    { name: '2025-2026', startDate: new Date('2025-06-01'), endDate: new Date('2026-05-31'), status: 'INACTIVE', isCurrent: false },
    { name: '2026-2027', startDate: new Date('2026-06-01'), endDate: new Date('2027-05-31'), status: 'ACTIVE', isCurrent: true },
    { name: '2027-2028', startDate: new Date('2027-06-01'), endDate: new Date('2028-05-31'), status: 'INACTIVE', isCurrent: false },
    { name: '2028-2029', startDate: new Date('2028-06-01'), endDate: new Date('2029-05-31'), status: 'INACTIVE', isCurrent: false },
    { name: '2029-2030', startDate: new Date('2029-06-01'), endDate: new Date('2030-05-31'), status: 'INACTIVE', isCurrent: false },
  ];

  const dbYears = [];
  for (const ay of academicYears) {
    const y = await prisma.academicYear.upsert({
      where: { name: ay.name },
      update: {
        status: ay.status,
        isCurrent: ay.isCurrent,
        startDate: ay.startDate,
        endDate: ay.endDate,
      },
      create: ay,
    });
    dbYears.push(y);
  }
  const currentYear = dbYears.find(y => y.isCurrent) || dbYears[1];
  console.log(`📅 Seeded ${dbYears.length} Academic Years.`);

  // 2. Seed 13 core Departments
  const departments = [
    { name: 'Information Technology', code: 'IT', type: 'Engineering' },
    { name: 'Computer Science & Engineering', code: 'CSE', type: 'Engineering' },
    { name: 'Electronics & Communication Engineering', code: 'ECE', type: 'Engineering' },
    { name: 'Electrical & Electronics Engineering', code: 'EEE', type: 'Engineering' },
    { name: 'Mechanical Engineering', code: 'MECH', type: 'Engineering' },
    { name: 'Civil Engineering', code: 'CIVIL', type: 'Engineering' },
    { name: 'Artificial Intelligence & Data Science', code: 'AI&DS', type: 'Engineering' },
    { name: 'Artificial Intelligence & Machine Learning', code: 'AIML', type: 'Engineering' },
    { name: 'Computer Science & Business Systems', code: 'CSBS', type: 'Engineering' },
    { name: 'Biomedical Engineering', code: 'BME', type: 'Engineering' },
    { name: 'Master of Business Administration', code: 'MBA', type: 'Management' },
    { name: 'Master of Computer Applications', code: 'MCA', type: 'Science' },
    { name: 'Science & Humanities', code: 'S&H', type: 'Science' }
  ];

  const dbDepts = [];
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, type: dept.type, status: 'ACTIVE', academicYearId: currentYear.id },
      create: { ...dept, status: 'ACTIVE', academicYearId: currentYear.id }
    });
    dbDepts.push(d);
  }
  console.log(`🏢 Seeded ${dbDepts.length} Departments (including S&H).`);

  // 3. Programs, Courses & Semesters 1 to 8 under each Department
  for (const d of dbDepts) {
    let progName = 'Bachelor of Technology';
    let progCode = 'B.Tech';
    let duration = 4;
    let level = 'UG';
    let credits = 160;

    if (d.code === 'MBA') {
      progName = 'Master of Business Administration';
      progCode = 'MBA';
      duration = 2;
      level = 'PG';
      credits = 80;
    } else if (d.code === 'MCA') {
      progName = 'Master of Computer Applications';
      progCode = 'MCA';
      duration = 2;
      level = 'PG';
      credits = 80;
    } else if (d.code === 'S&H') {
      progName = 'Science & Humanities Programme';
      progCode = 'S&H';
      duration = 1;
      level = 'UG';
      credits = 40;
    } else if (['MECH', 'CIVIL', 'EEE', 'ECE'].includes(d.code)) {
      progName = 'Bachelor of Engineering';
      progCode = 'BE';
      duration = 4;
      level = 'UG';
      credits = 160;
    }

    // Check if Program already exists in this Department
    let prog = await prisma.program.findFirst({
      where: { code: progCode, departmentId: d.id }
    });
    if (!prog) {
      prog = await prisma.program.create({
        data: {
          name: progName,
          code: progCode,
          duration,
          level,
          credits,
          departmentId: d.id,
          status: 'ACTIVE'
        }
      });
    }

    // Check if Course already exists under this Program
    let course = await prisma.course.findFirst({
      where: { code: `${d.code}-CORE`, programId: prog.id }
    });
    if (!course) {
      course = await prisma.course.create({
        data: {
          name: `${d.name} Core Course`,
          code: `${d.code}-CORE`,
          duration,
          departmentId: d.id,
          programId: prog.id,
          credits,
          status: 'ACTIVE'
        }
      });
    }

    // Create Semesters 1 to 8 (or total sem count based on duration * 2) under all academic years
    for (const ay of dbYears) {
      const totalSems = duration * 2;
      for (let semNum = 1; semNum <= totalSems; semNum++) {
        const semName = `Semester ${semNum}`;
        const semExists = await prisma.semester.findFirst({
          where: { number: semNum, courseId: course.id }
        });
        if (!semExists) {
          await prisma.semester.create({
            data: {
              number: semNum,
              name: semName,
              startDate: ay.startDate,
              endDate: ay.endDate,
              courseId: course.id,
              programId: prog.id,
              academicYearId: ay.id,
              status: 'ACTIVE'
            }
          });
        }
      }
    }
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch(e => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
