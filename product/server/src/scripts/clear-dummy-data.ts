import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDummyData() {
  console.log('🧹 Clearing dummy student and faculty data...');

  try {
    const db = prisma as any;

    if (db.assignmentSubmission) await db.assignmentSubmission.deleteMany({});
    if (db.assignment) await db.assignment.deleteMany({});
    if (db.attendance) await db.attendance.deleteMany({});
    if (db.subjectAssignment) await db.subjectAssignment.deleteMany({});
    if (db.mentorAssignment) await db.mentorAssignment.deleteMany({});
    if (db.placementApplication) await db.placementApplication.deleteMany({});

    // Delete Student & Faculty records
    if (db.student) {
      const deletedStudents = await db.student.deleteMany({});
      console.log(`✅ Deleted ${deletedStudents.count} student profiles.`);
    }

    if (db.faculty) {
      const deletedFaculties = await db.faculty.deleteMany({});
      console.log(`✅ Deleted ${deletedFaculties.count} faculty profiles.`);
    }

    // Find student and faculty roles
    const roles = await prisma.role.findMany({
      where: {
        name: { in: ['Student', 'Faculty', 'Mentor', 'Parent'] }
      }
    });

    const roleIds = roles.map(r => r.id);

    if (roleIds.length > 0) {
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          roleId: { in: roleIds }
        }
      });
      console.log(`✅ Deleted ${deletedUsers.count} dummy user accounts.`);
    }

    console.log('✨ All dummy student and faculty data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing dummy data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDummyData();
