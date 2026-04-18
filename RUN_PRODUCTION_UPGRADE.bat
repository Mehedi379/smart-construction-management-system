@echo off
echo ============================================
echo PRODUCTION UPGRADE MIGRATION
echo Smart Construction Management System
echo ============================================
echo.

echo Step 1: Installing new dependencies...
cd backend
call npm install express-rate-limit cookie-parser
echo.

echo Step 2: Creating database backup...
set BACKUP_FILE=backup_before_upgrade_%date:~-4,4%%date:~-7,2%%date:~-10,2%.sql
mysqldump -u root -p construction_db > %BACKUP_FILE%
echo Database backup created: %BACKUP_FILE%
echo.

echo Step 3: Running database migration...
mysql -u root -p construction_db < ../database/schema_production_upgrade.sql
echo.

echo Step 4: Verifying migration...
mysql -u root -p construction_db -e "SELECT COUNT(*) as audit_logs FROM audit_logs; SELECT COUNT(*) as approved_employees FROM v_approved_employees;"
echo.

echo ============================================
echo MIGRATION COMPLETE!
echo ============================================
echo.
echo Next Steps:
echo 1. Check database tables were created
echo 2. Start backend server: npm run dev
echo 3. Test login and registration
echo 4. Verify employee count is correct
echo.
pause
