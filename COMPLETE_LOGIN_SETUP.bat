@echo off
echo ========================================
echo COMPLETE SETUP FOR LOGIN
echo Smart Construction Management System
echo ========================================
echo.

echo Step 1: Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

echo Step 2: Starting Backend Server...
echo The backend will start on http://localhost:9000
echo.
start "Backend Server" cmd /k "npm start"
echo ✓ Backend server starting...
echo.

echo Step 3: Waiting for backend to start (10 seconds)...
timeout /t 10 /nobreak
echo.

echo Step 4: Installing Frontend Dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

echo Step 5: Starting Frontend Server...
echo The frontend will start on http://localhost:5173
echo.
start "Frontend Server" cmd /k "npm run dev"
echo ✓ Frontend server starting...
echo.

echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo ADMIN LOGIN CREDENTIALS:
echo Email: admin@khazabilkis.com
echo Password: admin123
echo.
echo ACCESS THE APP:
echo Local Frontend: http://localhost:5173/login
echo Backend API: http://localhost:9000/api/health
echo.
echo Deployed Frontend: https://smart-construction-management-syste.vercel.app/login
echo (Note: Deployed version needs backend deployment to Railway)
echo.
echo ========================================
echo Wait 5 seconds, then open your browser!
echo ========================================
timeout /t 5
echo.

echo Opening login page...
start http://localhost:5173/login
echo.
pause
