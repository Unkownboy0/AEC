# GEETORUS CAMPUSOS

## Project overview

This repository contains the existing GEETORUS CAMPUSOS enterprise web ERP and Express/Prisma API under `product/client` and `product/server`. A separate Expo + TypeScript mobile client now lives under `product/mobile`.

The mobile app is an additional client of the existing REST API. It must not create a second database, backend, admin panel, API family, authentication system, or business-logic implementation.

## Run locations

- Website: `cd product/client && npm install && npm run dev`
- Existing API: `cd product/server && npm install && npm run dev`
- Mobile: `cd product/mobile && npm install && npm start`

Set `EXPO_PUBLIC_API_BASE_URL` from `product/mobile/.env.example` when the API is not reachable at the local default. The mobile app uses the existing `/api/auth`, `/api/dashboard`, `/api/circulars`, `/api/notifications`, and `/api/workflows` contracts.

## User preferences

- Preserve the existing website, backend, database, authentication, RBAC, and business logic.
- Prefer consuming existing APIs over introducing parallel routes or duplicated data models.
- Do not use dummy records or placeholder users for product behavior.