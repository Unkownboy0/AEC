import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function check() {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      roleCode: true,
      users: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          status: true,
        },
        take: 2,
      },
    },
  });

  console.log('Roles and sample accounts in database:');
  for (const r of roles) {
    console.log(`Role: "${r.name}" (${r.roleCode}):`);
    for (const u of r.users) {
      console.log(`  - ${u.email} (${u.firstName} ${u.lastName}, Status: ${u.status})`);
    }
  }
}


check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
