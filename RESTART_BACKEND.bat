@echo off
echo ========================================
echo RESTARTING BACKEND SERVER
echo ========================================
echo.

echo Stopping existing backend...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq node*" 2>nul
timeout /t 2 /nobreak >nul

echo Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0 && node server.js"

echo.
echo ========================================
echo Backend server is starting...
echo ========================================
echo.
echo Wait 3 seconds, then press any key to exit this window...
pause >nul
