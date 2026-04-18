@echo off
echo ========================================
echo Smart Construction Management System
echo Database Setup Script
echo ========================================
echo.

echo Step 1: Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..
echo.

echo Step 2: Creating database...
echo Please enter your MySQL root password when prompted:
mysql -u root -p < database\schema.sql
if errorlevel 1 (
    echo ERROR: Failed to create database
    echo Make sure MySQL is installed and running
    pause
    exit /b 1
)
echo.

echo Step 3: Creating admin user...
cd database
node setup_admin.js
if errorlevel 1 (
    echo ERROR: Failed to create admin user
    pause
    exit /b 1
)
cd ..
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Start Backend: cd backend ^&^& npm run dev
echo 2. Start Frontend: cd frontend ^&^& npm run dev
echo 3. Open Browser: http://localhost:3000
echo.
echo Login Credentials:
echo Email: admin@khazabilkis.com
echo Password: admin123
echo.
pause
