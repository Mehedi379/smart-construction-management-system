@echo off
echo ========================================
echo Smart Construction Management System
echo Installation Script
echo M/S Khaza Bilkis Rabbi
echo ========================================
echo.

echo Step 1: Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)
cd ..
echo Backend dependencies installed successfully!
echo.

echo Step 2: Installing Frontend Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)
cd ..
echo Frontend dependencies installed successfully!
echo.

echo Step 3: Creating Backend Environment File...
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo .env file created in backend folder.
    echo PLEASE EDIT backend\.env WITH YOUR MYSQL PASSWORD!
) else (
    echo .env file already exists.
)
echo.

echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Make sure MySQL is installed and running
echo 2. Run database/schema.sql in MySQL
echo 3. Edit backend\.env with your MySQL credentials
echo 4. Create admin user (see README.md)
echo 5. Run 'start.bat' to start the application
echo.
pause
