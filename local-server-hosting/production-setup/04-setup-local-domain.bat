@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   CampusOS Production Local Server - [Step 4: Local Domain Mapping]
echo ======================================================================
echo.
echo This script maps the friendly domain name 'campusos.local' to your
echo local server machine.
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Administrative privileges required!
    echo Please right-click this batch file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

set HOSTS_FILE=%WINDIR%\System32\drivers\etc\hosts

:: Check if already mapped
findstr /i "campusos.local" "%HOSTS_FILE%" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 'campusos.local' is already mapped in Windows hosts file.
) else (
    echo [1/2] Adding '127.0.0.1 campusos.local' to %HOSTS_FILE%...
    echo 127.0.0.1    campusos.local >> "%HOSTS_FILE%"
    echo 127.0.0.1    aec.local >> "%HOSTS_FILE%"
    echo    [OK] Host mappings added.
)

echo.
echo [2/2] Enabling mDNS (Bonjour / Link-Local Multicast Resolution)...
powershell -Command "Get-NetIPInterface | Set-NetIPInterface -Dhcp Enabled" >nul 2>&1

echo.
echo ======================================================================
echo   LOCAL DOMAIN READY!
echo.
echo   You can now open:
echo   - http://campusos.local:5173  (or http://campusos.local with Port 80 server)
echo.
echo   NOTE: To allow OTHER devices (phones, student laptops) to use 'campusos.local':
echo   Add a DNS entry or DHCP static host reservation in your Wi-Fi Router's admin panel:
echo   Domain: campusos.local  --^>  IP: (Your Server LAN IP)
echo ======================================================================
echo.
pause
