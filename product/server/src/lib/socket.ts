import { EventEmitter } from 'events';

export const rbacEvents = new EventEmitter();

// Global connection pool for Server-Sent Events or WebSockets
const activeSSEClients: Array<{ userId: string; res: any }> = [];

export function registerSSEClient(userId: string, res: any) {
  activeSSEClients.push({ userId, res });
}

export function removeSSEClient(res: any) {
  const index = activeSSEClients.findIndex((c) => c.res === res);
  if (index !== -1) {
    activeSSEClients.splice(index, 1);
  }
}

export function broadcastRBACUpdate(data: {
  type: 'ROLE_UPDATED' | 'PERMISSIONS_UPDATED' | 'SIDEBAR_UPDATED' | 'DASHBOARD_UPDATED' | 'APPROVAL_UPDATED' | 'WORKSPACE_UPDATED' | 'ATTENDANCE_UPDATED';
  roleId?: string;
  userId?: string;
  payload?: any;
}) {
  // Emit local event
  rbacEvents.emit('rbac_change', data);

  // Deliver only to the targeted user when one is specified; events without a userId
  // (e.g. a role-wide ROLE_UPDATED) still fan out to everyone since they have no single recipient.
  const payloadStr = `data: ${JSON.stringify({ ...data, timestamp: new Date().toISOString() })}\n\n`;
  const targets = data.userId
    ? activeSSEClients.filter((c) => c.userId === data.userId)
    : activeSSEClients;

  targets.forEach((client) => {
    try {
      client.res.write(payloadStr);
    } catch (err) {
      // client disconnected
    }
  });
}
