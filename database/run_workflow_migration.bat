@echo off
echo ========================================
echo Running Workflow System Migration...
echo ========================================
echo.

echo Step 1: Enhancing notification table...
mysql -u root construction_db < database\notification_system_updates.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to enhance notification table
    pause
    exit /b 1
)
echo.

echo Step 2: Creating stored procedures...
mysql -u root construction_db < database\stored_procedures.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to create stored procedures
    pause
    exit /b 1
)
echo.

echo Step 3: Creating auto-sheet creation trigger...
mysql -u root construction_db < database\auto_sheet_creation_trigger.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to create trigger
    pause
    exit /b 1
)
echo.

echo Step 4: Creating enhancements (breakdown, summaries, analytics)...
mysql -u root construction_db < database\daily_sheet_enhancements.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to create enhancements
    pause
    exit /b 1
)
echo.

echo ========================================
echo Migration completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Backend will auto-install puppeteer (already done)
echo 2. Restart backend server: cd backend ^&^& npm start
echo 3. Restart frontend server: cd frontend ^&^& npm run dev
echo 4. Test the workflow system
echo.
echo New Features Added:
echo - Category-wise expense breakdown
echo - Weekly/Monthly summary reports
echo - Project expense statistics
echo - Rejection workflow
echo - Recent activity tracking
echo.
pause
