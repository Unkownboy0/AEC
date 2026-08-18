@echo off
setlocal enabledelayedexpansion

echo =================================================================
echo   Cloudflare Tunnel (cloudflared) Automated Installer for Windows
echo =================================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Please right-click this script and select 'Run as administrator'.
    pause
    exit /b 1
)

where cloudflared >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] cloudflared is already installed.
    cloudflared --version
    goto NEXT_STEPS
)

echo [*] Downloading latest cloudflared Windows binary...
set "TEMP_EXE=%TEMP%\cloudflared.exe"
set "TARGET_DIR=C:\Program Files\Cloudflare"
set "TARGET_EXE=%TARGET_DIR%\cloudflared.exe"

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%TARGET_EXE%'"

if not exist "%TARGET_EXE%" (
    echo [ERROR] Failed to download cloudflared. Please check your internet connection.
    pause
    exit /b 1
)

echo [*] Adding Cloudflare to system PATH...
setx PATH "%PATH%;%TARGET_DIR%" /M >nul

echo [OK] cloudflared installed successfully!

:NEXT_STEPS
echo.
echo =================================================================
echo Next Steps to activate public access:
echo   1. Run: cloudflared tunnel login
echo   2. Run: cloudflared tunnel create campusos-production
echo   3. Configure C:\Users\%USERNAME%\.cloudflared\config.yml
echo   4. Run: cloudflared service install
echo   5. Run: Start-Service cloudflared
echo =================================================================
pause
