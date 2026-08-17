# 📖 CampusOS — Complete Local Server Deployment Guide

This guide provides exhaustive, end-to-end instructions for deploying, configuring, securing, and maintaining **CampusOS** on a local dedicated server or institutional intranet.

---

## 📑 Table of Contents
1. [System Requirements](#1-system-requirements)
2. [Network Architecture & Port Topology](#2-network-architecture--port-topology)
3. [Windows Native Deployment](#3-windows-native-deployment)
4. [Linux (Ubuntu/Debian) Deployment](#4-linux-ubuntudebian-deployment)
5. [Docker Compose Deployment](#5-docker-compose-deployment)
6. [Windows Defender Firewall Setup](#6-windows-defender-firewall-setup)
7. [LAN IP & Static IP Configuration](#7-lan-ip--static-ip-configuration)
8. [Connecting Mobile App & Web Clients](#8-connecting-mobile-app--web-clients)
9. [Database Backup & Disaster Recovery](#9-database-backup--disaster-recovery)
10. [Troubleshooting & Common Issues](#10-troubleshooting--common-issues)

---

## 1. System Requirements

### Hardware Recommendations
- **CPU:** Dual Core 2.0 GHz+ (Quad Core recommended for >500 concurrent students)
- **RAM:** Minimum 4 GB RAM (8 GB+ recommended)
- **Storage:** 20 GB free SSD storage (for database, uploads, and automated backups)
- **Network:** 1 Gbps Ethernet or high-speed Wi-Fi Access Point on local subnet

### Software Prerequisites
- **Node.js:** v20.x or v22.x LTS ([Download Node.js](https://nodejs.org))
- **PostgreSQL:** v15.x or v16.x ([Download PostgreSQL](https://www.postgresql.org/download/))
- **OS:** Windows 10/11, Windows Server 2019/2022, or Ubuntu 22.04/24.04 LTS

---

## 2. Network Architecture & Port Topology

```
                  ┌──────────────────────────────────────────────────┐
                  │            CAMPUS WI-FI / LOCAL LAN              │
                  └────────┬─────────────────────────┬───────────────┘
                           │                         │
                  ┌────────▼────────┐       ┌────────▼────────┐
                  │ Student/Staff   │       │ Mobile Android  │
                  │ Web Browser     │       │ / iOS Devices   │
                  └────────┬────────┘       └────────┬────────┘
                           │ HTTP (:5173 / :80)      │ API (:5000)
                           │                         │
         ┌─────────────────▼─────────────────────────▼─────────────────┐
         │                  CAMPUSOS LOCAL HOST MACHINE                │
         │                                                             │
         │   ┌────────────────────────┐      ┌─────────────────────┐   │
         │   │   SPA Web Server       │◄────►│  Express API Server │   │
         │   │   (local-web-server)   │      │  (Port 5000)        │   │
         │   │   Port 5173 / 80       │      │  dist/server.js     │   │
         │   └────────────────────────┘      └──────────┬──────────┘   │
         │                                              │              │
         │                                              ▼              │
         │                                   ┌─────────────────────┐   │
         │                                   │ PostgreSQL Database │   │
         │                                   │ (Port 5432)         │   │
         │                                   └─────────────────────┘   │
         └─────────────────────────────────────────────────────────────┘
```

### Port Allocation Table
| Port | Protocol | Purpose | Access Scope |
|---|---|---|---|
| **5000** | TCP | Express REST API, FCM Push dispatch & WebSockets | LAN & Localhost |
| **5173** (or **80**) | TCP | Frontend Web Application & Static Assets | LAN & Localhost |
| **5432** | TCP | PostgreSQL Database Engine | Localhost only (`127.0.0.1`) |

---

## 3. Windows Native Deployment

### Step 1: Install & Verify Dependencies
Run `windows-native/01-prerequisites-check.bat` to verify that Node.js, npm, and required ports are clear.

### Step 2: Configure Environment Variables
1. Verify `product/server/.env` exists.
2. If creating a fresh install, copy `local-server-hosting/.env.local-server.example` to `product/server/.env`:
   ```powershell
   Copy-Item local-server-hosting\.env.local-server.example product\server\.env
   ```
3. Update `DATABASE_URL` with your PostgreSQL username and password.

### Step 3: Initialize Database Schema
Run `windows-native/02-setup-database.bat`.
This will:
1. Generate Prisma ORM client bindings.
2. Synchronize database tables, indexes, and relations (`prisma db push`).
3. Seed institutional accounts (Super Admin, Principal, HODs, Faculty, Students).

### Step 4: Build Production Artifacts
Run `windows-native/03-build-production.bat`.
This compiles TypeScript to clean JavaScript in `product/server/dist` and packages the Vite frontend into `product/client/dist`.

### Step 5: Start the Servers
Run `windows-native/04-start-campusos.bat`.
This launches:
- **Backend:** `node product/server/dist/server.js` (Listening on `0.0.0.0:5000`)
- **Frontend & Proxy:** `node local-server-hosting/scripts/local-web-server.mjs` (Listening on `0.0.0.0:5173`)

### Step 6: Enable Windows Service Auto-Start (Optional with PM2)
If you want CampusOS to run automatically on Windows boot:
```powershell
npm install -g pm2 pm2-windows-service
cd local-server-hosting\windows-native
pm2 start ecosystem.config.cjs
pm2 save
```

---

## 4. Linux (Ubuntu/Debian) Deployment

1. **Clone repository onto server:**
   ```bash
   sudo mkdir -p /opt/campusos && sudo chown -R $USER:$USER /opt/campusos
   git clone https://github.com/Unkownboy0/AEC.git /opt/campusos
   cd /opt/campusos
   ```
2. **Run the 1-Step Deployer:**
   ```bash
   chmod +x local-server-hosting/linux-systemd/deploy-linux.sh
   ./local-server-hosting/linux-systemd/deploy-linux.sh
   ```
3. **Enable Systemd Service (Optional):**
   ```bash
   sudo cp local-server-hosting/linux-systemd/campusos-backend.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now campusos-backend
   ```

---

## 5. Docker Compose Deployment

If you prefer completely isolated containerized deployment:

```bash
cd local-server-hosting
docker compose up -d --build
```

To view live container logs:
```bash
docker compose logs -f
```

To stop containers:
```bash
docker compose down
```

---

## 6. Windows Defender Firewall Setup

By default, Windows blocks incoming connections from other devices on the Wi-Fi network.

**Run as Administrator:**
```powershell
local-server-hosting\windows-native\open-firewall-ports.bat
```

Or manually execute in PowerShell (Admin):
```powershell
New-NetFirewallRule -DisplayName "CampusOS Backend (5000)" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "CampusOS Web Client (5173)" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "CampusOS HTTP (80)" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
```

---

## 7. LAN IP & Static IP Configuration

To prevent the server's IP address from changing when the Wi-Fi router reboots:

1. Open **Windows Settings** → **Network & Internet** → **Properties** (of your Wi-Fi or Ethernet adapter).
2. Edit **IP assignment** from `Automatic (DHCP)` to `Manual`.
3. Set a static IPv4 address (e.g. `10.226.116.201` or `192.168.1.100`), Subnet `255.255.255.0`, and Gateway (your router IP).
4. Run `local-server-hosting\windows-native\find-lan-ip.bat` at any time to verify the server IP.

---

## 8. Connecting Mobile App & Web Clients

### Web Clients (Laptops, PCs, Tablets):
Open any browser and navigate to:
```text
http://<SERVER_LAN_IP>:5173
```
*(Example: `http://10.226.116.201:5173`)*

### Mobile App (Android APK):
The pre-compiled APK connects directly to `http://<SERVER_LAN_IP>:5000/api`.
Ensure your phone is connected to the **same Wi-Fi router / subnet**.

---

## 9. Database Backup & Disaster Recovery

### Automatic Backups
To create an instant snapshot:
```powershell
local-server-hosting\scripts\backup-db.bat
```
Backups are saved as compressed SQL dumps inside `product/server/backups/`.

### Restoring a Backup
```powershell
psql -U postgres -d campusos < product\server\backups\campusos_backup_YYYYMMDD.sql
```

---

## 10. Troubleshooting & Common Issues

| Issue | Cause | Solution |
|---|---|---|
| **Phone shows "Network Error"** | Windows Firewall blocking port 5000 | Run `open-firewall-ports.bat` as Administrator. |
| **Phone cannot open web page** | Phone and PC on different Wi-Fi networks | Verify phone and server are on the same Wi-Fi subnet (e.g. `10.226.116.*`). |
| **Port 5000 already in use** | An old server process is still running | Run `05-stop-campusos.bat` to terminate old processes. |
| **"Database connection failed"** | PostgreSQL service stopped or invalid password in `.env` | Open Windows Services (`services.msc`), ensure `postgresql-x64-16` is Running, and verify `DATABASE_URL` in `product/server/.env`. |
