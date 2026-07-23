# GEETORUS CAMPUSOS - Enterprise Foundation

This directory houses the Core Enterprise Architecture Foundation of **GEETORUS CAMPUSOS**, a commercial Multi-Tenant College Management System.

---

## Directory Mappings

```bash
/product
  ├── client/        # Vite + React 19 Frontend Web Client
  ├── server/        # Express + Node.js + Prisma Backend API Engine
  ├── docs/          # Technical and Architecture Guides
  └── README.md      # Workspace Documentation
```

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org) (v18.x or above recommended)
- NPM or PNPM

### 1. Backend Server Configuration
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. The environmental configuration is initialized in `.env`.
3. Install packages and generate the Prisma client bindings:
   ```bash
   npm install
   ```
4. Run migrations to initialize the database and trigger seed items:
   ```bash
   npx prisma migrate dev
   ```
5. Launch the Express server in watch mode:
   ```bash
   npm run dev
   ```
   The engine will boot on port `5000`.

### 2. Frontend Client Configuration
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Launch the Vite server:
   ```bash
   npm run dev
   ```
   The web page will boot on `http://localhost:5173`.

---

## Foundation Design Features

- **Multi-Tenant Architecture**: Schema contains Tenant scopes supporting isolated domain parameters.
- **Enterprise RBAC**: Role-based access keys mapping implicit permissions directly into JWT signatures.
- **Unified Design Tokens**: Color systems (dark/light togglers) mapped using Tailwind variables.
- **Shared Components Library**: Responsive collapsible layouts, portal modals, debounced searches, active filtering, uploader nodes, and date-pickers.
