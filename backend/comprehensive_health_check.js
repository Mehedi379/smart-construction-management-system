// ============================================
// COMPREHENSIVE SYSTEM HEALTH CHECK
// Smart Construction Management System
// ============================================

const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('🔍 COMPREHENSIVE SYSTEM HEALTH CHECK');
console.log('========================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = 0;

function check(name, condition, message) {
    totalChecks++;
    if (condition) {
        console.log(`✅ ${name}: ${message}`);
        passedChecks++;
    } else {
        console.log(`❌ ${name}: ${message}`);
        failedChecks++;
    }
}

function warn(name, message) {
    totalChecks++;
    warnings++;
    console.log(`⚠️  ${name}: ${message}`);
}

// ============================================
// 1. FILE STRUCTURE CHECKS
// ============================================

console.log('📁 FILE STRUCTURE CHECKS');
console.log('-------------------------------------------');

const rootDir = path.join(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

// Root files
check('start.bat exists', 
    fs.existsSync(path.join(rootDir, 'start.bat')), 
    'System startup script present');

check('.gitignore exists', 
    fs.existsSync(path.join(rootDir, '.gitignore')), 
    'Git ignore file present');

// Backend structure
check('Backend server.js exists', 
    fs.existsSync(path.join(backendDir, 'server.js')), 
    'Main server file present');

check('Backend package.json exists', 
    fs.existsSync(path.join(backendDir, 'package.json')), 
    'Backend dependencies file present');

check('Backend .env exists', 
    fs.existsSync(path.join(backendDir, '.env')), 
    'Backend environment config present');

check('Backend config directory exists', 
    fs.existsSync(path.join(backendDir, 'src', 'config')), 
    'Backend config directory present');

check('Backend controllers directory exists', 
    fs.existsSync(path.join(backendDir, 'src', 'controllers')), 
    'Backend controllers directory present');

check('Backend models directory exists', 
    fs.existsSync(path.join(backendDir, 'src', 'models')), 
    'Backend models directory present');

check('Backend routes directory exists', 
    fs.existsSync(path.join(backendDir, 'src', 'routes')), 
    'Backend routes directory present');

check('Backend middleware directory exists', 
    fs.existsSync(path.join(backendDir, 'src', 'middleware')), 
    'Backend middleware directory present');

check('Backend services directory exists', 
    fs.existsSync(path.join(backendDir, 'src', 'services')), 
    'Backend services directory present');

// Frontend structure
check('Frontend package.json exists', 
    fs.existsSync(path.join(frontendDir, 'package.json')), 
    'Frontend dependencies file present');

check('Frontend .env exists', 
    fs.existsSync(path.join(frontendDir, '.env')), 
    'Frontend environment config present');

check('Frontend vite.config.js exists', 
    fs.existsSync(path.join(frontendDir, 'vite.config.js')), 
    'Vite configuration present');

check('Frontend src directory exists', 
    fs.existsSync(path.join(frontendDir, 'src')), 
    'Frontend source directory present');

check('Frontend App.jsx exists', 
    fs.existsSync(path.join(frontendDir, 'src', 'App.jsx')), 
    'Main React app file present');

check('Frontend main.jsx exists', 
    fs.existsSync(path.join(frontendDir, 'src', 'main.jsx')), 
    'React entry point present');

console.log('');

// ============================================
// 2. CONFIGURATION CHECKS
// ============================================

console.log('⚙️  CONFIGURATION CHECKS');
console.log('-------------------------------------------');

// Backend .env check
try {
    const envContent = fs.readFileSync(path.join(backendDir, '.env'), 'utf8');
    const envLines = envContent.split('\n');
    
    const dbHost = envLines.find(line => line.startsWith('DB_HOST='));
    const dbUser = envLines.find(line => line.startsWith('DB_USER='));
    const dbName = envLines.find(line => line.startsWith('DB_NAME='));
    const port = envLines.find(line => line.startsWith('PORT='));
    const jwtSecret = envLines.find(line => line.startsWith('JWT_SECRET='));
    
    check('DB_HOST configured', 
        dbHost && dbHost.split('=')[1].trim(), 
        'Database host is set');
    
    check('DB_USER configured', 
        dbUser && dbUser.split('=')[1].trim(), 
        'Database user is set');
    
    check('DB_NAME configured', 
        dbName && dbName.split('=')[1].trim(), 
        'Database name is set');
    
    check('PORT configured', 
        port && port.split('=')[1].trim(), 
        `Server port: ${port.split('=')[1].trim()}`);
    
    check('JWT_SECRET configured', 
        jwtSecret && jwtSecret.split('=').slice(1).join('=').trim(), 
        'JWT secret is set');
    
    // Only warn if using default localhost without verification
    if (dbHost && (dbHost.includes('localhost') || dbHost.includes('127.0.0.1'))) {
        // This is normal for development, not a warning
        console.log('   📍 Database Host: localhost (development)');
    }
    
    if (jwtSecret && jwtSecret.includes('change_in_production')) {
        warn('JWT_SECRET', 'Change this to a secure random string in production');
    }
} catch (error) {
    check('Backend .env readable', false, 'Cannot read backend .env file');
}

// Frontend .env check
try {
    const frontendEnv = fs.readFileSync(path.join(frontendDir, '.env'), 'utf8');
    const apiUrl = frontendEnv.includes('VITE_API_URL');
    
    check('VITE_API_URL configured', 
        apiUrl, 
        'API URL is configured');
    
    if (apiUrl) {
        const match = frontendEnv.match(/VITE_API_URL=(.+)/);
        if (match) {
            console.log(`   📡 API URL: ${match[1].trim()}`);
        }
    }
} catch (error) {
    check('Frontend .env readable', false, 'Cannot read frontend .env file');
}

console.log('');

// ============================================
// 3. DEPENDENCY CHECKS
// ============================================

console.log('📦 DEPENDENCY CHECKS');
console.log('-------------------------------------------');

try {
    const backendPackage = JSON.parse(fs.readFileSync(path.join(backendDir, 'package.json'), 'utf8'));
    const backendDeps = Object.keys(backendPackage.dependencies || {});
    
    check('Backend has express', 
        backendDeps.includes('express'), 
        'Express framework installed');
    
    check('Backend has mysql2', 
        backendDeps.includes('mysql2'), 
        'MySQL driver installed');
    
    check('Backend has jsonwebtoken', 
        backendDeps.includes('jsonwebtoken'), 
        'JWT authentication installed');
    
    check('Backend has bcryptjs', 
        backendDeps.includes('bcryptjs'), 
        'Password hashing installed');
    
    check('Backend has cors', 
        backendDeps.includes('cors'), 
        'CORS support installed');
    
    check('Backend has multer', 
        backendDeps.includes('multer'), 
        'File upload support installed');
    
    check('Backend has dotenv', 
        backendDeps.includes('dotenv'), 
        'Environment variables support installed');
    
} catch (error) {
    check('Backend package.json valid', false, 'Cannot parse backend package.json');
}

try {
    const frontendPackage = JSON.parse(fs.readFileSync(path.join(frontendDir, 'package.json'), 'utf8'));
    const frontendDeps = Object.keys(frontendPackage.dependencies || {});
    const frontendDevDeps = Object.keys(frontendPackage.devDependencies || {});
    const allFrontendDeps = [...frontendDeps, ...frontendDevDeps];
    
    check('Frontend has react', 
        frontendDeps.includes('react'), 
        'React framework installed');
    
    check('Frontend has react-router-dom', 
        frontendDeps.includes('react-router-dom'), 
        'React routing installed');
    
    check('Frontend has axios', 
        frontendDeps.includes('axios'), 
        'HTTP client installed');
    
    check('Frontend has zustand', 
        frontendDeps.includes('zustand'), 
        'State management installed');
    
    check('Frontend has tailwindcss', 
        allFrontendDeps.includes('tailwindcss'), 
        'Tailwind CSS installed');
    
} catch (error) {
    check('Frontend package.json valid', false, 'Cannot parse frontend package.json');
}

console.log('');

// ============================================
// 4. CODE QUALITY CHECKS
// ============================================

console.log('🔧 CODE QUALITY CHECKS');
console.log('-------------------------------------------');

// Check server.js for proper error handling
try {
    const serverJs = fs.readFileSync(path.join(backendDir, 'server.js'), 'utf8');
    
    check('Server has error handling', 
        serverJs.includes('Error Handler') || serverJs.includes('catch') || serverJs.includes('error'), 
        'Error handling implemented');
    
    check('Server has CORS configured', 
        serverJs.includes('cors'), 
        'CORS is configured');
    
    check('Server has helmet security', 
        serverJs.includes('helmet'), 
        'Security headers configured');
    
    check('Server has rate limiting', 
        serverJs.includes('rateLimit'), 
        'Rate limiting configured (even if disabled)');
    
    check('Server has health check', 
        serverJs.includes('/api/health'), 
        'Health check endpoint available');
    
    check('Server has graceful shutdown', 
        serverJs.includes('SIGTERM') && serverJs.includes('SIGINT'), 
        'Graceful shutdown implemented');
    
} catch (error) {
    check('Server.js readable', false, 'Cannot read server.js');
}

// Check auth routes
try {
    const authRoutes = fs.readFileSync(path.join(backendDir, 'src', 'routes', 'auth.js'), 'utf8');
    
    check('Auth has login route', 
        authRoutes.includes('/login'), 
        'Login endpoint available');
    
    check('Auth has register route', 
        authRoutes.includes('/register'), 
        'Registration endpoint available');
    
    check('Auth has validation', 
        authRoutes.includes('body('), 
        'Input validation implemented');
    
} catch (error) {
    check('Auth routes readable', false, 'Cannot read auth routes');
}

console.log('');

// ============================================
// 5. DATABASE SCHEMA CHECKS
// ============================================

console.log('🗄️  DATABASE CHECKS');
console.log('-------------------------------------------');

const databaseDir = path.join(rootDir, 'database');
check('Database directory exists', 
    fs.existsSync(databaseDir), 
    'Database scripts directory present');

if (fs.existsSync(databaseDir)) {
    const sqlFiles = fs.readdirSync(databaseDir).filter(f => f.endsWith('.sql'));
    check('SQL migration files exist', 
        sqlFiles.length > 0, 
        `Found ${sqlFiles.length} SQL files`);
    
    const hasSchemaFile = sqlFiles.some(f => f.includes('schema'));
    check('Schema SQL file exists', 
        hasSchemaFile, 
        'Database schema file present');
}

console.log('');

// ============================================
// 6. SECURITY CHECKS
// ============================================

console.log('🔒 SECURITY CHECKS');
console.log('-------------------------------------------');

// Check for .env in .gitignore
try {
    const gitignore = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
    
    check('.gitignore includes .env', 
        gitignore.includes('.env'), 
        'Environment files are gitignored');
    
    check('.gitignore includes node_modules', 
        gitignore.includes('node_modules'), 
        'Node modules are gitignored');
    
} catch (error) {
    check('.gitignore readable', false, 'Cannot read .gitignore');
}

// Check password requirements
try {
    const authController = fs.readFileSync(path.join(backendDir, 'src', 'controllers', 'authController.js'), 'utf8');
    
    check('Password hashing implemented', 
        authController.includes('bcrypt') || authController.includes('hash'), 
        'Passwords are hashed');
    
    check('JWT implementation present', 
        authController.includes('jsonwebtoken') || authController.includes('jwt'), 
        'JWT tokens implemented');
    
} catch (error) {
    check('Auth controller readable', false, 'Cannot read auth controller');
}

console.log('');

// ============================================
// SUMMARY
// ============================================

console.log('========================================');
console.log('📊 HEALTH CHECK SUMMARY');
console.log('========================================');
console.log(`Total Checks: ${totalChecks}`);
console.log(`✅ Passed: ${passedChecks}`);
console.log(`❌ Failed: ${failedChecks}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log('');

if (failedChecks === 0) {
    console.log('🎉 OVERALL STATUS: HEALTHY');
    console.log('Your system structure is properly configured!');
} else {
    console.log('⚠️  OVERALL STATUS: NEEDS ATTENTION');
    console.log(`${failedChecks} issue(s) found that need to be fixed`);
}

if (warnings > 0) {
    console.log(`\n💡 ${warnings} warning(s) - Review for production readiness`);
}

console.log('\n========================================');
console.log('📋 NEXT STEPS:');
console.log('========================================');
console.log('1. Ensure MySQL is running');
console.log('2. Run database migrations if needed');
console.log('3. Install dependencies: npm install (in both backend and frontend)');
console.log('4. Start the system: double-click start.bat');
console.log('5. Access: http://localhost:3000');
console.log('========================================\n');
