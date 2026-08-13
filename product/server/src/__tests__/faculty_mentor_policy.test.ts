import assert from 'node:assert/strict';
import { TeachingGroupService } from '../modules/faculty/teaching-group.service';

async function run() {
  const requester = { id: 'faculty-user', role: 'Faculty' } as any;
  const prismaModule = require('../lib/prisma');
  const prisma = prismaModule.prisma;
  const originalFindFaculty = prisma.faculty.findFirst;

  prisma.faculty.findFirst = async () => ({ id: 'faculty-profile' });
  assert.equal(await TeachingGroupService.resolveFacultyId(requester), 'faculty-profile');
  await assert.rejects(
    () => TeachingGroupService.resolveFacultyId(requester, 'another-faculty'),
    /only create their own teaching groups/i,
  );

  prisma.faculty.findFirst = originalFindFaculty;
  console.log('Faculty and Mentor policy tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
