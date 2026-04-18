# Smart Construction Management System - Automatic Setup
# This script will guide you through the setup process

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  SMART CONSTRUCTION - AUTOMATIC SETUP" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Step 1: Find MySQL
Write-Host "Step 1: Finding MySQL..." -ForegroundColor Yellow
Write-Host ""

$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe"
)

$mysqlExe = $null

foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlExe = $path
        Write-Host "  ✓ Found MySQL at: $path" -ForegroundColor Green
        break
    }
}

if (-not $mysqlExe) {
    Write-Host "  ✗ MySQL not found in common locations!" -ForegroundColor Red
    Write-Host ""
    $manualPath = Read-Host "  Enter MySQL.exe full path (or press Enter to skip)"
    
    if ($manualPath -and (Test-Path $manualPath)) {
        $mysqlExe = $manualPath
        Write-Host "  ✓ Using MySQL from: $mysqlExe" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Please install MySQL or provide the correct path." -ForegroundColor Red
        Write-Host "Download from: https://dev.mysql.com/downloads/installer/" -ForegroundColor Yellow
        pause
        exit
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Step 2: Database Setup" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "Enter your MySQL root password:" -ForegroundColor Yellow
$securePassword = Read-Host -AsSecureString
$password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))

Write-Host ""
Write-Host "Creating database..." -ForegroundColor Yellow

# Create schema.sql temporarily with password
$schemaPath = "C:\Users\MEHEDI HASAN\Desktop\Smart Construction Management System\database\schema.sql"

# Run the schema
$process = Start-Process -FilePath $mysqlExe -ArgumentList "-u", "root", "-p$password", "-e", "source `"$schemaPath`"" -Wait -NoNewWindow -PassThru

if ($process.ExitCode -eq 0) {
    Write-Host "  ✓ Database created successfully!" -ForegroundColor Green
} else {
    Write-Host "  ✗ Database creation failed!" -ForegroundColor Red
    Write-Host "  Please check your MySQL password and try again." -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Step 3: Creating Admin User" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Create admin user with bcrypt hash
$envFile = "C:\Users\MEHEDI HASAN\Desktop\Smart Construction Management System\backend\.env"

# Temporarily set environment for the script
$env:DB_HOST = "localhost"
$env:DB_USER = "root"
$env:DB_PASSWORD = $password
$env:DB_NAME = "construction_db"

# Run admin setup script
$setupScript = "C:\Users\MEHEDI HASAN\Desktop\Smart Construction Management System\database\setup_admin.js"
$nodeProcess = Start-Process -FilePath "node" -ArgumentList "`"$setupScript`"" -Wait -NoNewWindow -PassThru

if ($nodeProcess.ExitCode -eq 0) {
    Write-Host "  ✓ Admin user created successfully!" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Admin user creation had issues (you can create it manually later)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Step 4: Updating Configuration" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Update .env file with password
$envContent = @"
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=$password
DB_NAME=construction_db

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Secret
JWT_SECRET=smart_construction_secret_key_2026
JWT_EXPIRE=7d

# Upload Settings
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
"@

$envContent | Out-File -FilePath $envFile -Encoding UTF8
Write-Host "  ✓ Configuration saved!" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Green

Write-Host "Your Smart Construction Management System is ready!`n" -ForegroundColor White
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "  Email:    admin@khazabilkis.com" -ForegroundColor Cyan
Write-Host "  Password: admin123`n" -ForegroundColor Cyan

Write-Host "The application is already running at:" -ForegroundColor Yellow
Write-Host "  http://localhost:3002`n" -ForegroundColor Cyan

Write-Host "================================================" -ForegroundColor Green
Write-Host ""

pause
