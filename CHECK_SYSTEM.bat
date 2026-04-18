@echo off
title System Health Check
color 0B

cls
echo.
echo ================================================
echo    SYSTEM HEALTH CHECK
echo    Smart Construction Management System
echo ================================================
echo.
echo Checking for errors...
echo.

set ERRORS=0
set WARNINGS=0

REM Check 1: Node.js installed
echo [1/10] Checking Node.js...
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Node.js is installed
    for /f "tokens=*" %%i in ('node --version') do echo   Version: %%i
) else (
    echo   ✗ Node.js is NOT installed
    set /a ERRORS+=1
)
echo.

REM Check 2: npm installed
echo [2/10] Checking npm...
where npm >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ npm is installed
    for /f "tokens=*" %%i in ('npm --version') do echo   Version: %%i
) else (
    echo   ✗ npm is NOT installed
    set /a ERRORS+=1
)
echo.

REM Check 3: MySQL installed
echo [3/10] Checking MySQL...
where mysql >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ MySQL is in PATH
) else (
    echo   ! MySQL is NOT in PATH (this is OK if you know the path)
    set /a WARNINGS+=1
)
echo.

REM Check 4: Backend node_modules
echo [4/10] Checking backend dependencies...
if exist "backend\node_modules" (
    echo   ✓ Backend dependencies installed
) else (
    echo   ✗ Backend dependencies NOT installed
    echo     Run: cd backend ^&^& npm install
    set /a ERRORS+=1
)
echo.

REM Check 5: Frontend node_modules
echo [5/10] Checking frontend dependencies...
if exist "frontend\node_modules" (
    echo   ✓ Frontend dependencies installed
) else (
    echo   ✗ Frontend dependencies NOT installed
    echo     Run: cd frontend ^&^& npm install
    set /a ERRORS+=1
)
echo.

REM Check 6: Backend .env file
echo [6/10] Checking backend configuration...
if exist "backend\.env" (
    echo   ✓ .env file exists
    findstr "DB_PASSWORD=your_password" backend\.env >nul
    if %errorlevel% equ 0 (
        echo   ! WARNING: MySQL password not configured in .env
        echo     Edit backend\.env and set DB_PASSWORD
        set /a WARNINGS+=1
    ) else (
        echo   ✓ Database password is configured
    )
) else (
    echo   ✗ .env file NOT found
    set /a ERRORS+=1
)
echo.

REM Check 7: Database schema file
echo [7/10] Checking database schema...
if exist "database\schema.sql" (
    echo   ✓ schema.sql exists
) else (
    echo   ✗ schema.sql NOT found
    set /a ERRORS+=1
)
echo.

REM Check 8: Admin setup script
echo [8/10] Checking admin setup script...
if exist "database\setup_admin.js" (
    echo   ✓ setup_admin.js exists
) else (
    echo   ✗ setup_admin.js NOT found
    set /a ERRORS+=1
)
echo.

REM Check 9: Start script
echo [9/10] Checking start script...
if exist "start.bat" (
    echo   ✓ start.bat exists
) else (
    echo   ✗ start.bat NOT found
    set /a ERRORS+=1
)
echo.

REM Check 10: Key backend files
echo [10/10] Checking critical backend files...
if exist "backend\server.js" (
    echo   ✓ server.js exists
) else (
    echo   ✗ server.js NOT found
    set /a ERRORS+=1
)

if exist "backend\src\config\database.js" (
    echo   ✓ database.js exists
) else (
    echo   ✗ database.js NOT found
    set /a ERRORS+=1
)
echo.

echo ================================================
echo    CHECK SUMMARY
echo ================================================
echo.

if %ERRORS% gtr 0 (
    echo ✗ ERRORS: %ERRORS%
    echo   These MUST be fixed before running!
    echo.
) else (
    echo ✓ ERRORS: 0
    echo.
)

if %WARNINGS% gtr 0 (
    echo ! WARNINGS: %WARNINGS%
    echo   These should be fixed for proper functionality
    echo.
) else (
    echo ✓ WARNINGS: 0
    echo.
)

echo ================================================

if %ERRORS% equ 0 (
    echo.
    echo ✓ SYSTEM IS READY TO RUN!
    echo.
    echo Next steps:
    echo   1. Configure MySQL password in backend\.env
    echo   2. Run QUICK_SETUP.bat to create database
    echo   3. Run start.bat to start the application
    echo.
) else (
    echo.
    echo ✗ SYSTEM HAS ERRORS - FIX THEM FIRST!
    echo.
    echo Fix the errors marked with ✗ above, then try again.
    echo.
)

echo ================================================
echo.
pause
