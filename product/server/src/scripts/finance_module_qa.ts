import fs from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';

async function main() {
  const user = await prisma.user.findFirst({ where: { status: 'ACTIVE', role: { OR: [{ roleCode: 'PRINCIPAL' }, { name: 'Principal' }] } }, include: { role: true } });
  if (!user) throw new Error('No active Principal account is available for read-only finance QA');
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role.name, permissions: ['*:*'] }, env.JWT_SECRET, { expiresIn: '5m' });
  const headers = { Authorization: `Bearer ${token}`, 'x-active-role': user.role.name };
  const output = path.join(process.cwd(), 'tmp', 'finance-qa'); await fs.mkdir(output, { recursive: true });
  const checks:any = {};
  for (const [name, route] of [['dashboard','/api/finance/dashboard'],['transactions','/api/finance/transactions']] as const) {
    const response = await fetch(`http://localhost:${env.PORT}${route}`, { headers }); checks[name] = response.status; if (!response.ok) checks[`${name}Error`] = await response.text();
  }
  for (const [name, route] of [['xlsx','/api/finance/reports/transactions.xlsx'],['pdf','/api/finance/reports/transactions.pdf']] as const) {
    const response = await fetch(`http://localhost:${env.PORT}${route}`, { headers }); checks[name] = response.status; if (!response.ok) checks[`${name}Error`] = await response.text(); else await fs.writeFile(path.join(output, `finance-report.${name}`), Buffer.from(await response.arrayBuffer()));
  }
  console.log(JSON.stringify(checks));
}
main().finally(() => prisma.$disconnect());
