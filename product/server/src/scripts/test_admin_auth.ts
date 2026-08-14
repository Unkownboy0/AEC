import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function testAdmin() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@geetorus.com' },
  });
  if (!admin) {
    console.log('Admin not found!');
    return;
  }
  console.log('Admin found:');
  console.log('Email:', admin.email);
  console.log('Password hash:', admin.passwordHash);
  console.log('Status:', admin.status);
  console.log('Locked until:', admin.lockedUntil);
  console.log('Failed attempts:', admin.failedLoginAttempts);

  const testPasswords = ['Admin@123', 'admin@123', 'admin', 'password', 'Campus@123', 'Pass@123', 'SuperAdmin@123', 'Geetorus@123'];
  for (const p of testPasswords) {
    const res = await bcrypt.compare(p, admin.passwordHash);
    console.log(`Password "${p}":`, res);
  }
}

testAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
