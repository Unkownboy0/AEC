import { prisma } from '../lib/prisma';

async function generateCredentialsReport() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      firstName: true,
      lastName: true,
      role: { select: { name: true, hierarchy: true } },
    },
    orderBy: [{ role: { hierarchy: 'asc' } }, { email: 'asc' }],
  });

  const grouped: Record<string, any[]> = {};
  users.forEach((u) => {
    const roleName = u.role?.name || 'Other';
    if (!grouped[roleName]) grouped[roleName] = [];
    grouped[roleName].push(u);
  });

  console.log(JSON.stringify(grouped, null, 2));
}

generateCredentialsReport()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
