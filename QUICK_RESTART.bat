@echo off
echo ================================================================
echo   QUICK RESTART - Backend Only
echo ================================================================
echo.

echo Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Starting Backend...
cd backend
start "Backend - Port 9000" cmd /k "node server.js"

timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend...
cd ..\frontend
start "Frontend - Port 3000" cmd /k "npm run dev"

echo.
echo ================================================================
echo   SERVERS RESTARTED!
echo ================================================================
echo.
echo Wait 5 seconds...
timeout /t 5 /nobreak > nul

echo.
echo Opening Admin Panel...
start http://localhost:3000/admin

echo.
echo Done! Check the backend console for detailed error messages.
echo.
pause
