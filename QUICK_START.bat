@echo off
echo ========================================
echo Smart Construction Management System
echo COMPLETE SETUP & START
echo ========================================
echo.

echo Step 1: Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo Node.js is installed
echo.

echo Step 2: Installing Backend Dependencies...
cd backend
if not exist node_modules (
    echo Installing backend packages...
    call npm install
    if errorlevel 1 (
        echo ERROR: Backend installation failed!
        pause
        exit /b 1
    )
    echo Backend dependencies installed successfully
) else (
    echo Backend dependencies already installed
)
cd ..
echo.

echo Step 3: Installing Frontend Dependencies...
cd frontend
if not exist node_modules (
    echo Installing frontend packages...
    call npm install
    if errorlevel 1 (
        echo ERROR: Frontend installation failed!
        pause
        exit /b 1
    )
    echo Frontend dependencies installed successfully
) else (
    echo Frontend dependencies already installed
)
cd ..
echo.

echo Step 4: Checking MySQL Connection...
cd backend
node -e "require('./src/config/database.js')" 2>nul
if errorlevel 1 (
    echo WARNING: Cannot connect to MySQL database
    echo Please ensure MySQL is running in XAMPP/WAMP
    echo Database: construction_db
    echo.
    echo Do you want to continue anyway? (Y/N)
    set /p CONTINUE=
    if /i not "%CONTINUE%"=="Y" (
        echo Setup cancelled
        pause
        exit /b 1
    )
) else (
    echo Database connection successful
)
cd ..
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Starting Application...
echo.

echo Starting Backend Server...
start "Backend Server - Port 9000" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server - Port 3000" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Application Starting...
echo ========================================
echo Backend API: http://localhost:9000/api
echo Frontend: http://localhost:3000
echo Health Check: http://localhost:9000/api/health
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak > nul
start http://localhost:3000

echo.
echo ========================================
echo Test Accounts:
echo ========================================
echo Check TEST_ACCOUNTS.txt for login credentials
echo.
echo Press any key to stop all servers...
pause > nul

echo Stopping servers...
taskkill /FI "WindowTitle eq Backend Server*" /T /F > nul 2>&1
taskkill /FI "WindowTitle eq Frontend Server*" /T /F > nul 2>&1

echo Servers stopped.
pause
