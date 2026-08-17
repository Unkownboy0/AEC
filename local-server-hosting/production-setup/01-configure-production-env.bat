@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   CampusOS Production Local Server - [Step 1: Production Environment]
echo ======================================================================
echo.

set ROOT_DIR=%~dp0..\..
set SERVER_ENV=%ROOT_DIR%\product\server\.env

if exist "%SERVER_ENV%" (
    echo [INFO] An existing .env file was found in product/server/.env.
    echo Creating backup: product/server/.env.backup
    copy /Y "%SERVER_ENV%" "%ROOT_DIR%\product\server\.env.backup" >nul
)

echo [1/3] Generating secure production JWT secret...
for /f "tokens=*" %%a in ('powershell -Command "[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 } | ForEach-Object { [byte]$_ }))"') do (
    set "GEN_JWT=%%a"
)

echo.
echo [2/3] Writing production-hardened environment configuration...
(
    echo # ======================================================================
    echo #   CampusOS Institutional Production Environment
    echo # ======================================================================
    echo NODE_ENV=production
    echo PORT=5000
    echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campusos?schema=public^&connection_limit=50^&pool_timeout=30
    echo JWT_SECRET=!GEN_JWT!
    echo JWT_EXPIRES_IN=15m
    echo REFRESH_TOKEN_EXPIRES_IN=7d
    echo REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN=30d
    echo PASSWORD_RESET_TOKEN_MINUTES=15
    echo LOG_LEVEL=info
    echo ALLOWED_ORIGINS=*
    echo PUBLIC_APP_URL=http://localhost
    echo STORAGE_ROOT=./uploads
    echo BACKUP_ROOT=./backups
    echo PG_DUMP_PATH=pg_dump
    echo TRUST_PROXY=1
    echo PAYMENT_GATEWAY=DISABLED
    echo CAMPUS_TENANT_ID=campusos-default
    echo EMAIL_PROVIDER=DISABLED
) > "%SERVER_ENV%"

echo.
echo [3/3] Verifying directories exist...
if not exist "%ROOT_DIR%\product\server\uploads" mkdir "%ROOT_DIR%\product\server\uploads"
if not exist "%ROOT_DIR%\product\server\backups" mkdir "%ROOT_DIR%\product\server\backups"
if not exist "%ROOT_DIR%\product\server\logs" mkdir "%ROOT_DIR%\product\server\logs"

echo.
echo ======================================================================
echo   PRODUCTION ENVIRONMENT CONFIGURED!
echo   Secret generated: !GEN_JWT!
echo   Next Step: Run '02-install-windows-service.bat'
echo ======================================================================
echo.
pause
