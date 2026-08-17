@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   CampusOS Production Local Server - [Step 2: Windows Service Setup]
echo ======================================================================
echo.
echo This script registers CampusOS as an automatic background Windows Service
echo that boots automatically when the physical machine is turned on.
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Administrative privileges required!
    echo Please right-click this batch file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

set HOSTING_DIR=%~dp0..

echo [1/4] Installing PM2 process manager globally...
call npm install -g pm2
if %errorlevel% neq 0 (
    echo [WARNING] Global npm install had warnings, continuing...
)

echo.
echo [2/4] Starting CampusOS backend & web services under PM2...
cd /d "%HOSTING_DIR%\windows-native"
call pm2 start ecosystem.config.cjs

echo.
echo [3/4] Saving PM2 active process state...
call pm2 save

echo.
echo [4/4] Installing PM2 Windows Startup Service...
call npm install -g pm2-windows-startup
call pm2-startup install >nul 2>&1

echo.
echo ======================================================================
echo   🎉 CAMPUSOS IS NOW REGISTERED AS AN AUTOMATIC WINDOWS SERVICE!
echo ======================================================================
echo   - Runs silently in the background
echo   - Automatically restarts on crash
echo   - Boots automatically on machine restart
echo.
echo   Useful PM2 Management Commands:
echo   - Check live status:    pm2 status
echo   - View live logs:       pm2 logs
echo   - Restart services:     pm2 restart all
echo   - Stop services:        pm2 stop all
echo ======================================================================
echo.
pause
