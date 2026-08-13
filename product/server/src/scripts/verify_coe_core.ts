import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';

async function request(path: string, token: string, activeRole: string) {
  return fetch(`http://127.0.0.1:${env.PORT}${path}`, { headers: { Authorization: `Bearer ${token}`, 'X-Active-Role': activeRole } });
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'academic.dean@geetorus.com' }, include: { role: true } });
  if (!user) throw new Error('Academic Dean test identity is missing');
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role.name, permissions: [] }, env.JWT_SECRET, { expiresIn: '5m' });
  const deanResponse = await request('/api/coe/dashboard', token, 'Academic Dean');
  const coeResponse = await request('/api/coe/dashboard', token, 'Examination Cell');
  if (deanResponse.status !== 403) throw new Error(`COE authority leaked into Academic Dean workspace (${deanResponse.status})`);
  if (coeResponse.status !== 200) throw new Error(`COE dashboard failed in COE workspace (${coeResponse.status}: ${await coeResponse.text()})`);
  const data: any = await coeResponse.json();
  console.log(JSON.stringify({ academicDeanWorkspace: 'DENIED', coeWorkspace: 'AUTHORIZED', dashboardStatus: data.status }));
}

main().finally(() => prisma.$disconnect());
