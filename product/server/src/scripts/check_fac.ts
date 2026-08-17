import { prisma } from '../lib/prisma';

async function checkFac() {
  const fac = await prisma.faculty.findUnique({
    where: { id: '64a187fd-4163-4a16-989e-e5109559960c' },
    include: { user: true }
  });
  console.log('Faculty 64a187fd-4163-4a16-989e-e5109559960c:');
  console.log(fac);

  const mentorUser = await prisma.user.findUnique({
    where: { email: 'mentor1.cse@geetorus.com' },
  });
  console.log('\nUser mentor1.cse@geetorus.com:');
  console.log(mentorUser);

  if (mentorUser) {
    const userFacs = await prisma.faculty.findMany({
      where: { userId: mentorUser.id },
    });
    console.log('\nFaculties for user mentor1.cse@geetorus.com:');
    console.log(userFacs);
  }
}

checkFac().finally(() => prisma.$disconnect());
