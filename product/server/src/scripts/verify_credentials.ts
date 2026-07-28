import { credentialService } from '../modules/users/credential.service';
import { prisma } from '../lib/prisma';

async function testCredentialGenerator() {
  console.log("=== GEETORUS CAMPUSOS CREDENTIAL GENERATION VERIFICATION ===");

  const rolesToTest = [
    'Student',
    'Parent',
    'Faculty',
    'Mentor',
    'HOD',
    'Academic Dean',
    'Administration & Admission Dean',
    'IQAC Dean',
    'Vice Principal',
    'Principal',
    'Accounts Officer',
    'Exam Cell Staff',
    'Placement Officer',
    'Librarian',
    'Hostel Warden',
    'Transport Manager',
    'Office Staff',
    'College Admin'
  ];

  console.log(`\nTesting Username Generation across ${rolesToTest.length} roles...`);
  for (const role of rolesToTest) {
    const prefix = credentialService.getRolePrefix(role);
    const username1 = await credentialService.generateUsername(role, 2026);
    const username2 = await credentialService.generateUsername(role, 2026);
    console.log(`✓ Role: '${role}' -> Prefix: [${prefix}] -> Auto Usernames: ${username1}, ${username2}`);
  }

  console.log("\nTesting Temporary Password Generation & Security Strength Policy...");
  for (let i = 1; i <= 5; i++) {
    const password = credentialService.generateTemporaryPassword();
    const validation = credentialService.validatePasswordStrength(password);
    const hash = await credentialService.hashPassword(password);
    console.log(`✓ Pass ${i}: Password='${password}' | Valid=${validation.valid} | Hash=${hash.slice(0, 25)}...`);
  }

  // Cleanup test username counter rows created during test
  await (prisma as any).usernameCounter.deleteMany({
    where: { year: 2026 }
  }).catch(() => null);

  console.log("\nCredential Service Verification Complete!");
}

testCredentialGenerator()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test error:", err);
    process.exit(1);
  });
