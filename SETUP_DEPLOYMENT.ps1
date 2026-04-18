# ============================================
# Smart Construction Management System
# Automated Deployment Setup Script
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Deployment Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Git is installed
Write-Host "Step 1: Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✅ Git installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Red
    exit
}

# Step 2: Initialize Git Repository
Write-Host ""
Write-Host "Step 2: Initialize Git Repository..." -ForegroundColor Yellow

if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Step 3: Check if GitHub CLI is installed
Write-Host ""
Write-Host "Step 3: Checking GitHub CLI..." -ForegroundColor Yellow
try {
    $ghVersion = gh --version
    Write-Host "✅ GitHub CLI installed: $ghVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  GitHub CLI not found" -ForegroundColor Yellow
    Write-Host "You can install it from: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host "Or create repository manually on GitHub website" -ForegroundColor Yellow
}

# Step 4: Create .gitignore check
Write-Host ""
Write-Host "Step 4: Verifying .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    Write-Host "✅ .gitignore file exists" -ForegroundColor Green
} else {
    Write-Host "❌ .gitignore not found!" -ForegroundColor Red
}

# Step 5: Check backend .env
Write-Host ""
Write-Host "Step 5: Checking backend configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "✅ Backend .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend .env not found" -ForegroundColor Yellow
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✅ Created backend .env from example" -ForegroundColor Green
    }
}

# Step 6: Check frontend .env
Write-Host ""
Write-Host "Step 6: Checking frontend configuration..." -ForegroundColor Yellow
if (Test-Path "frontend\.env") {
    Write-Host "✅ Frontend .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend .env not found" -ForegroundColor Yellow
    if (Test-Path "frontend\.env.example") {
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "✅ Created frontend .env from example" -ForegroundColor Green
    }
}

# Step 7: Install dependencies
Write-Host ""
Write-Host "Step 7: Installing dependencies..." -ForegroundColor Yellow

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
Set-Location ..

Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
Set-Location ..

Write-Host "✅ All dependencies installed" -ForegroundColor Green

# Step 8: Test build
Write-Host ""
Write-Host "Step 8: Testing frontend build..." -ForegroundColor Yellow
Set-Location frontend
npm run build
Set-Location ..
Write-Host "✅ Frontend build successful" -ForegroundColor Green

# Step 9: Display next steps
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create GitHub Repository:" -ForegroundColor White
Write-Host "   - Go to https://github.com" -ForegroundColor Gray
Write-Host "   - Create a new public repository" -ForegroundColor Gray
Write-Host "   - Name: smart-construction-management-system" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Push Code to GitHub:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m 'Initial commit: Smart Construction Management System'" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/smart-construction-management-system.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Deploy Backend to Render:" -ForegroundColor White
Write-Host "   - Go to https://render.com" -ForegroundColor Gray
Write-Host "   - Create new Web Service" -ForegroundColor Gray
Set-Host "   - Connect your GitHub repository" -ForegroundColor Gray
Write-Host "   - Set root directory: backend" -ForegroundColor Gray
Write-Host "   - Add environment variables (see DEPLOY_TO_GOOGLE.md)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Deploy Frontend to Vercel:" -ForegroundColor White
Write-Host "   - Go to https://vercel.com" -ForegroundColor Gray
Write-Host "   - Import GitHub repository" -ForegroundColor Gray
Write-Host "   - Set root directory: frontend" -ForegroundColor Gray
Write-Host "   - Add VITE_API_URL environment variable" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Full Guide: DEPLOY_TO_GOOGLE.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
