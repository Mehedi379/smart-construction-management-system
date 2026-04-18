@echo off
echo ============================================
echo   VERCEL DEPLOYMENT PREPARATION
echo   Smart Construction Management System
echo ============================================
echo.

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo OK: Node.js found
echo.

echo [2/5] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)
echo OK: npm found
echo.

echo [3/5] Installing Vercel CLI...
npm install -g vercel
echo OK: Vercel CLI installed
echo.

echo [4/5] Building frontend for production...
cd frontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
cd ..
echo OK: Build successful
echo.

echo [5/5] Starting Vercel deployment...
echo.
echo IMPORTANT: Make sure you have:
echo   1. Logged into Vercel (vercel login)
echo   2. Your backend deployed and URL ready
echo   3. Environment variables configured
echo.
pause

cd frontend
vercel

echo.
echo ============================================
echo   DEPLOYMENT COMPLETE!
echo ============================================
echo.
echo Next steps:
echo 1. Go to your Vercel dashboard
echo 2. Set VITE_API_URL environment variable
echo 3. Redeploy if needed
echo.
pause
