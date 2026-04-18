@echo off
echo ================================================================
echo   COMPLETE ID-WISE SYSTEM UPGRADE
echo   Smart Construction Management System
echo ================================================================
echo.

echo [1/4] Running database migration...
cd backend
node run_complete_role_upgrade.js
if errorlevel 1 (
    echo.
    echo ERROR: Database migration failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Database migration completed successfully!
echo.

echo [3/4] Starting backend server...
start cmd /k "node server.js"
timeout /t 3 /nobreak > nul

echo.
echo [4/4] Starting frontend server...
cd ..\frontend
start cmd /k "npm run dev"

echo.
echo ================================================================
echo   UPGRADE COMPLETE!
echo ================================================================
echo.
echo Next Steps:
echo   1. Wait for both servers to start
echo   2. Open your browser to http://localhost:5173
echo   3. Login as admin
echo   4. Go to Admin Panel
echo   5. Click "Role Manager" tab to see all roles
echo   6. Click "ID Verification" tab to run checks
echo.
echo Documentation: See COMPLETE_ID_SYSTEM_GUIDE.md
echo.
pause
