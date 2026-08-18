# 🏢 CampusOS — Local Server Hosting Package

This directory contains everything required to publish and host **CampusOS** on a **Local Server**, **On-Premise Institutional Machine**, or **Local Area Network (LAN / Wi-Fi)** for high performance, zero-cloud dependency, and instant cross-platform connectivity across PCs, mobile devices, and tablets.

---

## ⚡ Quickstart — Linux / Ubuntu (1-Command Auto Deploy)

```bash
# Clone the repository onto Ubuntu server
sudo git clone https://github.com/Unkownboy0/AEC.git /opt/campusos
sudo chown -R $USER:$USER /opt/campusos
cd /opt/campusos

# Run the Ubuntu Auto-Installer
sudo bash local-server-hosting/linux-systemd/ubuntu-setup.sh
```
*(For complete Ubuntu step-by-step instructions, see [`UBUNTU_DEPLOYMENT_GUIDE.md`](./UBUNTU_DEPLOYMENT_GUIDE.md))*

---

## ⚡ Quickstart — Windows (3-Step Launch)

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
├── UBUNTU_DEPLOYMENT_GUIDE.md     # Dedicated Ubuntu/Debian deployment manual
├── DEPLOYMENT_GUIDE.md            # In-depth architectural & network configuration manual
├── CHECKLIST_AND_TODOS.md         # Pre-flight, deployment, and maintenance checklist
├── docker-compose.yml             # 1-command Docker stack (PostgreSQL + API + Nginx)
├── ecosystem.config.cjs           # PM2 production process configuration
├── .env.local-server.example      # Pre-configured production environment variables
│
├── linux-systemd/                 # Linux on-premise server deployment
│   ├── ubuntu-setup.sh            # 1-command auto-provisioning for fresh Ubuntu OS
│   ├── deploy-linux.sh            # 1-step automated build & PM2 deployer
│   ├── campusos-backend.service   # Systemd unit file for API server
│   └── campusos-web.service       # Systemd unit file for Web SPA server
│
├── windows-native/                # Windows host automation scripts
│   ├── 01-prerequisites-check.bat # Check Node.js, ports, DB
│   ├── 02-setup-database.bat      # Migrate & seed PostgreSQL database
│   ├── 03-build-production.bat    # Build frontend & backend production bundles
│   ├── 04-start-campusos.bat      # Run production backend & web servers
│   ├── 05-stop-campusos.bat       # Gracefully kill running server processes
│   ├── open-firewall-ports.bat    # Allow ports 80, 5000, 5173 through Windows Firewall
│   ├── find-lan-ip.bat            # Auto-detect your local IPv4 address
│   └── ecosystem.config.cjs       # PM2 Windows process configuration
│
├── nginx/                         # Nginx reverse proxy configuration
│   ├── nginx.conf                 # SPA routing, Gzip, caching, API proxy
│   └── certs/                     # SSL/TLS certificates directory
│
└── scripts/                       # Reusable hosting utilities
    ├── local-web-server.mjs       # Zero-dependency Node.js production static SPA server + API proxy
    ├── backup-db.sh               # Linux automated PostgreSQL backup with retention
    └── backup-db.bat              # Windows 1-click database backup utility
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
