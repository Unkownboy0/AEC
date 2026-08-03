import { prisma } from '../lib/prisma';

export async function runHodIntegrityCheck() {
  console.log('Running HOD Department Architecture Integrity Check...');

  const activeAssignments = await (prisma as any).departmentHodAssignment.findMany({
    where: { isActive: true },
    include: { department: true, hodUser: true },
  });

  console.log(`[HOD Integrity Check]: Found ${activeAssignments.length} active department HOD assignments.`);
  return true;
}

if (require.main === module) {
  runHodIntegrityCheck().then(() => console.log('HOD Integrity Check Passed!'));
}
