import { EventEmitter } from 'events';

export const rbacEvents = new EventEmitter();

// Global connection pool for Server-Sent Events or WebSockets
const activeSSEClients: Array<{ userId: string; workspace: string; res: any }> = [];
let nextEventId = 1;

export function registerSSEClient(userId: string, workspace: string, res: any) {
  activeSSEClients.push({ userId, workspace, res });
}

export function removeSSEClient(res: any) {
  const index = activeSSEClients.findIndex((c) => c.res === res);
  if (index !== -1) {
    activeSSEClients.splice(index, 1);
  }
}

export function broadcastRBACUpdate(data: {
  type: string;
  roleId?: string;
  userId?: string;
  payload?: any;
}) {
  // Emit local event
  rbacEvents.emit('rbac_change', data);

  // Deliver only to the targeted user when one is specified; events without a userId
  // (e.g. a role-wide ROLE_UPDATED) still fan out to everyone since they have no single recipient.
  const eventId = String(nextEventId++);
  const payloadStr = `id: ${eventId}\ndata: ${JSON.stringify({ ...data, eventId, timestamp: new Date().toISOString() })}\n\n`;
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
