@echo off
setlocal EnableExtensions
cd /d "%~dp0"

where py >nul 2>&1
if %errorlevel%==0 (
    py -3 -m venv .venv
) else (
    where python >nul 2>&1
    if errorlevel 1 goto missing_python
    python -m venv .venv
)
if errorlevel 1 goto setup_failed

".venv\Scripts\python.exe" -m pip install --upgrade -r backend\requirements.txt
if errorlevel 1 goto setup_failed

where npm >nul 2>&1
if errorlevel 1 goto missing_node
pushd frontend
call npm install
if errorlevel 1 goto setup_failed_pop
call npm run build
if errorlevel 1 goto setup_failed_pop
popd

where ffmpeg >nul 2>&1
if errorlevel 1 (
    echo.
    echo WARNING: FFmpeg is not installed. High-quality video and audio merging may fail.
    echo Install FFmpeg and restart this launcher for best quality.
)

set "STATIC_DIR=%CD%\frontend\dist"
set "PORT=8000"
set "ANALYZE_TIMEOUT=180"
set "DOWNLOAD_TIMEOUT=1800"
set "MAX_DOWNLOAD_BYTES=5000000000"
echo.
echo SaveFlow will open at http://127.0.0.1:8000/
echo Keep this window open while using it. Press Ctrl+C to stop.
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 3; Start-Process 'http://127.0.0.1:8000/'"
".venv\Scripts\python.exe" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
pause
exit /b

:setup_failed_pop
popd
:setup_failed
echo Setup failed. Check the message above and try again.
pause
exit /b 1
:missing_python
echo Python 3 is required. Install it from https://www.python.org/downloads/windows/
pause
exit /b 1
:missing_node
echo Node.js 22 or newer is required. Install it from https://nodejs.org/en/download
pause
exit /b 1
