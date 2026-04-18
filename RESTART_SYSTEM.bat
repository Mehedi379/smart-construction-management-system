@echo off
echo ================================================================
echo   RESTARTING SMART CONSTRUCTION MANAGEMENT SYSTEM
echo ================================================================
echo.

echo [1/2] Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo [2/2] Starting servers...
echo.

echo Starting Backend Server...
start cmd /k "cd backend && node server.js"
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo ================================================================
echo   SERVERS STARTED!
echo ================================================================
echo.
echo Backend:  http://localhost:9000
echo Frontend: http://localhost:3000 or http://localhost:3001
echo Admin Panel: http://localhost:3000/admin
echo.
echo Wait 5 seconds, then open your browser!
echo.
timeout /t 5 /nobreak > nul

start http://localhost:3000/admin

pause
