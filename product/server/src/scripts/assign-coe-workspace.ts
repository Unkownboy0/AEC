import { prisma } from '../lib/prisma';

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.CONFIRM_COE_ASSIGNMENT !== 'true') {
    throw new Error('Set CONFIRM_COE_ASSIGNMENT=true for an explicitly authorized production assignment');
  }
  const user = await prisma.user.findUnique({ where: { email: 'academic.dean@geetorus.com' } });
  const role = await prisma.role.findUnique({ where: { name: 'Examination Cell' } });
  if (!user || !role) throw new Error('Academic Dean or Examination Cell role is missing');
  await prisma.userWorkspace.upsert({
    where: { userId_workspaceCode: { userId: user.id, workspaceCode: 'COE' } },
    update: { workspaceName: 'COE Workspace', roleName: role.name, status: 'ACTIVE' },
    create: { userId: user.id, workspaceCode: 'COE', workspaceName: 'COE Workspace', roleName: role.name, isPrimary: false, status: 'ACTIVE' },
  });
  console.log('Academic Dean COE workspace assigned');
}

main().finally(() => prisma.$disconnect());
