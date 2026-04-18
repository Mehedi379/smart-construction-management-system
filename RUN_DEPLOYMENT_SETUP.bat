@echo off
REM ============================================
REM Smart Construction Management System
REM Quick Deployment Setup
REM ============================================

echo ========================================
echo 🚀 Smart Construction Deployment Setup
echo ========================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PowerShell not found!
    echo Please install PowerShell or run SETUP_DEPLOYMENT.ps1 manually
    pause
    exit /b 1
)

REM Run the PowerShell deployment script
echo Running deployment setup...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0SETUP_DEPLOYMENT.ps1"

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Create GitHub repository
echo 2. Push code to GitHub
echo 3. Deploy to Render (backend)
echo 4. Deploy to Vercel (frontend)
echo.
echo 📖 Read DEPLOY_TO_GOOGLE.md for full guide
echo 📖 Read QUICK_START_DEPLOY.md for quick start
echo.
pause
