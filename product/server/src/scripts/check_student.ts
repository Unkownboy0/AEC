import { prisma } from '../lib/prisma';

async function check() {
  const s = await prisma.student.findFirst({
    where: { email: 'john.smith@gmail.com' },
    select: {
      id: true,
      admissionNo: true,
      mentorId: true,
      sectionId: true,
      section: { select: { classAdvisor: true } },
      mentor: { select: { id: true, userId: true, firstName: true, email: true } },
    },
  });
  console.log('Student details:', JSON.stringify(s, null, 2));

  const mentorAssign = await prisma.mentorAssignment.findFirst({
    where: { studentId: s?.id },
    include: { mentor: { select: { id: true, userId: true } } },
  });
  console.log('Mentor assignment for student:', mentorAssign);
}

check().finally(() => prisma.$disconnect());
