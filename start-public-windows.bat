@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "TAILSCALE_EXE=%ProgramFiles%\Tailscale\tailscale.exe"
where tailscale >nul 2>&1
if not errorlevel 1 set "TAILSCALE_EXE=tailscale"
if not exist "%ProgramFiles%\Tailscale\tailscale.exe" (
    where tailscale >nul 2>&1
    if errorlevel 1 goto missing_tailscale
)
"%TAILSCALE_EXE%" status >nul 2>&1
if errorlevel 1 goto sign_in

echo Enabling public HTTPS through Tailscale Funnel...
"%TAILSCALE_EXE%" funnel --bg 8000
if errorlevel 1 goto funnel_failed
"%TAILSCALE_EXE%" funnel status
for /f "delims=" %%U in ('powershell -NoProfile -Command "$s=(& '%TAILSCALE_EXE%' funnel status 2^>^&1 ^| Out-String); if($s -match 'https://[a-zA-Z0-9.-]+\.ts\.net'){$Matches[0]}"') do set "VITE_SITE_URL=%%U"
if not defined VITE_SITE_URL goto url_failed
echo %VITE_SITE_URL%> SAVYOUR-PUBLIC-URL.txt
echo.
echo Your public website: %VITE_SITE_URL%
echo Keep this window open and keep the computer awake.
echo.
set "SAVYOUR_PUBLIC=1"
set "MAX_ACTIVE_JOBS=1"
set "MAX_DOWNLOAD_BYTES=1000000000"
set "DOWNLOAD_TIMEOUT=900"
set "ANALYZE_TIMEOUT=120"
set "JOB_TTL_SECONDS=1800"
call "%~dp0start-local-windows.bat"
exit /b %errorlevel%

:missing_tailscale
echo Install Tailscale for Windows from https://tailscale.com/download/windows
echo Sign in, then run this file again.
pause
exit /b 1
:sign_in
echo Open the Tailscale app and sign in before starting Savyour.
pause
exit /b 1
:funnel_failed
echo Tailscale could not enable Funnel. Check the message above and enable Funnel in the browser if prompted.
pause
exit /b 1
:url_failed
echo Funnel started, but its public URL could not be read. Run tailscale funnel status to find it.
pause
exit /b 1
