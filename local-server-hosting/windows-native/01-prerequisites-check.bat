@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   CampusOS Local Server - [Step 1: Diagnostics & Prerequisites]
echo ======================================================================
echo.

set "ALL_PASS=1"

:: 1. Check Node.js
echo [1/5] Checking Node.js runtime...
node -v >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
    echo    [OK] Node.js is installed: !NODE_VER!
) else (
    echo    [ERROR] Node.js is NOT installed or not in system PATH!
    echo    Download Node.js 20+ from https://nodejs.org
    set "ALL_PASS=0"
)

:: 2. Check NPM
echo.
echo [2/5] Checking NPM package manager...
call npm -v >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('call npm -v') do set "NPM_VER=%%v"
    echo    [OK] NPM is installed: !NPM_VER!
) else (
    echo    [ERROR] NPM is NOT available!
    set "ALL_PASS=0"
)

:: 3. Check PostgreSQL connection / CLI
echo.
echo [3/5] Checking PostgreSQL CLI tools...
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('psql --version') do set "PSQL_VER=%%v"
    echo    [OK] PostgreSQL client found: !PSQL_VER!
) else (
    echo    [NOTE] psql command not in PATH (Standard if using Docker or default PostgreSQL service).
)

:: 4. Check Port 5000 availability (Backend)
echo.
echo [4/5] Checking Port 5000 (Backend API Server)...
netstat -ano | findstr /R ":5000 " >nul 2>&1
if %errorlevel% equ 0 (
    echo    [BUSY] Port 5000 is currently in use. (CampusOS backend may already be running).
) else (
    echo    [OK] Port 5000 is free and available.
)

:: 5. Check Port 5173 / 80 availability (Frontend Web)
echo.
echo [5/5] Checking Port 5173 (Web Client)...
netstat -ano | findstr /R ":5173 " >nul 2>&1
if %errorlevel% equ 0 (
    echo    [BUSY] Port 5173 is currently in use.
) else (
    echo    [OK] Port 5173 is free and available.
)

echo.
echo ======================================================================
if "!ALL_PASS!"=="1" (
    echo   STATUS: ALL CORE PREREQUISITES VERIFIED!
    echo   Next Step: Run '02-setup-database.bat'
) else (
    echo   STATUS: ACTION REQUIRED. Please resolve the errors above.
)
echo ======================================================================
echo.
pause
