@echo off
echo ============================================
echo DATABASE CLEAN & MIGRATION
echo Smart Construction Management System
echo ============================================
echo.

echo This script will:
echo 1. Clean all old test data
echo 2. Run new project accounting schema
echo.

echo Please enter your MySQL root password when prompted:
echo.

echo Step 1: Cleaning old data...
cd /d "%~dp0database"
mysql -u root -p construction_db < clean_all_test_data.sql
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Clean failed! 
    echo Please run manually in phpMyAdmin or MySQL command line
    pause
    exit /b 1
)

echo.
echo Step 2: Running new schema...
mysql -u root -p construction_db < project_accounting_system.sql
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Schema migration failed!
    echo Please run manually in phpMyAdmin or MySQL command line
    pause
    exit /b 1
)

echo.
echo ============================================
echo DATABASE MIGRATION COMPLETE!
echo ============================================
echo.
echo Next steps:
echo 1. Restart backend server
echo 2. Refresh browser
echo 3. Login and test
echo.
pause
