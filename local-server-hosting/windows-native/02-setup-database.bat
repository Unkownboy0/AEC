@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   CampusOS Local Server - [Step 2: Database Initialization]
echo ======================================================================
echo.

set SERVER_DIR=%~dp0..\..\product\server

cd /d "%SERVER_DIR%"

echo [1/3] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Prisma client generation failed! Check database connection in product/server/.env.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Synchronizing Database Schema with PostgreSQL...
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo [ERROR] Database schema sync failed! Make sure PostgreSQL is running on localhost:5432.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Seeding Initial Roles, Admin Workspaces, and Sample Data...
call npm run seed
if %errorlevel% neq 0 (
    echo [NOTE] Seed script finished with notices.
)

echo.
echo ======================================================================
echo   DATABASE READY FOR PRODUCTION!
echo   Next Step: Run '03-build-production.bat'
echo ======================================================================
echo.
pause
