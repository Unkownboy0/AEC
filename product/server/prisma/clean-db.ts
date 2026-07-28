import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting cleanup of all dummy and sample data...');

  // 1. Delete operational & transactional records
  await prisma.admissionApplication.deleteMany({});
  await prisma.counsellingSession.deleteMany({});
  await prisma.studentEnquiry.deleteMany({});
  await prisma.departmentIntake.deleteMany({});
  await prisma.placementRecord.deleteMany({});
  await prisma.counselingRecord.deleteMany({});
  await prisma.workflowHistory.deleteMany({});
  await prisma.workflowRequest.deleteMany({});
  await prisma.timetableSlot.deleteMany({});
  await prisma.masterTimetable.deleteMany({});
  await prisma.hodCircularReadTracker.deleteMany({});
  await prisma.hodCircular.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.libraryBook.deleteMany({});
  await prisma.feeBill.deleteMany({});
  await prisma.feeCategory.deleteMany({});
  await prisma.mark.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.attendance.deleteMany({});

  // 2. Delete curriculum & academic structure
  await prisma.curriculumMaterial.deleteMany({});
  await prisma.curriculumTopic.deleteMany({});
  await prisma.curriculumUnit.deleteMany({});
  await prisma.questionBankItem.deleteMany({});
  await prisma.labExperiment.deleteMany({});
  await prisma.coPoMapping.deleteMany({});
  await prisma.courseOutcome.deleteMany({});
  await prisma.programSpecificOutcome.deleteMany({});
  await prisma.programOutcome.deleteMany({});
  await prisma.regulation.deleteMany({});
  await prisma.curriculumVersionLog.deleteMany({});

  await prisma.subject.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.semester.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.program.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.academicYear.deleteMany({});
  await prisma.masterRecord.deleteMany({});

  // 3. Clean student and faculty records
  await prisma.student.deleteMany({});
  await prisma.faculty.deleteMany({});

  // 4. Clean non-admin users (preserve admin@geetorus.com / Super Admin)
  const superAdminRole = await prisma.role.findFirst({
    where: { name: 'Super Admin' },
  });

  if (superAdminRole) {
    await prisma.user.deleteMany({
      where: {
        roleId: {
          not: superAdminRole.id,
        },
      },
    });
  } else {
    await prisma.user.deleteMany({
      where: {
        email: {
          not: 'admin@geetorus.com',
        },
      },
    });
  }

  // 5. Clear activity logs, logs, login histories, user sessions
  await prisma.userSession.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.loginHistory.deleteMany({});
  await prisma.userActivityLog.deleteMany({});
  await prisma.backupLog.deleteMany({});
  await prisma.mediaFile.deleteMany({});

  console.log('✨ Cleaned all dummy data and activity logs successfully! Database is completely clean.');
}

main()
  .catch((e) => {
    console.error('❌ Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
