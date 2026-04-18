@echo off
echo ============================================
echo Restarting Backend Server...
echo ============================================
echo.

REM Kill any existing Node.js processes on port 9000
echo Stopping existing backend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9000') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo Starting backend server...
echo.
cd /d "%~dp0backend"
node server.js

pause
