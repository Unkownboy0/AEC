import { prisma } from '../lib/prisma';

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      role: { select: { name: true } },
    },
    orderBy: [{ role: { hierarchy: 'asc' } }, { email: 'asc' }],
  });

  console.log(`\n========================================================================`);
  console.log(`  TOTAL USERS IN DATABASE: ${users.length}`);
  console.log(`========================================================================`);
  console.table(
    users.map((u) => ({
      Name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      Email: u.email,
      Role: u.role?.name || 'No Role',
      Status: u.status,
    }))
  );
  console.log(`========================================================================\n`);
}

listUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
