# AEC CampusOS Mobile

This directory contains the new Expo + TypeScript mobile client. It is intentionally separate from `product/client` and does not create or modify a database, backend, admin panel, API route, or business rule.

## Existing API integration

The app consumes the current server contracts:

- `/api/auth/login`, `/api/auth/me`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/logout-all`
- `/api/dashboard/stats`
- `/api/circulars`
- `/api/notifications`
- `/api/workflows/requests`

Configure `EXPO_PUBLIC_API_BASE_URL` using `.env.example`. For an Android emulator, use `http://10.0.2.2:5000/api`; for a physical device, use the development machine's LAN IP.

## Run

```bash
cd product/mobile
npm install
npm start
```

Use `npm run web` when a browser preview is useful. Use Expo Go or a development build for secure storage, biometrics, push notifications, and native capabilities.

## Important integration boundary

The imported server currently exposes REST routes but does not contain a Socket.IO server or a multi-workspace endpoint. The client includes a Socket.IO adapter and listens for the agreed event names, but live events and backend-driven workspace switching remain inactive until the existing backend exposes those capabilities. No duplicate backend routes were added here.