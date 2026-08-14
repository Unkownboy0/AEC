import { prisma } from '../lib/prisma';
import { HodTimetableService } from '../modules/timetable/hod-timetable.service';
import { logger } from '../utils/logger';

const db = prisma as any;

async function seedHodTimetableDemo() {
  console.log('⚡ Seeding realistic HOD Timetable Demo Data for CSE & IT...');

  try {
    // 1. Departments
    const deptCSE = await prisma.department.findFirst({ where: { code: 'CSE' } });
    const deptIT = await prisma.department.findFirst({ where: { code: 'IT' } });
    const deptAIDS = await prisma.department.findFirst({ where: { code: 'AI&DS' } });

    if (!deptCSE || !deptIT) {
      console.error('CSE or IT department not found');
      return;
    }

    // 2. Academic Year & Programs
    const acaYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } }) ||
      await prisma.academicYear.findFirst() ||
      await prisma.academicYear.create({
        data: { name: '2026-2027', startDate: new Date('2026-06-01'), endDate: new Date('2027-05-31'), isCurrent: true }
      });

    const progCSE = await prisma.program.findFirst({ where: { departmentId: deptCSE.id } }) ||
      await prisma.program.create({
        data: { name: 'B.E. CSE', code: 'BE-CSE', departmentId: deptCSE.id }
      });

    const courseCSE = await prisma.course.findFirst({ where: { departmentId: deptCSE.id } }) ||
      await prisma.course.create({
        data: { name: 'B.E. Computer Science and Engineering', code: 'CSE-MAIN', departmentId: deptCSE.id, programId: progCSE.id, duration: 4 }
      });

    // 3. Semesters & Sections
    const sem7CSE = await prisma.semester.findFirst({ where: { courseId: courseCSE.id, number: 7 } }) ||
      await prisma.semester.create({
        data: { name: 'Semester 7', number: 7, startDate: new Date('2026-07-01'), endDate: new Date('2026-12-15'), courseId: courseCSE.id, programId: progCSE.id, academicYearId: acaYear.id }
      });

    const sec7A_CSE = await prisma.section.findFirst({ where: { semesterId: sem7CSE.id, name: 'VII CSE-A' } }) ||
      await prisma.section.create({
        data: { name: 'VII CSE-A', semesterId: sem7CSE.id, programId: progCSE.id, departmentId: deptCSE.id, room: 'C201' }
      });

    const sec7B_CSE = await prisma.section.findFirst({ where: { semesterId: sem7CSE.id, name: 'VII CSE-B' } }) ||
      await prisma.section.create({
        data: { name: 'VII CSE-B', semesterId: sem7CSE.id, programId: progCSE.id, departmentId: deptCSE.id, room: 'C202' }
      });

    // 4. Faculty
    const cseFaculty = await prisma.faculty.findMany({ where: { departmentId: deptCSE.id }, take: 5 });
    const aidsFaculty = deptAIDS ? await prisma.faculty.findMany({ where: { departmentId: deptAIDS.id }, take: 2 }) : [];

    if (cseFaculty.length === 0) {
      console.log('No faculty found in CSE, creating sample faculty');
    }

    // 5. Subjects
    const subCloud = await prisma.subject.upsert({
      where: { code: '23CS7T1' },
      update: { departmentId: deptCSE.id },
      create: {
        code: '23CS7T1', name: 'Cloud Computing & DevOps', credits: 3, theoryHours: 4,
        departmentId: deptCSE.id, programId: progCSE.id, semesterId: sem7CSE.id, isLab: false,
      }
    });

    const subML = await prisma.subject.upsert({
      where: { code: '23CS7T2' },
      update: { departmentId: deptCSE.id },
      create: {
        code: '23CS7T2', name: 'Machine Learning & Neural Nets', credits: 3, theoryHours: 4,
        departmentId: deptCSE.id, programId: progCSE.id, semesterId: sem7CSE.id, isLab: false,
      }
    });

    const subSec = await prisma.subject.upsert({
      where: { code: '23CS7T3' },
      update: { departmentId: deptCSE.id },
      create: {
        code: '23CS7T3', name: 'Cyber Security & Cryptography', credits: 3, theoryHours: 4,
        departmentId: deptCSE.id, programId: progCSE.id, semesterId: sem7CSE.id, isLab: false,
      }
    });

    const subCloudLab = await prisma.subject.upsert({
      where: { code: '23CS7L1' },
      update: { departmentId: deptCSE.id },
      create: {
        code: '23CS7L1', name: 'Cloud & DevOps Laboratory', credits: 2, practicalHours: 3,
        departmentId: deptCSE.id, programId: progCSE.id, semesterId: sem7CSE.id, isLab: true,
      }
    });

    // 6. Cross-Department Visiting Assignment: AI&DS Faculty teaches ML in CSE
    if (aidsFaculty.length > 0) {
      await db.facultyTeachingAssignment.upsert({
        where: { id: 'demo-visiting-ml' },
        update: {},
        create: {
          id: 'demo-visiting-ml',
          facultyId: aidsFaculty[0].id,
          homeDepartmentId: deptAIDS!.id,
          teachingDepartmentId: deptCSE.id,
          subjectId: subML.id,
          semesterId: sem7CSE.id,
          sectionId: sec7A_CSE.id,
          academicYearId: acaYear.id,
          periodsPerWeek: 4,
          status: 'ACTIVE',
        }
      });
    }

    // 7. Create Official Revision REV-00 for CSE
    const hUser = await prisma.user.findFirst({ where: { role: { name: 'HOD' }, departmentId: deptCSE.id } }) ||
      await prisma.user.findFirst();

    const rev00 = await db.timetableRevision.create({
      data: {
        departmentId: deptCSE.id,
        academicYearId: acaYear.id,
        semesterId: sem7CSE.id,
        revisionNumber: 0,
        revisionCode: 'REV-00',
        effectiveFrom: new Date('2026-07-01'),
        status: 'PUBLISHED',
        publishedById: hUser?.id || 'admin',
        publishedAt: new Date(),
        changeSummary: 'Official Odd Semester Timetable Release 2026-2027',
      }
    });

    // 8. Timetable Slots
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    const periodTimes: Record<number, { start: string; end: string }> = {
      1: { start: '09:00', end: '09:50' },
      2: { start: '09:50', end: '10:40' },
      3: { start: '11:00', end: '11:50' },
      4: { start: '11:50', end: '12:40' },
      5: { start: '01:30', end: '02:20' },
      6: { start: '02:20', end: '03:10' },
      7: { start: '03:20', end: '04:10' },
      8: { start: '04:10', end: '05:00' },
    };

    const slotsToCreate = [
      // Monday
      { day: 'MONDAY', period: 1, sub: subCloud, fac: cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' },
      { day: 'MONDAY', period: 2, sub: subSec, fac: cseFaculty[1] || cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' },
      { day: 'MONDAY', period: 3, sub: subML, fac: aidsFaculty[0] || cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' }, // Cross-Dept!
      { day: 'MONDAY', period: 5, sub: subCloudLab, fac: cseFaculty[0], sec: sec7A_CSE, room: 'CSE-LAB-1', isLab: true, type: 'LAB' },
      { day: 'MONDAY', period: 6, sub: subCloudLab, fac: cseFaculty[0], sec: sec7A_CSE, room: 'CSE-LAB-1', isLab: true, type: 'LAB' },

      // Tuesday
      { day: 'TUESDAY', period: 1, sub: subML, fac: aidsFaculty[0] || cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' }, // Cross-Dept!
      { day: 'TUESDAY', period: 2, sub: subCloud, fac: cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' },
      { day: 'TUESDAY', period: 4, sub: subSec, fac: cseFaculty[1] || cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' },
      { day: 'TUESDAY', period: 7, sub: subCloud, fac: cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'TUTORIAL' },

      // Wednesday
      { day: 'WEDNESDAY', period: 1, sub: subSec, fac: cseFaculty[1] || cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' },
      { day: 'WEDNESDAY', period: 2, sub: subML, fac: aidsFaculty[0] || cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' }, // Cross-Dept!
      { day: 'WEDNESDAY', period: 3, sub: subCloud, fac: cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' },

      // Thursday
      { day: 'THURSDAY', period: 2, sub: subCloud, fac: cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' },
      { day: 'THURSDAY', period: 3, sub: subSec, fac: cseFaculty[1] || cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' },
      { day: 'THURSDAY', period: 4, sub: subML, fac: aidsFaculty[0] || cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' }, // Cross-Dept!

      // Friday
      { day: 'FRIDAY', period: 1, sub: subCloud, fac: cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' },
      { day: 'FRIDAY', period: 2, sub: subSec, fac: cseFaculty[1] || cseFaculty[0], sec: sec7A_CSE, room: 'C201', isLab: false, type: 'THEORY' },
    ];

    for (const s of slotsToCreate) {
      if (!s.fac || !s.sub || !s.sec) continue;
      await db.timetableSlot.create({
        data: {
          departmentId: deptCSE.id,
          academicYearId: acaYear.id,
          semesterId: sem7CSE.id,
          sectionId: s.sec.id,
          subjectId: s.sub.id,
          facultyId: s.fac.id,
          dayOfWeek: s.day,
          slotIndex: s.period,
          startTime: periodTimes[s.period].start,
          endTime: periodTimes[s.period].end,
          roomNo: s.room,
          isLab: s.isLab,
          slotType: s.type,
          revisionId: rev00.id,
          status: 'ACTIVE',
        }
      });
    }

    console.log(`✅ Seeded ${slotsToCreate.length} live timetable slots for CSE in ${rev00.revisionCode}!`);

  } catch (err) {
    console.error('Error seeding demo timetable:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedHodTimetableDemo();
