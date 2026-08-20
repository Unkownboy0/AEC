import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function seedStandardAliases() {
  console.log('Seeding / verifying standard role aliases in database...');

  const passwordHash = await bcrypt.hash('Campus@123', 10);

  const aliases = [
    { email: 'accountant@geetorus.com', username: 'accountant', firstName: 'Kavitha', lastName: 'Sundaram', roleName: 'Accountant' },
    { email: 'ao@geetorus.com', username: 'ao', firstName: 'Muthukumar', lastName: 'Natarajan', roleName: 'Accounts Officer' },
    { email: 'transport.manager@geetorus.com', username: 'transport.manager', firstName: 'Senthil', lastName: 'Kumar', roleName: 'Transport Manager' },
    { email: 'hostel.warden@geetorus.com', username: 'hostel.warden', firstName: 'Raghavan', lastName: 'Pillai', roleName: 'Hostel Warden' },
    { email: 'librarian@geetorus.com', username: 'librarian', firstName: 'Anitha', lastName: 'Balasubramanian', roleName: 'Librarian' },
    { email: 'placement.officer@geetorus.com', username: 'placement.officer', firstName: 'Dinesh', lastName: 'Varma', roleName: 'Placement Officer' },
    { email: 'office.admin@geetorus.com', username: 'office.admin', firstName: 'Ramesh', lastName: 'Babu', roleName: 'Office Superintendent' },
  ];

  for (const alias of aliases) {
    let role = await prisma.role.findFirst({
      where: {
        OR: [
          { name: { equals: alias.roleName, mode: 'insensitive' } },
          { roleCode: { equals: alias.roleName.toUpperCase().replace(/\s+/g, '_'), mode: 'insensitive' } }
        ]
      }
    });

    if (!role) {
      // Create role if missing
      role = await prisma.role.create({
        data: {
          name: alias.roleName,
          roleCode: alias.roleName.toUpperCase().replace(/\s+/g, '_'),
          description: `${alias.roleName} institutional role`,
          isSystem: true,
          status: 'ACTIVE',
        }
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: alias.email },
          { username: alias.username }
        ]
      }
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: alias.email,
          username: alias.username,
          firstName: alias.firstName,
          lastName: alias.lastName,
          passwordHash,
          status: 'ACTIVE',
          roleId: role.id,
        }
      });
      console.log(`+ Created user: ${alias.email} (${alias.roleName})`);
    } else {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          status: 'ACTIVE',
          roleId: role.id,
        }
      });
      console.log(`* Updated user: ${alias.email} (${alias.roleName})`);
    }
  }

  console.log('Standard role aliases successfully provisioned.');
}

seedStandardAliases()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
