@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   CampusOS Local Server - [Step 3: Build Production Bundles]
echo ======================================================================
echo.

set ROOT_DIR=%~dp0..\..
set SERVER_DIR=%ROOT_DIR%\product\server
set CLIENT_DIR=%ROOT_DIR%\product\client

echo [1/2] Building Backend Production Server (TypeScript -^> JavaScript)...
cd /d "%SERVER_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed!
    pause
    exit /b %errorlevel%
)
echo    [OK] Backend built cleanly into product/server/dist/

echo.
echo [2/2] Building Frontend Web Client (Vite Optimized SPA Bundle)...
cd /d "%CLIENT_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b %errorlevel%
)
echo    [OK] Frontend built cleanly into product/client/dist/

echo.
echo ======================================================================
echo   BUILD SUCCESSFUL! PRODUCTION ARTIFACTS READY.
echo   Next Step: Run '04-start-campusos.bat' to host on local server.
echo ======================================================================
echo.
pause
