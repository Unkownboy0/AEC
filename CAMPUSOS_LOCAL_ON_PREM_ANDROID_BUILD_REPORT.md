# CampusOS Local On-Prem Android Build Report

Date: 2026-08-19 (Asia/Calcutta)

## Outcome

- LOCAL ON-PREMISES BUILD: **BUILD VERIFIED**
- LAN API: **RUNTIME VERIFIED on the host; remote-device path BLOCKED**
- ANDROID INSTALL: **PHYSICAL DEVICE VERIFIED**
- LOCAL CORE CAMPUSOS: **PHYSICAL DEVICE BLOCKED**
- SIGNED ON-PREM RELEASE: **BLOCKED**

## Deployment profile

- Mode: `LOCAL_ON_PREM`
- Detected host interface: Wi-Fi, MediaTek Wi-Fi 6 MT7921
- Host IPv4: `10.226.116.201/24`
- Gateway: `10.226.116.134`
- API base: `http://10.226.116.201:5000/api`
- Server binding verified: `0.0.0.0:5000`
- Android cleartext policy: denied globally; allowed only for `10.226.116.201`
- Internet production remains a separate flavor and retains the HTTPS-only main policy.

The local profile validator accepts only IPv4 private ranges (`10/8`, `172.16/12`, `192.168/16`) with an `/api` path. It rejects loopback, link-local, unspecified, public IPs, hostnames, empty values, and unsupported schemes. Production CORS now requires an exact configured origin; broad development/Capacitor bypasses were removed.

## Build and artifact verification

- Web build: `vite build --mode onprem` — passed
- TypeScript: client and server — passed
- Capacitor Android sync — passed, 13 plugins
- Gradle task: `assembleOnPremDebug` — passed
- APK: `output/CampusOS-v1.0.6-build7-onprem-debug.apk`
- Size: 19,178,694 bytes
- SHA-256: `8F0F95C7BE6C967061D7C239A877D24DE85E0D5162687A4AD9938402A1064667`
- Package: `com.campusos.app`
- Version: `1.0.6` (`versionCode 7`)
- Min/target/compile SDK: 26 / 35 / 35
- Embedded entry assets: `index-BLdyF67V.js`, `index-Cs2e53xL.css`
- Compiled bundle contains `http://10.226.116.201:5000/api`
- Forbidden nested `.apk`, `.aab`, `.ipa`, `.zip`, `.map`: 0
- APK signature verification: v2 and v3 valid; signer is the Android debug certificate

Compiled network-security XML was inspected from the APK. Its base configuration has `cleartextTrafficPermitted=false`; the only cleartext domain entry is the exact IP `10.226.116.201`, without subdomains. Capacitor uses the bundled application (`server.url` absent), `androidScheme=http`, and does not enable its broad `cleartext` switch.

## Host LAN runtime

- `GET http://10.226.116.201:5000/api/health` returned HTTP 200.
- Reported status: healthy.
- Database: ok (29 ms during verification).
- Storage: ok.
- Push notifications: configured.
- Server runtime currently reports `environment=development`; this is not a production/on-prem process launch verification.
- Wi-Fi is classified as a Windows Public network.
- No enabled inbound TCP/5000 firewall rule was found.
- Creation of a subnet-restricted Public-profile rule for TCP 5000 from `10.226.116.0/24` was attempted, but Windows denied the operation because this session lacks administrator rights. The rule was not created.

Required administrator command:

```powershell
New-NetFirewallRule -DisplayName 'CampusOS API - LAN 10.226.116.0-24' -Description 'CampusOS LOCAL_ON_PREM API; TCP 5000; restricted to current LAN subnet.' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5000 -RemoteAddress '10.226.116.0/24' -Profile Public
```

Reserve `10.226.116.201` in DHCP or configure a stable host address before distributing this APK. If the address changes, rebuild the profile and its exact-IP Android policy. Confirm client isolation/AP isolation is disabled on the access point.

## Physical Android verification

- Device: Infinix X6870 (`Infinix_X6870`)
- ADB install with replacement: succeeded.
- Installed package reports version 1.0.6/code 7.
- `com.campusos.app/.MainActivity` reached top-resumed state.
- Recent logs showed rendered frames and no `ERR_CLEARTEXT_NOT_PERMITTED` failure.
- Device Wi-Fi was disabled; it was using cellular connectivity. Therefore the phone was not on `10.226.116.0/24`, and login/API/core workflows over the LAN could not be truthfully verified.

## Remaining blockers

1. Run the firewall command from an elevated Administrator PowerShell.
2. Connect the phone to the same `10.226.116.0/24` Wi-Fi, then verify `/api/health`, login, role workspace, reads/writes, uploads/downloads, offline recovery, and SSE/realtime behavior.
3. Re-run the same core workflow with WAN disconnected to establish local-only operation.
4. Provide a protected release keystore and the four `CAMPUSOS_ANDROID_*` signing variables to build and verify a signed on-prem release APK/AAB.
5. Firebase push/analytics and Razorpay remain Internet-dependent unless replaced with local services; they are not evidence of offline on-prem readiness.

## Final status

**LOCAL ON-PREM BUILD: BUILD VERIFIED**

**LAN API: RUNTIME VERIFIED (HOST ONLY); REMOTE DEVICE BLOCKED**

**ANDROID INSTALL: PHYSICAL DEVICE VERIFIED**

**LOCAL CORE CAMPUSOS: PHYSICAL DEVICE BLOCKED**

**SIGNED ON-PREM RELEASE: BLOCKED**
