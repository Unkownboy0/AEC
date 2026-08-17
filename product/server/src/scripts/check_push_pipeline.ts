import { prisma } from '../lib/prisma';

async function main() {
  const student = await prisma.student.findFirst({
    where: { email: 'student001.cse@geetorus.com' },
    include: {
      academicYear: true,
      semester: true,
      section: true,
      department: true,
    },
  });
  console.log('Student 001 academic relations:', {
    academicYear: student?.academicYear,
    semester: student?.semester,
    section: student?.section,
    department: student?.department,
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
