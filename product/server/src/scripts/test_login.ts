import { AuthService } from '../modules/auth/auth.service';
import { prisma } from '../lib/prisma';

async function test() {
  const service = new AuthService();
  const repo = (service as any).repo;
  const user = await repo.findByEmail('ada.lovelace@geetorus.com');
  console.log('Repo findByEmail result:', user ? `Found: ${user.email}, Status: ${user.status}, Role: ${user.role?.name}` : 'NOT FOUND!');
  
  if (user) {
    console.log('User details: ID:', user.id, 'Failed attempts:', user.failedLoginAttempts, 'Locked until:', user.lockedUntil);
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
