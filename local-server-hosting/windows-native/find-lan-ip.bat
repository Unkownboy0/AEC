@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   CampusOS Local Server - [Network & LAN IP Discovery]
echo ======================================================================
echo.

echo Detecting active IPv4 Network Adapters:
echo ----------------------------------------------------------------------
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=* delims= " %%b in ("%%a") do (
        echo   - IPv4 Address: %%b
    )
)
echo ----------------------------------------------------------------------

echo.
echo Use any of the IP addresses above in your phone browser or mobile app:
echo.
echo   Web Portal URL:       http://<YOUR_IP>:5173
echo   Mobile App Backend:   http://<YOUR_IP>:5000/api
echo.
echo ======================================================================
pause
