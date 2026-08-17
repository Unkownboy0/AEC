# 🏛️ CampusOS — Production Local Server Hosting Master Manual

This master manual covers the complete architecture, configuration, hardening, and automated operations required to run **CampusOS in true Production mode on a local server** (Dedicated PC, Institution Lab Host, Windows Server, or On-Premise Intranet Machine).

---

## 🌟 Why Production Local Hosting is Different from Development

| Feature | Development Mode (`npm run dev`) | Production Local Server Hosting (`dist/`) |
|---|---|---|
| **URL** | `http://localhost:5173` *(requires port)* | `http://campusos.local` or `http://<LAN_IP>` *(standard Port 80/443)* |
| **Processes** | Two open command prompt windows | **Silent Windows Background Service** |
| **Server Reboots** | Manually re-open terminals | **Auto-boots on physical server power-on** |
| **Crash Recovery** | Server stays down | **Instant automatic restart via PM2 watchdog** |
| **Performance** | JIT compilation & hot-reloading overhead | **Pre-compiled, minified, gzip-cached static SPA** |
| **Database Pool** | Single connection | **50-connection pool with query timeouts** |
| **Backups** | Manual | **Automated 2:00 AM daily scheduled snapshots** |
| **Camera & Biometrics** | May be blocked on non-localhost HTTP | **Trusted Local SSL (HTTPS) support** |

---

## 🚀 5-Step Production Local Server Deployment

Open the directory [`local-server-hosting\production-setup\`](file:///d:/local/crm/local-server-hosting/production-setup/) and execute the following numbered scripts in order:

### 1️⃣ Step 1: Configure Production Environment
- **Run:** [`01-configure-production-env.bat`](file:///d:/local/crm/local-server-hosting/production-setup/01-configure-production-env.bat)
- **What it does:**
  - Derives a cryptographically strong 32-byte production `JWT_SECRET`.
  - Sets `NODE_ENV=production`.
  - Configures PostgreSQL connection pooling (`connection_limit=50`).
  - Sets up persistent storage folders (`uploads/`, `backups/`, `logs/`).

---

### 2️⃣ Step 2: Build Production Artifacts
- **Run:** [`..\windows-native\03-build-production.bat`](file:///d:/local/crm/local-server-hosting/windows-native/03-build-production.bat)
- **What it does:**
  - Compiles backend TypeScript to high-speed CommonJS in `product/server/dist/`.
  - Builds the minified, code-split React SPA in `product/client/dist/`.

---

### 3️⃣ Step 3: Install Automatic Windows Background Service
- **Run (as Administrator):** [`02-install-windows-service.bat`](file:///d:/local/crm/local-server-hosting/production-setup/02-install-windows-service.bat)
- **What it does:**
  - Installs the PM2 production process supervisor.
  - Launches the API backend in cluster mode and the Web server on Port 5173 / Port 80.
  - Registers `pm2-startup` in the Windows registry so CampusOS starts automatically when the server boots.

---

### 4️⃣ Step 4: Map Local Domain Name (`campusos.local`)
- **Run (as Administrator):** [`04-setup-local-domain.bat`](file:///d:/local/crm/local-server-hosting/production-setup/04-setup-local-domain.bat)
- **What it does:**
  - Binds `campusos.local` and `aec.local` in Windows `drivers/etc/hosts`.
  - Enables mDNS multicast resolution so local devices resolve the server domain.

---

### 5️⃣ Step 5: Schedule Daily 2:00 AM Backups
- **Run (as Administrator):** [`05-setup-nightly-backup-task.bat`](file:///d:/local/crm/local-server-hosting/production-setup/05-setup-nightly-backup-task.bat)
- **What it does:**
  - Creates a Windows Task Scheduler job that dumps the PostgreSQL database every night at 2:00 AM to `product/server/backups/`.

---

## 🔒 Enabling Local HTTPS / SSL (Optional but Recommended)

For full mobile browser support of Camera (QR scanner) and WebAuthn Biometrics over the local Wi-Fi:

1. Right-click [`03-setup-local-https-ssl.bat`](file:///d:/local/crm/local-server-hosting/production-setup/03-setup-local-https-ssl.bat) and **Run as administrator**.
2. This generates RSA certificates in `local-server-hosting/nginx/certs/cert.pem`.
3. Start the production server via `node local-server-hosting/production-setup/production-web-server-port80.mjs` — it will automatically bind HTTPS on Port 443!

---

## 📊 Live Monitoring & Production Management Commands

Open PowerShell or Command Prompt on the server machine:

```powershell
# View live status of all services
pm2 status

# Stream live production logs in real time
pm2 logs

# Restart all services after code updates
pm2 restart all

# Stop all background services
pm2 stop all

# Monitor CPU, Memory, and Event Loop latency
pm2 monit
```

---

## 🌐 Connecting from Campus Devices

- **Web Browser (PCs / Laptops):**  
  `http://campusos.local`  *(or `http://<SERVER_LAN_IP>`)*
- **Android Mobile App:**  
  Launch installed APK — connects automatically to backend API at `http://<SERVER_LAN_IP>:5000/api`.

---

## 🛡️ Router Port Forwarding for External / Internet Access (Optional)

If the institution wants teachers or students to access CampusOS outside campus (from home):

1. Open your Internet router's admin panel (e.g. `192.168.1.1`).
2. Go to **Port Forwarding / Virtual Server**.
3. Forward **External Port 80** and **External Port 443** to your server's local IP (e.g. `10.226.116.201`).
4. Point your college domain (e.g. `portal.yourcollege.edu`) to your public static IP.
