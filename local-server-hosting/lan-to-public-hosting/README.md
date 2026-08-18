# 🌍 CampusOS — LAN-to-Public Hosting Package (Zero Open Router Ports)

This package contains all automation scripts, configuration templates, and instructions to securely expose a **LAN-only Desktop Server (No Wi-Fi / Behind NAT Router / CGNAT)** to the public internet with **Zero Trust Access Control**, **Free Automatic SSL/TLS**, and **Zero Opened Router Ports**.

---

## ⚡ Quickstart

### 🐧 On Ubuntu Server / Desktop:
```bash
# 1. Run the all-in-one setup script (installs cloudflared, sets up DB, builds, and starts PM2)
sudo bash local-server-hosting/lan-to-public-hosting/ubuntu/01-setup-lan-public-server.sh

# 2. Prevent Ubuntu from going to sleep while hosting
sudo bash local-server-hosting/lan-to-public-hosting/ubuntu/prevent-sleep.sh
```

---

### 🪟 On Windows Server / Desktop:
```cmd
:: 1. Run the all-in-one Windows setup script (As Administrator)
local-server-hosting\lan-to-public-hosting\windows\01-setup-lan-public-server.bat

:: 2. Prevent Windows from sleeping / suspending Ethernet
local-server-hosting\lan-to-public-hosting\windows\prevent-sleep.bat
```

---

## 📂 Package Directory Structure

```text
local-server-hosting/lan-to-public-hosting/
├── README.md                               # This overview
├── PUBLIC_LAN_HOSTING_GUIDE.md             # Complete step-by-step master manual
│
├── cloudflare/                             # Cloudflare Zero Trust Tunnel
│   ├── config.example.yml                  # Ingress routing template (API + Web + SSL)
│   ├── install-cloudflared-ubuntu.sh       # Ubuntu cloudflared installer & systemd service
│   └── install-cloudflared-windows.bat     # Windows cloudflared installer & service
│
├── ubuntu/                                 # Ubuntu Automation Scripts
│   ├── 01-setup-lan-public-server.sh       # 1-Click complete installation & deployment
│   ├── 02-start-services.sh                # Start/reload PM2 & tunnel services
│   └── prevent-sleep.sh                    # Disable sleep & hibernate on desktop
│
├── windows/                                # Windows Automation Scripts
│   ├── 01-setup-lan-public-server.bat      # 1-Click complete Windows deployment
│   ├── 02-start-services.bat               # Start PM2 & cloudflared Windows service
│   └── prevent-sleep.bat                   # Set High Performance power plan
│
└── nginx/                                  # Reverse Proxy & Security Hardening
    └── nginx-secure-public.conf            # Rate limiting, HSTS, CORS & proxy headers
```

---

## 🛡️ Security Architecture

```
   [Public Users / Mobile Devices]
                 │  (HTTPS Port 443)
                 ▼
   [Cloudflare Edge / Zero Trust Gate]
     ├─ Free SSL / TLS Certificate
     ├─ DDoS Mitigation & WAF
     ├─ Email OTP / Google SSO Authentication
                 │  (Encrypted Outbound Tunnel)
                 ▼
   [Your LAN-Only Desktop Machine]
     ├─ cloudflared Tunnel Daemon
     ├─ Localhost Proxy (127.0.0.1:5000 / 127.0.0.1:5173)
     └─ PostgreSQL (127.0.0.1:5432)
```

- **Router Ports Opened:** `0` (Zero inbound ports required)
- **Works behind:** NAT, Institutional Firewalls, CGNAT, Dynamic IPs
- **Accessible from:** Any 4G/5G mobile network, home Wi-Fi, or public internet worldwide.
