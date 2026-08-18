# 🐧 CampusOS — Complete Ubuntu Deployment & Hosting Guide

This guide contains **all commands, configurations, scripts, and production practices** to deploy and run **CampusOS** on **Ubuntu Linux (20.04 / 22.04 / 24.04 LTS)** on a dedicated local server, VM, or institutional intranet.

---

## 📑 Table of Contents
1. [Quick 1-Command Automated Installation](#1-quick-1-command-automated-installation)
2. [Manual Step-by-Step Installation](#2-manual-step-by-step-installation)
3. [PostgreSQL Database Setup on Ubuntu](#3-postgresql-database-setup-on-ubuntu)
4. [Environment Configuration (.env)](#4-environment-configuration-env)
5. [Building Frontend & Backend](#5-building-frontend--backend)
6. [Hosting Option A: PM2 Process Manager (Recommended)](#6-hosting-option-a-pm2-process-manager-recommended)
7. [Hosting Option B: Nginx Reverse Proxy (Port 80/443 & SSL)](#7-hosting-option-b-nginx-reverse-proxy-port-80443--ssl)
8. [Hosting Option C: Ubuntu Systemd Services](#8-hosting-option-c-ubuntu-systemd-services)
9. [Hosting Option D: Docker Compose on Ubuntu](#9-hosting-option-d-docker-compose-on-ubuntu)
10. [Ubuntu Firewall (UFW) Configuration](#10-ubuntu-firewall-ufw-configuration)
11. [Automated Nightly Backups (Cron + pg_dump)](#11-automated-nightly-backups-cron--pg_dump)
12. [Troubleshooting & Handy Ubuntu Commands](#12-troubleshooting--handy-ubuntu-commands)

---

## 1. Quick 1-Command Automated Installation

If you are setting up a fresh Ubuntu machine, you can run the all-in-one setup script:

```bash
# Clone the repository (if not already done)
sudo git clone https://github.com/Unkownboy0/AEC.git /opt/campusos
sudo chown -R $USER:$USER /opt/campusos
cd /opt/campusos

# Run the Ubuntu Auto-Installer
sudo bash local-server-hosting/linux-systemd/ubuntu-setup.sh
```

This script will automatically:
- Install Node.js 20 LTS, npm, PostgreSQL 16, Git, UFW, Nginx, and PM2.
- Create PostgreSQL database `campusos` and user `campusos`.
- Configure firewall rules (`80`, `443`, `5000`, `5173`).
- Install all npm dependencies, run Prisma migrations, and seed initial accounts.
- Build production bundles for client and server.
- Start backend and frontend services under PM2 and configure auto-start on boot.

---

## 2. Manual Step-by-Step Installation

### Step 1: Install System Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw nginx postgresql postgresql-contrib

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v   # Should be v20.x or v22.x
npm -v    # Should be 10.x+

# Install PM2 globally
sudo npm install -g pm2
```

---

## 3. PostgreSQL Database Setup on Ubuntu

```bash
# Start and enable PostgreSQL service
sudo systemctl enable --now postgresql

# Switch to postgres user and create database & user
sudo -u postgres psql <<EOF
CREATE USER campusos WITH ENCRYPTED PASSWORD 'campusos_secure_password';
CREATE DATABASE campusos OWNER campusos;
GRANT ALL PRIVILEGES ON DATABASE campusos TO campusos;
\q
EOF
```

---

## 4. Environment Configuration (.env)

Navigate to the server directory and configure `.env`:

```bash
cd /opt/campusos/product/server
cp ../../local-server-hosting/.env.local-server.example .env
```

Ensure your `.env` contains:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://campusos:campusos_secure_password@127.0.0.1:5432/campusos?schema=public"
JWT_SECRET="campusos_super_secure_production_secret_key_minimum_32_chars"
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN=30d
ALLOWED_ORIGINS="*"
STORAGE_ROOT="/opt/campusos/product/server/uploads"
BACKUP_ROOT="/opt/campusos/product/server/backups"
```

Create necessary directories:
```bash
mkdir -p /opt/campusos/product/server/uploads
mkdir -p /opt/campusos/product/server/backups
mkdir -p /opt/campusos/product/server/logs
```

---

## 5. Building Frontend & Backend

```bash
# 1. Install dependencies
cd /opt/campusos/product/server
npm ci

cd /opt/campusos/product/client
npm ci

# 2. Sync Database Schema & Seed Data
cd /opt/campusos/product/server
npx prisma generate
npx prisma db push --accept-data-loss
npm run seed

# 3. Build Production Artifacts
npm run build

cd /opt/campusos/product/client
npm run build
```

---

## 6. Hosting Option A: PM2 Process Manager (Recommended)

PM2 provides auto-restart, cluster mode, live logging, and auto-start on server reboot.

### Start the application with PM2:
```bash
cd /opt/campusos/local-server-hosting
pm2 start ecosystem.config.cjs
pm2 save
```

### Enable PM2 to auto-start when Ubuntu boots:
```bash
pm2 startup systemd
# Copy-paste and run the command printed in the terminal (starts with 'sudo env PATH...')
pm2 save
```

### Managing PM2 Services:
```bash
pm2 status                  # Check process status
pm2 logs                    # View combined real-time logs
pm2 logs campusos-backend   # View backend logs only
pm2 restart all             # Restart both frontend & backend
pm2 stop all                # Stop all services
```

---

## 7. Hosting Option B: Nginx Reverse Proxy (Port 80/443 & SSL)

If you want users to access CampusOS directly on standard **Port 80 (HTTP)** or **Port 443 (HTTPS / SSL)** without specifying port numbers:

### Step 1: Copy Nginx Configuration
```bash
sudo cp /opt/campusos/local-server-hosting/nginx/nginx.conf /etc/nginx/sites-available/campusos.conf
sudo ln -sf /etc/nginx/sites-available/campusos.conf /etc/nginx/sites-enabled/campusos.conf
sudo rm -f /etc/nginx/sites-enabled/default
```

### Step 2: Test & Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3 (Optional): Enable SSL/HTTPS with Let's Encrypt Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d campusos.yourinstitution.edu
```

---

## 8. Hosting Option C: Ubuntu Systemd Services

If you prefer native Linux `systemd` unit services instead of PM2:

### Step 1: Install Systemd Service Files
```bash
sudo cp /opt/campusos/local-server-hosting/linux-systemd/campusos-backend.service /etc/systemd/system/
sudo cp /opt/campusos/local-server-hosting/linux-systemd/campusos-web.service /etc/systemd/system/
```

### Step 2: Update User in Service Files (if your user is not `campusos`):
```bash
sudo sed -i "s/User=campusos/User=$USER/g" /etc/systemd/system/campusos-backend.service
sudo sed -i "s/User=campusos/User=$USER/g" /etc/systemd/system/campusos-web.service
```

### Step 3: Enable and Start
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now campusos-backend
sudo systemctl enable --now campusos-web
```

### Step 4: Manage Systemd Services
```bash
sudo systemctl status campusos-backend
sudo systemctl status campusos-web
journalctl -u campusos-backend -f    # Tail backend service logs
```

---

## 9. Hosting Option D: Docker Compose on Ubuntu

If Docker is preferred:

```bash
# Install Docker & Docker Compose Plugin
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
newgrp docker

# Launch Stack
cd /opt/campusos/local-server-hosting
docker compose up -d --build

# View logs
docker compose logs -f
```

---

## 10. Ubuntu Firewall (UFW) Configuration

Allow the necessary ports on Ubuntu:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp       # HTTP (Nginx)
sudo ufw allow 443/tcp      # HTTPS / SSL
sudo ufw allow 5000/tcp     # Backend API
sudo ufw allow 5173/tcp     # Frontend Web Server
sudo ufw enable
sudo ufw status verbose
```

---

## 11. Automated Nightly Backups (Cron + pg_dump)

Make the backup script executable:
```bash
chmod +x /opt/campusos/local-server-hosting/scripts/backup-db.sh
```

### Add a Daily Cron Job at 2:00 AM:
```bash
crontab -e
```
Add the following line at the bottom:
```cron
0 2 * * * /opt/campusos/local-server-hosting/scripts/backup-db.sh >> /opt/campusos/product/server/logs/backup.log 2>&1
```

To run a manual instant backup at any time:
```bash
/opt/campusos/local-server-hosting/scripts/backup-db.sh
```

---

## 12. Troubleshooting & Handy Ubuntu Commands

| Task | Ubuntu Command |
|---|---|
| **Find Server LAN IP** | `hostname -I \| awk '{print $1}'` |
| **Check Port 5000 usage** | `sudo lsof -i :5000` or `sudo ss -tulpn \| grep 5000` |
| **Check Port 5173 usage** | `sudo lsof -i :5173` or `sudo ss -tulpn \| grep 5173` |
| **Kill process on port** | `sudo fuser -k 5000/tcp` |
| **Check Postgres status** | `sudo systemctl status postgresql` |
| **Test Backend API locally** | `curl -I http://127.0.0.1:5000/api/health` |
| **Test Frontend locally** | `curl -I http://127.0.0.1:5173` |
| **View Backend PM2 logs** | `pm2 logs campusos-backend` |
| **Restart Everything** | `pm2 restart all` |

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
