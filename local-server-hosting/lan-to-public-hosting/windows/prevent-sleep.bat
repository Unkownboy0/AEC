@echo off
setlocal

echo =================================================================
echo   Configuring Windows Continuous 24/7 Power Settings
echo =================================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Please right-click this script and select 'Run as administrator'.
    pause
    exit /b 1
)

:: Set Standby timeout on AC power to 0 (Never)
powercfg /change standby-timeout-ac 0

:: Set Hibernate timeout on AC power to 0 (Never)
powercfg /change hibernate-timeout-ac 0

:: Set Disk timeout on AC power to 0 (Never)
powercfg /change disk-timeout-ac 0

:: Set Monitor turn-off to 15 minutes (Display turns off but CPU and Network stay running)
powercfg /change monitor-timeout-ac 15

echo [OK] Windows power plan configured: System will NEVER sleep or hibernate.
echo [OK] Network adapters and background services will run continuously 24/7.
echo =================================================================
