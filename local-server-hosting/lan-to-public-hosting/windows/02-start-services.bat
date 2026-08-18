@echo off
setlocal

echo =================================================================
echo   Starting CampusOS Services & Cloudflare Tunnel on Windows
echo =================================================================

set "SCRIPT_DIR=%~dp0"
set "APP_ROOT=%SCRIPT_DIR%..\..\.."

cd /d "%APP_ROOT%\local-server-hosting"
call pm2 start windows-native\ecosystem.config.cjs
call pm2 save

sc query cloudflared >nul 2>&1
if %errorlevel% equ 0 (
    net start cloudflared >nul 2>&1
    echo [OK] Cloudflare Tunnel Service started.
)

echo.
echo =================================================================
call pm2 status
echo =================================================================
pause
