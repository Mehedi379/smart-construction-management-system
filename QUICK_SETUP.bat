@echo off
title Smart Construction - Quick Setup
color 0A

cls
echo.
echo ================================================
echo    SMART CONSTRUCTION MANAGEMENT SYSTEM
echo    Quick Setup Wizard
echo ================================================
echo.
echo This wizard will help you:
echo   1. Find your MySQL installation
echo   2. Set up the database
echo   3. Create admin user
echo   4. Configure the application
echo.
echo Press any key to start...
pause > nul

cls
echo.
echo ================================================
echo    STEP 1: MySQL Location
echo ================================================
echo.
echo Please enter the full path to your MySQL bin folder.
echo.
echo Common locations:
echo   C:\Program Files\MySQL\MySQL Server 8.0\bin
echo   C:\Program Files\MySQL\MySQL Server 5.7\bin
echo   C:\xampp\mysql\bin
echo.
set /p MYSQL_PATH="Enter MySQL bin path (or press Enter to skip): "

if "%MYSQL_PATH%"=="" (
    echo.
    echo Skipping MySQL path configuration.
    echo You'll need to set up the database manually.
    echo.
    echo See HOW_TO_RUN.md for instructions.
    echo.
    pause
    exit /b
)

cls
echo.
echo ================================================
echo    STEP 2: Database Setup
echo ================================================
echo.
echo Setting up database using MySQL from:
echo %MYSQL_PATH%
echo.
echo Enter your MySQL root password when prompted.
echo.
pause

"%MYSQL_PATH%\mysql.exe" -u root -p < database\schema.sql

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Database setup failed!
    echo Please check your MySQL password and try again.
    echo.
    pause
    exit /b
)

echo.
echo ================================================
echo    Database created successfully!
echo ================================================
echo.
pause

cls
echo.
echo ================================================
echo    STEP 3: Create Admin User
echo ================================================
echo.

REM Create temporary .env for the script
echo DB_HOST=localhost > backend\.env.temp
echo DB_USER=root >> backend\.env.temp
set /p DB_PASS="Enter MySQL password: "
echo DB_PASSWORD=%DB_PASS% >> backend\.env.temp
echo DB_NAME=construction_db >> backend\.env.temp

cd database
node setup_admin.js

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Admin user creation failed!
    cd ..
    pause
    exit /b
)

cd ..
del backend\.env.temp > nul 2>&1

cls
echo.
echo ================================================
echo    STEP 4: Configure Application
echo ================================================
echo.
echo Updating backend configuration...
echo.

REM Update .env file
(
echo # Database Configuration
echo DB_HOST=localhost
echo DB_USER=root
echo DB_PASSWORD=%DB_PASS%
echo DB_NAME=construction_db
echo.
echo # Server Configuration
echo PORT=5000
echo NODE_ENV=development
echo.
echo # JWT Secret
echo JWT_SECRET=smart_construction_secret_key_2026
echo JWT_EXPIRE=7d
echo.
echo # Upload Settings
echo MAX_FILE_SIZE=5242880
echo UPLOAD_PATH=./uploads
) > backend\.env

echo Configuration saved!
echo.
pause

cls
echo.
echo ================================================
echo    ✓ SETUP COMPLETE!
echo ================================================
echo.
echo Your Smart Construction Management System is ready!
echo.
echo Login Credentials:
echo   Email: admin@khazabilkis.com
echo   Password: admin123
echo.
echo To start the application:
echo   Double-click: start.bat
echo.
echo ================================================
echo.
pause
