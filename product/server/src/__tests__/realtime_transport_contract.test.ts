import assert from 'assert';
import fs from 'fs';
import path from 'path';

const client = fs.readFileSync(path.join(__dirname, '../../../client/src/realtime/realtime-client.ts'), 'utf8');
const server = fs.readFileSync(path.join(__dirname, '../lib/socket.ts'), 'utf8');
const routes = fs.readFileSync(path.join(__dirname, '../modules/enterprise/rbac.routes.ts'), 'utf8');

assert.ok(!client.includes('new WebSocket'), 'Client must not reconnect to the nonexistent WebSocket endpoint');
assert.ok(!client.includes('/api/v1/realtime/ws'), 'Dead WebSocket URL must be removed');
assert.match(client, /Authorization: `Bearer \$\{this\.token\}`/, 'SSE stream must authenticate with a Bearer token');
assert.match(client, /Math\.min\(60_000/, 'Reconnect must use capped exponential backoff');
assert.match(routes, /router\.get\('\/stream', requireAuth/, 'SSE server route must require authentication');
assert.match(server, /activeSSEClients\.filter\(\(c\) => c\.userId === data\.userId\)/, 'Targeted events must not leak to unrelated users');
assert.match(server, /id: \$\{eventId\}/, 'SSE frames must include event IDs for reconnect resume markers');

console.log('✅ Authenticated SSE transport contract passed');
