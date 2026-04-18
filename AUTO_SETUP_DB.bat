@echo off
echo ========================================
echo Smart Construction Management System
echo Database Setup - Automated
echo ========================================
echo.

set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe

if not exist "%MYSQL_PATH%" (
    echo ERROR: MySQL not found at: %MYSQL_PATH%
    echo Please install MySQL or update the path in this script.
    pause
    exit /b 1
)

echo Step 1: Enter your MySQL root password
echo (If you don't have a password, just press Enter)
echo.
set /p MYSQL_PASSWORD="MySQL Root Password: "

echo.
echo Step 2: Creating database...
if "%MYSQL_PASSWORD%"=="" (
    "%MYSQL_PATH%" -u root -e "CREATE DATABASE IF NOT EXISTS construction_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
) else (
    "%MYSQL_PATH%" -u root -p%MYSQL_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS construction_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
)

if errorlevel 1 (
    echo ERROR: Failed to create database. Check your password.
    pause
    exit /b 1
)
echo ✓ Database created successfully!
echo.

echo Step 3: Creating tables...
if "%MYSQL_PASSWORD%"=="" (
    "%MYSQL_PATH%" -u root construction_db < database\schema.sql
) else (
    "%MYSQL_PATH%" -u root -p%MYSQL_PASSWORD% construction_db < database\schema.sql
)

if errorlevel 1 (
    echo ERROR: Failed to create tables.
    pause
    exit /b 1
)
echo ✓ Tables created successfully!
echo.

echo Step 4: Creating admin user...
cd database
if "%MYSQL_PASSWORD%"=="" (
    node setup_admin.js
) else (
    echo DB_PASSWORD=%MYSQL_PASSWORD%> ..\backend\.env.temp
    node setup_admin.js
)
cd ..

if errorlevel 1 (
    echo ERROR: Failed to create admin user.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✓ Setup Complete!
echo ========================================
echo.
echo Login Credentials:
echo Email: admin@khazabilkis.com
echo Password: admin123
echo.
echo Next: Start the backend and frontend servers
pause
