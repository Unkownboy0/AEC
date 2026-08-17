@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   CampusOS Local Server - [Windows Firewall Configuration]
echo ======================================================================
echo.
echo This script configures Windows Defender Firewall to allow inbound
echo connections on ports 5000 (Backend API), 5173 (Web Client), and 80 (HTTP)
echo so phones, laptops, and tablets on the same Wi-Fi / LAN can connect.
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Administrative privileges required!
    echo Please right-click this batch file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo [1/3] Adding inbound rule for CampusOS Backend (Port 5000)...
netsh advfirewall firewall add rule name="CampusOS Backend API (5000)" dir=in action=allow protocol=TCP localport=5000 profile=any >nul
echo    [OK] Port 5000 rule added.

echo.
echo [2/3] Adding inbound rule for CampusOS Web Client (Port 5173)...
netsh advfirewall firewall add rule name="CampusOS Web Frontend (5173)" dir=in action=allow protocol=TCP localport=5173 profile=any >nul
echo    [OK] Port 5173 rule added.

echo.
echo [3/3] Adding inbound rule for Standard HTTP (Port 80)...
netsh advfirewall firewall add rule name="CampusOS HTTP Server (80)" dir=in action=allow protocol=TCP localport=80 profile=any >nul
echo    [OK] Port 80 rule added.

echo.
echo ======================================================================
echo   FIREWALL RULES CONFIGURED SUCCESSFULLY!
echo   Devices on your local Wi-Fi / LAN can now connect to CampusOS.
echo ======================================================================
echo.
pause
