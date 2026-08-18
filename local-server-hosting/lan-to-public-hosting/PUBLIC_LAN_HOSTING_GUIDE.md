# 📖 Comprehensive Guide: Exposing LAN-Only Desktop Server to Public Internet

This guide provides end-to-end instructions for deploying, securing, and publicly hosting **CampusOS** from a **desktop machine with only Ethernet/LAN connectivity**.

---

## 📑 Table of Contents
1. [Network Fundamentals: Why LAN Machines Appear Offline](#1-network-fundamentals-why-lan-machines-appear-offline)
2. [Solution: Cloudflare Zero Trust Tunnel Architecture](#2-solution-cloudflare-zero-trust-tunnel-architecture)
3. [Ubuntu Server / Desktop Deployment](#3-ubuntu-server--desktop-deployment)
4. [Windows Server / Desktop Deployment](#4-windows-server--desktop-deployment)
5. [Setting Up Cloudflare Tunnel (Step-by-Step)](#5-setting-up-cloudflare-tunnel-step-by-step)
6. [Configuring Zero Trust Access Control (Strict User Policies)](#6-configuring-zero-trust-access-control-strict-user-policies)
7. [Preventing Desktop OS from Sleeping / Suspending](#7-preventing-desktop-os-from-sleeping--suspending)
8. [Troubleshooting & Verification](#8-troubleshooting--verification)

---

## 1. Network Fundamentals: Why LAN Machines Appear Offline

A desktop connected via Ethernet cable inside a lab, home, or office receives a **Private IP** (`192.168.x.x` or `10.x.x.x`). 
- Devices outside your local network cannot route packets to a private IP.
- Most internet providers (ISPs) use **CGNAT (Carrier-Grade NAT)** or block inbound ports (such as port 80, 443, 5000).
- Opening router ports directly exposes your desktop's operating system to automated bots and port scanners.

**The Solution:** An **outbound encrypted reverse tunnel** (Cloudflare Tunnel). Your server establishes an encrypted outbound connection to Cloudflare's edge network, allowing users worldwide to access your server via HTTPS while keeping your router firewall completely closed.

---

## 2. Solution: Cloudflare Zero Trust Tunnel Architecture

| Feature | Direct Port Forwarding | Cloudflare Tunnel |
|---|---|---|
| **Inbound Ports Required** | Yes (80, 443, 5000) | ❌ **0 (Zero Ports)** |
| **Works with CGNAT / ISP Blocks** | ❌ No | ✅ **Yes** |
| **SSL/TLS Certificates** | Manual (Certbot) | ✅ **Automatic Free SSL** |
| **DDoS Protection & WAF** | ❌ No | ✅ **Built-in Cloudflare WAF** |
| **Access Control / OTP** | App-level only | ✅ **Edge Zero Trust + App-level** |

---

## 3. Ubuntu Server / Desktop Deployment

### Quick Automated Setup:
```bash
sudo bash local-server-hosting/lan-to-public-hosting/ubuntu/01-setup-lan-public-server.sh
```

### Manual Commands:
```bash
# 1. Update and install packages
sudo apt update && sudo apt install -y curl wget git build-essential ufw postgresql postgresql-contrib

# 2. Install Node.js 20 LTS & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 3. Create Database & User
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE USER campusos WITH ENCRYPTED PASSWORD 'StrongPassword123!';"
sudo -u postgres psql -c "CREATE DATABASE campusos OWNER campusos;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE campusos TO campusos;"

# 4. Install dependencies and build
cd product/server && npm ci && npx prisma generate && npx prisma db push && npm run build
cd ../client && npm ci && npm run build

# 5. Start with PM2
cd ../../local-server-hosting
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd
```

---

## 4. Windows Server / Desktop Deployment

### Quick Automated Setup:
Open PowerShell as **Administrator**:
```powershell
.\local-server-hosting\lan-to-public-hosting\windows\01-setup-lan-public-server.bat
```

### Manual Commands (PowerShell Admin):
```powershell
# 1. Install PM2
npm install -g pm2 pm2-windows-service

# 2. Build Server and Client
Set-Location "product\server"
npm ci
npx prisma generate
npx prisma db push
npm run build

Set-Location "..\client"
npm ci
npm run build

# 3. Start PM2 Services
Set-Location "..\..\local-server-hosting"
pm2 start windows-native\ecosystem.config.cjs
pm2 save
pm2-service-install -n PM2
```

---

## 5. Setting Up Cloudflare Tunnel (Step-by-Step)

### Step 1: Install `cloudflared`
- **Ubuntu:** Run `sudo bash local-server-hosting/lan-to-public-hosting/cloudflare/install-cloudflared-ubuntu.sh`
- **Windows:** Run `local-server-hosting\lan-to-public-hosting\cloudflare\install-cloudflared-windows.bat`

### Step 2: Login & Create Tunnel
```bash
cloudflared tunnel login
cloudflared tunnel create campusos-production
```
This generates a tunnel ID (e.g. `3a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d`) and a JSON credentials file.

### Step 3: Configure Ingress Rules
Copy `local-server-hosting/lan-to-public-hosting/cloudflare/config.example.yml` to `~/.cloudflared/config.yml` (or `C:\Users\<user>\.cloudflared\config.yml` on Windows):

```yaml
tunnel: YOUR_TUNNEL_UUID
credentials-file: /path/to/YOUR_TUNNEL_UUID.json

ingress:
  # 1. API Route -> Express Backend
  - hostname: api.yourinstitution.edu
    service: http://127.0.0.1:5000

  # 2. Web App Route -> Production SPA Web Server
  - hostname: campusos.yourinstitution.edu
    service: http://127.0.0.1:5173

  # 3. Catch-all
  - service: http_status:404
```

### Step 4: Route DNS & Start Service
```bash
cloudflared tunnel route dns campusos-production api.yourinstitution.edu
cloudflared tunnel route dns campusos-production campusos.yourinstitution.edu

# Install and run as a 24/7 background system service
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

---

## 6. Configuring Zero Trust Access Control (Strict User Policies)

To restrict public access so that only verified staff and students can reach the application:

1. Open **[Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)**.
2. Navigate to **Access** → **Applications** → **Add an Application** → **Self-hosted**.
3. Set **Application domain** to `campusos.yourinstitution.edu`.
4. Configure **Policy Rules**:
   - **Action:** `Allow`
   - **Include Rule:** `Emails ending in: @yourcollege.edu`
   - *(Optional)* **IP Ranges:** Allow designated static campus IPs or IP subnets.
5. Save Application.

Users browsing `https://campusos.yourinstitution.edu` will now see a secure login gate requiring a one-time authentication code sent to their registered college email before receiving access to the site!

---

## 7. Preventing Desktop OS from Sleeping / Suspending

Because desktop operating systems default to entering sleep mode after inactivity:

### Ubuntu:
```bash
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```
*(Or run `local-server-hosting/lan-to-public-hosting/ubuntu/prevent-sleep.sh`)*

### Windows:
```cmd
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 15
powercfg /change hibernate-timeout-ac 0
```
*(Or run `local-server-hosting\lan-to-public-hosting\windows\prevent-sleep.bat`)*

---

## 8. Troubleshooting & Verification

| Check | Command | Expected Result |
|---|---|---|
| **Backend API Health** | `curl -I http://127.0.0.1:5000/api/health` | HTTP 200 OK |
| **Frontend Web Server** | `curl -I http://127.0.0.1:5173` | HTTP 200 OK |
| **PM2 Process Status** | `pm2 status` | Status `online` |
| **Cloudflare Tunnel Status** | `cloudflared tunnel info campusos-production` | Status `HEALTHY` (Conns: 4/4) |
| **Public HTTPS Test** | `curl -I https://api.yourinstitution.edu/api/health` | HTTP 200 OK via Cloudflare SSL |
