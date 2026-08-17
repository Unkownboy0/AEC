@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   CampusOS Production Local Server - [Step 5: Automated Nightly Backup]
echo ======================================================================
echo.
echo This script creates a Windows Scheduled Task to back up the PostgreSQL
echo database every night at 2:00 AM automatically.
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Administrative privileges required!
    echo Please right-click this batch file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

set SCRIPT_PATH=%~dp0..\scripts\backup-db.bat

echo [1/2] Registering Windows Scheduled Task: 'CampusOS_Nightly_Database_Backup'...
schtasks /create /tn "CampusOS_Nightly_Database_Backup" /tr "\"%SCRIPT_PATH%\"" /sc daily /st 02:00 /ru "SYSTEM" /f >nul
if %errorlevel% equ 0 (
    echo    [OK] Task scheduled successfully for 02:00 AM daily.
) else (
    echo    [NOTE] Fallback task creation under current user...
    schtasks /create /tn "CampusOS_Nightly_Database_Backup" /tr "\"%SCRIPT_PATH%\"" /sc daily /st 02:00 /f
)

echo.
echo [2/2] Verifying task status...
schtasks /query /tn "CampusOS_Nightly_Database_Backup"

echo.
echo ======================================================================
echo   AUTOMATED NIGHTLY DATABASE BACKUP IS ACTIVE!
echo   Target Folder: product/server/backups/
echo ======================================================================
echo.
pause
