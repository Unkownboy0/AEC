@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   CampusOS Local Server - [Shutdown Server Processes]
echo ======================================================================
echo.

echo [1/2] Terminating processes on Port 5000 (Backend API)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R ":5000 "') do (
    if not "%%a"=="" (
        echo    Killing PID %%a on port 5000...
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo [2/2] Terminating processes on Port 5173 (Web Client)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R ":5173 "') do (
    if not "%%a"=="" (
        echo    Killing PID %%a on port 5173...
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo ======================================================================
echo   ALL CAMPUSOS LOCAL SERVER PROCESSES STOPPED SAFELY.
echo ======================================================================
echo.
pause
