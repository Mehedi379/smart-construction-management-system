@echo off
echo ========================================
echo PUSHING CODE TO GITHUB
echo ========================================
echo.

echo Step 1: Adding all files to Git...
git add .
echo ✓ Files added
echo.

echo Step 2: Committing changes...
git commit -m "Add deployment files and admin setup scripts"
echo ✓ Changes committed
echo.

echo Step 3: Pushing to GitHub...
git push origin main
echo ✓ Code pushed to GitHub!
echo.

echo ========================================
echo SUCCESS! Code is now on GitHub
echo ========================================
echo.
echo Next steps:
echo 1. Go to https://railway.app
echo 2. Login with GitHub
echo 3. New Project ^> Deploy from GitHub repo
echo 4. You should see your repository now!
echo.
pause
