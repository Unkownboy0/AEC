import { prisma } from '../lib/prisma';

async function check() {
  const dept = await prisma.department.findFirst({ where: { code: 'CSE' } });
  console.log('CSE Department:', dept);

  const hodUsers = await prisma.user.findMany({
    where: {
      OR: [
        { role: { name: { contains: 'HOD' } } },
        { email: { contains: 'hod' } },
        { email: { contains: 'head' } },
      ],
    },
    select: {
      id: true,
      email: true,
      departmentId: true,
      role: { select: { id: true, name: true, roleCode: true } },
    },
  });
  console.log('HOD Users:', hodUsers);

  const faculties = await prisma.faculty.findMany({
    where: { designation: { contains: 'HOD' } },
    select: { id: true, employeeId: true, departmentId: true, userId: true },
  });
  console.log('HOD Faculties:', faculties);
}

check().finally(() => prisma.$disconnect());
