import { prisma } from '../lib/prisma';

async function main() {
  const faculties = await prisma.faculty.findMany({
    where: { userId: { not: null } },
  });
  let count = 0;
  for (const f of faculties) {
    if (f.userId && f.departmentId) {
      await prisma.user.update({
        where: { id: f.userId },
        data: { departmentId: f.departmentId },
      });
      count++;
    }
  }
  console.log(`Successfully synced departmentId for ${count} faculty users.`);

  const students = await prisma.student.findMany({
    where: { userId: { not: null } },
  });
  let studentCount = 0;
  for (const s of students) {
    if (s.userId && s.departmentId) {
      await prisma.user.update({
        where: { id: s.userId },
        data: { departmentId: s.departmentId },
      });
      studentCount++;
    }
  }
  console.log(`Successfully synced departmentId for ${studentCount} student users.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
