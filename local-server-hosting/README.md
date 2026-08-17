# 🏢 CampusOS — Local Server Hosting Package

This directory contains everything required to publish and host **CampusOS** on a **Local Server**, **On-Premise Institutional Machine**, or **Local Area Network (LAN / Wi-Fi)** for high performance, zero-cloud dependency, and instant cross-platform connectivity across PCs, mobile devices, and tablets.

---

## ⚡ Quickstart — 3-Step Launch (Windows)

Navigate to the `windows-native/` folder and run the numbered batch scripts in order:

```text
1. 01-prerequisites-check.bat  ──► Verifies Node.js, Postgres & free ports (5000 & 5173)
2. 02-setup-database.bat        ──► Generates Prisma client, syncs schema & seeds initial accounts
3. 03-build-production.bat      ──► Compiles TypeScript server and builds optimized Vite SPA bundle
4. 04-start-campusos.bat        ──► Launches the production backend & local web server
```

Once running:
- **Local Access:** `http://localhost:5173`
- **LAN / Wi-Fi Access:** `http://<SERVER_LAN_IP>:5173`
- **Mobile App API:** `http://<SERVER_LAN_IP>:5000/api`

---

## 📂 Directory Structure

```text
local-server-hosting/
├── README.md                      # Master overview & quick start
├── DEPLOYMENT_GUIDE.md            # In-depth architectural & network configuration manual
├── CHECKLIST_AND_TODOS.md         # Pre-flight, deployment, and maintenance checklist
├── docker-compose.yml             # 1-command Docker stack (PostgreSQL + API + Nginx)
├── .env.local-server.example      # Pre-configured production environment variables
│
├── windows-native/                # Windows host automation scripts
│   ├── 01-prerequisites-check.bat # Check Node.js, ports, DB
│   ├── 02-setup-database.bat      # Migrate & seed PostgreSQL database
│   ├── 03-build-production.bat    # Build frontend & backend production bundles
│   ├── 04-start-campusos.bat      # Run production backend & web servers
│   ├── 05-stop-campusos.bat       # Gracefully kill running server processes
│   ├── open-firewall-ports.bat    # Allow ports 80, 5000, 5173 through Windows Firewall
│   ├── find-lan-ip.bat            # Auto-detect your local IPv4 address
│   └── ecosystem.config.cjs       # PM2 production process configuration
│
├── nginx/                         # Nginx reverse proxy configuration
│   ├── nginx.conf                 # SPA routing, Gzip, caching, API proxy
│   └── certs/                     # SSL/TLS certificates directory
│
├── linux-systemd/                 # Linux on-premise server deployment
│   ├── campusos-backend.service   # Systemd unit file for API server
│   └── deploy-linux.sh            # 1-step automated bash deployment script
│
└── scripts/                       # Reusable hosting utilities
    ├── local-web-server.mjs       # Zero-dependency Node.js production static SPA server + API proxy
    └── backup-db.bat              # 1-click database backup utility
```

---

## 🔑 Default Production Seed Accounts

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@geetorus.com` | `Campus@123` |
| **Principal** | `principal@geetorus.com` | `Campus@123` |
| **Vice Principal** | `vp@geetorus.com` | `Campus@123` |
| **HOD (CSE)** | `hod.cse@geetorus.com` | `Campus@123` |
| **Faculty / Mentor** | `faculty001.cse@geetorus.com` | `Campus@123` |
| **Student** | `student001.cse@geetorus.com` | `Campus@123` |
| **Controller of Exams** | `coe@geetorus.com` | `Campus@123` |
| **Accountant / AO** | `accountant@geetorus.com` | `Campus@123` |
| **Hostel Warden** | `warden.boys@geetorus.com` | `Campus@123` |
| **Transport Manager** | `transport@geetorus.com` | `Campus@123` |

---

## 🛠️ Docker Deployment (Alternative)

If your local server has Docker installed:

```bash
cd local-server-hosting
docker compose up -d --build
```

This will spin up PostgreSQL, API Server, and Nginx Web server with persistent volumes and health checks in under 60 seconds.
