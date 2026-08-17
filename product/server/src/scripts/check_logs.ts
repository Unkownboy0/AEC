import { prisma } from '../lib/prisma';
import { NotificationAdminService } from '../modules/notifications/notification-admin.service';

async function main() {
  const logs = await NotificationAdminService.getDeliveryLogs({ limit: 6 });
  console.log('Total logs:', logs.meta.total);
  console.log('Recent logs preview:');
  logs.data.forEach((l: any, i: number) => {
    console.log(`${i + 1}. [${l.eventType}] ${l.title} -> ${l.recipient.name} (${l.recipient.email}) | Devices: ${l.recipient.activeDevices} | State: ${l.deliveryState}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
