@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo   CampusOS Production Local Server - [Step 3: Local HTTPS / SSL Setup]
echo ======================================================================
echo.
echo This script creates local SSL/TLS certificates so CampusOS supports
echo HTTPS on your local network (required for Camera, QR Scanner, and Biometrics).
echo.

set CERTS_DIR=%~dp0..\nginx\certs
if not exist "%CERTS_DIR%" mkdir "%CERTS_DIR%"

:: Find LAN IP
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /V "::"') do (
    set "LAN_IP=%%a"
    goto :ip_found
)
:ip_found

echo [INFO] Target Hostnames: localhost, campusos.local, !LAN_IP!
echo.

echo [1/2] Generating self-signed RSA 2048-bit certificate via PowerShell...
powershell -Command ^
  "$cert = New-SelfSignedCertificate -DnsName 'localhost', 'campusos.local', '!LAN_IP!' -CertStoreLocation 'cert:\LocalMachine\My' -NotAfter (Get-Date).AddYears(5) -KeyExportPolicy Exportable;" ^
  "$pwd = ConvertTo-SecureString -String 'campusos' -Force -AsPlainText;" ^
  "Export-PfxCertificate -Cert $cert -FilePath '%CERTS_DIR%\campusos.pfx' -Password $pwd;" ^
  "Export-Certificate -Cert $cert -FilePath '%CERTS_DIR%\cert.cer';"

echo.
echo [2/2] Exporting PEM format for Nginx / Node.js HTTPS server...
powershell -Command ^
  "$bytes = [System.IO.File]::ReadAllBytes('%CERTS_DIR%\cert.cer');" ^
  "$b64 = [System.Convert]::ToBase64String($bytes, [System.Base64FormattingOptions]::InsertLineBreaks);" ^
  "$pem = \"-----BEGIN CERTIFICATE-----`r`n$b64`r`n-----END CERTIFICATE-----\";" ^
  "[System.IO.File]::WriteAllText('%CERTS_DIR%\cert.pem', $pem);"

echo.
echo ======================================================================
echo   SSL CERTIFICATE GENERATED IN:
echo   %CERTS_DIR%
echo.
echo   - cert.pem (Public Certificate)
echo   - campusos.pfx (Windows Standard Certificate Package)
echo ======================================================================
echo.
pause
