import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function resetAllPasswords() {
  console.log('🔄 Resetting all user passwords to standard credentials...');

  const users = await prisma.user.findMany({
    include: { role: true },
  });

  console.log(`Found ${users.length} users in database.`);

  const passwordMap: Record<string, string> = {
    'admin@geetorus.com': 'Admin@123',
    'college.admin@geetorus.com': 'ColAdmin@123',
    'principal@geetorus.com': 'Campus@123',
    'vp@geetorus.com': 'VP@123456',
    'academic.dean@geetorus.com': 'AcaDean@123',
    'admission.dean@geetorus.com': 'AdmDean@123',
    'iqac.dean@geetorus.com': 'IQAC@123',
    'iqac.exec@geetorus.com': 'IqacExec@123',
    'iqac.doc@geetorus.com': 'IqacDoc@123',
  };

  const defaultPassword = 'Campus@123';
  const hashedDefault = await bcrypt.hash(defaultPassword, 10);

  let updatedCount = 0;

  for (const user of users) {
    let plainPassword = passwordMap[user.email] || defaultPassword;
    let passwordHash = passwordMap[user.email] 
      ? await bcrypt.hash(plainPassword, 10)
      : hashedDefault;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: 'ACTIVE',
      },
    });

    updatedCount++;
  }

  console.log(`✅ Successfully updated ${updatedCount} users with valid bcrypt password hashes!`);

  // Verify admin@geetorus.com
  const admin = await prisma.user.findUnique({ where: { email: 'admin@geetorus.com' } });
  if (admin) {
    const valid = await bcrypt.compare('Admin@123', admin.passwordHash);
    console.log(`🔑 Verification check for admin@geetorus.com ('Admin@123'): ${valid ? 'PASSED ✅' : 'FAILED ❌'}`);
  }
}

resetAllPasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
