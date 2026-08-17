# 📋 CampusOS — Local Server Hosting Checklist & TODOs

Use this interactive checklist to verify pre-flight setup, initial launch, security validation, and periodic maintenance when hosting CampusOS on your local server.

---

## 🚀 Phase 1: Pre-Flight & Environment Setup

- [ ] **Node.js Installed:** Verified Node.js v20+ (`node -v`).
- [ ] **PostgreSQL Service Running:** Verified PostgreSQL service is active on port `5432` (`netstat -ano | findstr 5432`).
- [ ] **Database Connection Configured:** `product/server/.env` contains valid `DATABASE_URL` string.
- [ ] **Prerequisites Batch Passed:** Executed `01-prerequisites-check.bat` with all checks green.
- [ ] **Static Local IP Assigned:** Server has a reserved/static IPv4 address assigned in Windows Network Settings (e.g. `10.226.116.201`).
- [ ] **Windows Firewall Configured:** Executed `open-firewall-ports.bat` as Administrator to permit inbound traffic on ports 80, 5000, and 5173.

---

## 🏗️ Phase 2: Build & Database Migration

- [ ] **Prisma Client Generated:** Ran `npx prisma generate` in `product/server`.
- [ ] **Database Schema Synchronized:** Ran `02-setup-database.bat` (`prisma db push --accept-data-loss`).
- [ ] **Initial Roles & Seed Data Seeded:** Verified default users exist (`admin@geetorus.com`, `student001.cse@geetorus.com`, `faculty001.cse@geetorus.com`).
- [ ] **Backend Production Build:** Ran `npm run build` in `product/server` (zero TypeScript errors in `dist/server.js`).
- [ ] **Frontend Web Production Build:** Ran `npm run build` in `product/client` (optimized SPA bundle generated in `dist/`).

---

## 🌐 Phase 3: Launch & Connectivity Verification

- [ ] **Servers Started:** Ran `04-start-campusos.bat`.
- [ ] **Local Browser Verification:** Opened `http://localhost:5173` and successfully loaded login page.
- [ ] **LAN PC / Tablet Verification:** Opened `http://<SERVER_LAN_IP>:5173` from a second device on the same Wi-Fi.
- [ ] **Health Endpoint Test:** `curl http://<SERVER_LAN_IP>:5000/api/health` returns `{"status":"ok"}`.
- [ ] **Login & Role Verification:** Logged in as:
  - [ ] **Student:** Checked dashboard, attendance, timetable, fee receipts.
  - [ ] **Faculty:** Checked mentor workspace, attendance marker, leave submission.
  - [ ] **HOD / Admin:** Checked approvals queue, department analytics, circular engine.

---

## 📱 Phase 4: Mobile App & Notification Verification

- [ ] **APK Installed on Real Phone:** Installed `CampusOS-v1.0.2-android8plus-debug.apk` on physical Android phone.
- [ ] **Wi-Fi Subnet Check:** Phone is connected to the same Wi-Fi network as the server.
- [ ] **Mobile Sign-In:** Successfully authenticated via mobile app.
- [ ] **In-App Notification Test:** Tapped "Test Alert" in Notification Center → verified audio chime, haptic vibration, and floating toast banner appear.
- [ ] **Cross-Device Event Sync:** Submitted leave request on mobile → verified it immediately shows in HOD web inbox without manual page reload.

---

## 🛡️ Phase 5: Ongoing Operations & Maintenance

- [ ] **Daily Database Backup:** Run `scripts/backup-db.bat` or configure a Windows Scheduled Task.
- [ ] **Log Rotation Check:** Monitor `product/server/logs/` for error spikes.
- [ ] **Uploads Directory Preservation:** Ensure `product/server/uploads/` is included in regular backup routines.
- [ ] **Graceful Shutdown Routine:** Always use `05-stop-campusos.bat` before shutting down the physical server.

---

## 📝 Ongoing TODOs & Future Enhancements

- [ ] **Local SSL/TLS (HTTPS):** For biometric WebAuthn or camera permissions on some strict mobile browsers, consider generating a local certificate with `mkcert` and binding to Nginx port 443.
- [ ] **Automated Daily Backup Schedule:** Create a Windows Task Scheduler job to run `backup-db.bat` every night at 2:00 AM.
- [ ] **UPS Battery Backup:** Ensure the physical server machine is connected to an Uninterruptible Power Supply (UPS) to prevent database corruption during sudden power cuts.
