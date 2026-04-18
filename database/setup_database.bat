@echo off
echo ========================================
echo MySQL Database Setup Helper
echo ========================================
echo.
echo This will help you set up the database.
echo.
echo Please enter your MySQL root password when prompted.
echo.
pause

echo.
echo Setting up database...
echo.

mysql -u root -p < schema.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Database created successfully!
    echo ========================================
    echo.
    echo Now creating admin user...
    echo.
    
    cd ..
    cd database
    node setup_admin.js
    
    echo.
    echo ========================================
    echo Setup Complete!
    echo ========================================
    echo.
    echo You can now start the application with: start.bat
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Database setup failed!
    echo ========================================
    echo.
    echo Please check:
    echo 1. MySQL is installed and running
    echo 2. You entered the correct password
    echo 3. MySQL is in your system PATH
    echo.
)

pause
