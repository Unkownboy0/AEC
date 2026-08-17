@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   CampusOS Local Server - [Step 4: Launch Production Servers]
echo ======================================================================
echo.

set ROOT_DIR=%~dp0..\..
set SERVER_DIR=%ROOT_DIR%\product\server
set HOSTING_DIR=%~dp0..

:: Detect LAN IP
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /V "::"') do (
    set "DETECTED_IP=%%a"
    goto :ip_found
)
:ip_found

echo [INFO] Detected Server LAN IP: !DETECTED_IP!
echo.

:: 1. Start Backend API Server in a dedicated process
echo [1/2] Launching Backend API Server on port 5000...
cd /d "%SERVER_DIR%"
start "CampusOS - Backend Server (Port 5000)" cmd /k "title CampusOS Backend API Server && node dist/server.js"

:: Give backend 2 seconds to initialize
timeout /t 2 /nobreak >nul

:: 2. Start Local Production Web Server & Proxy
echo [2/2] Launching Frontend Web Server on port 5173...
cd /d "%HOSTING_DIR%"
start "CampusOS - Web Client & Proxy (Port 5173)" cmd /k "title CampusOS Web Application Server && node scripts/local-web-server.mjs"

echo.
echo ======================================================================
echo   🎉 CAMPUSOS IS NOW LIVE ON YOUR LOCAL SERVER!
echo ======================================================================
echo.
echo   [ACCESS URLS]:
echo   - Local Browser:        http://localhost:5173
echo   - Same Wi-Fi / LAN PC:  http://!DETECTED_IP!:5173
echo   - Mobile App API Host:  http://!DETECTED_IP!:5000/api
echo.
echo   [DEFAULT TEST LOGINS]:
echo   - Student:      student001.cse@geetorus.com  /  Campus@123
echo   - Faculty:      faculty001.cse@geetorus.com  /  Campus@123
echo   - Super Admin:  admin@geetorus.com           /  Campus@123
echo.
echo   To stop the server at any time, run '05-stop-campusos.bat'
echo ======================================================================
echo.
pause
