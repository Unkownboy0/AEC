import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function checkAndFixPasswords() {
  const users = await prisma.user.findMany({
    include: { role: true },
  });

  console.log(`Total users in DB: ${users.length}`);

  for (const u of users) {
    let expectedPassword = 'Campus@123';
    if (u.email === 'admin@geetorus.com') expectedPassword = 'Admin@123';
    else if (u.email === 'college.admin@geetorus.com') expectedPassword = 'ColAdmin@123';
    else if (u.email === 'vp@geetorus.com') expectedPassword = 'VP@123456';
    else if (u.email === 'academic.dean@geetorus.com') expectedPassword = 'AcaDean@123';
    else if (u.email === 'admission.dean@geetorus.com') expectedPassword = 'AdmDean@123';
    else if (u.email === 'iqac.dean@geetorus.com') expectedPassword = 'IQAC@123';
    else if (u.email === 'iqac.exec@geetorus.com') expectedPassword = 'IqacExec@123';
    else if (u.email === 'iqac.doc@geetorus.com') expectedPassword = 'IqacDoc@123';

    const matches = await bcrypt.compare(expectedPassword, u.passwordHash);
    console.log(`User: ${u.email.padEnd(32)} Role: ${(u.role?.name || 'N/A').padEnd(25)} Expected: ${expectedPassword.padEnd(14)} Valid: ${matches}`);
  }
}

checkAndFixPasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
