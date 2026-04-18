@echo off
echo ========================================
echo MySQL Root Password Reset
echo ========================================
echo.
echo This will reset your MySQL root password to: root123
echo.
echo STEP 1: Stopping MySQL service...
echo.
pause

net stop MySQL80

echo.
echo STEP 2: Starting MySQL in safe mode...
echo A new window will open. Keep it open!
echo.
pause

start "MySQL Safe Mode" /MIN "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --skip-grant-tables --shared-memory

echo.
echo Waiting 5 seconds for MySQL to start...
timeout /t 5 /nobreak > nul

echo.
echo STEP 3: Resetting password...
echo.

"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root <<EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root123';
FLUSH PRIVILEGES;
EXIT;
EOF

if errorlevel 1 (
    echo.
    echo ERROR: Failed to reset password.
    echo Try manually:
    echo 1. Open Task Manager and end all mysqld.exe processes
    echo 2. Run this script again
    pause
    exit /b 1
)

echo.
echo STEP 4: Stopping safe mode MySQL...
echo.

taskkill /F /IM mysqld.exe > nul 2>&1

timeout /t 3 /nobreak > nul

echo.
echo STEP 5: Starting MySQL normally...
echo.

net start MySQL80

echo.
echo ========================================
echo ✓ Password Reset Complete!
echo ========================================
echo.
echo Your NEW MySQL root password is: root123
echo.
echo Now you can run the database setup with this password.
echo.
pause
