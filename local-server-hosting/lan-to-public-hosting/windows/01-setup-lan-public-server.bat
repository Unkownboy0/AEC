@echo off
setlocal enabledelayedexpansion

echo =================================================================
echo   CampusOS Windows LAN-to-Public Server Setup & Deployment
echo =================================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Please right-click this script and select 'Run as administrator'.
    pause
    exit /b 1
)

set "SCRIPT_DIR=%~dp0"
set "APP_ROOT=%SCRIPT_DIR%..\..\.."

echo [*] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js LTS from https://nodejs.org
    pause
    exit /b 1
)

echo [*] Installing PM2 for Windows...
call npm install -g pm2 pm2-windows-service

echo [*] Building Backend Server...
cd /d "%APP_ROOT%\product\server"
call npm ci
call npx prisma generate
call npx prisma db push --accept-data-loss
call npm run seed
call npm run build

echo [*] Building Frontend Web Client...
cd /d "%APP_ROOT%\product\client"
call npm ci
call npm run build

echo [*] Starting PM2 Background Processes...
cd /d "%APP_ROOT%\local-server-hosting"
call pm2 start windows-native\ecosystem.config.cjs
call pm2 save

echo [*] Setting up Cloudflare Tunnel Installer...
call "%SCRIPT_DIR%..\cloudflare\install-cloudflared-windows.bat"

echo [*] Disabling Windows Sleep Mode...
call "%SCRIPT_DIR%prevent-sleep.bat"

echo.
echo =================================================================
echo   CampusOS Windows Server is Ready for Public Exposure!
echo =================================================================
echo   - Local Web Server: http://127.0.0.1:5173
echo   - Backend API:      http://127.0.0.1:5000
echo.
echo   To expose publicly, follow instructions in:
echo   local-server-hosting\lan-to-public-hosting\PUBLIC_LAN_HOSTING_GUIDE.md
echo =================================================================
pause
