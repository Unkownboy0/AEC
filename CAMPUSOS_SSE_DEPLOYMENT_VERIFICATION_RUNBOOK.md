# CampusOS SSE Deployment Verification Runbook

1. Use the production-like HTTPS hostname behind the actual Nginx and, if applicable, Cloudflare/reverse proxy. Do not test direct Node only.
2. Confirm TLS validity and HTTP/1.1 streaming support. For `/api/rbac/stream`, keep proxy buffering/cache/compression off, `Connection` empty, `X-Accel-Buffering: no`, `Cache-Control: no-cache, no-transform`, and read/send timeouts above one hour.
3. If Cloudflare is used, bypass cache and transformations for the SSE path; confirm plan timeout behavior and no Worker buffers the stream.
4. Authenticate User A and unrelated User B in separate clean browser profiles. Record user IDs, active workspaces, request IDs, and start time without exposing tokens.
5. Open DevTools Network for both streams. Require HTTP 200, `text/event-stream`, no redirect/login HTML, and periodic bytes/heartbeats.
6. Trigger a uniquely identified event targeted only to User A. Record server audit/event ID. Require A receives it once and B receives nothing for at least two heartbeat periods.
7. Keep both streams open beyond 90 seconds (recommended 5 minutes). Record timestamps/bytes proving no buffering or premature close.
8. Disconnect A's network, restore it, and require automatic reconnect. Verify the client sends the last event ID and the server neither loses nor duplicates the targeted event according to policy.
9. Repeat through application restart/cold browser navigation and workspace switching; authentication and workspace isolation must remain correct.
10. While SSE is connected, send an FCM-capable notification. Require in-app SSE delivery and background FCM coexist without duplicate user-visible notifications.
11. Capture Nginx access/error logs, upstream logs, browser HAR with secrets removed, both-screen recording, event/audit IDs, reconnect headers, and the >90-second timeline.

Do not mark SSE runtime verified until this procedure passes against the deployed HTTPS proxy with two real authenticated sessions.
