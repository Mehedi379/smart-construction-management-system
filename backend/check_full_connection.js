const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n========================================');
console.log('🔍 COMPLETE SYSTEM CONNECTION CHECK');
console.log('========================================\n');

async function checkAllConnections() {
    let allGood = true;

    // 1. Check Backend .env Configuration
    console.log('1️⃣  BACKEND CONFIGURATION (.env):');
    console.log('─────────────────────────────────────');
    console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
    console.log('DB_USER:', process.env.DB_USER || 'root');
    console.log('DB_NAME:', process.env.DB_NAME || 'construction_db');
    console.log('PORT:', process.env.PORT || '9000');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('');

    // 2. Test Database Connection
    console.log('2️⃣  DATABASE CONNECTION:');
    console.log('─────────────────────────────────────');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db',
            connectTimeout: 5000
        });

        console.log('✅ Database connected');
        
        // Check tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`✅ Tables found: ${tables.length}`);
        
        // Check if essential tables exist
        const essentialTables = ['users', 'employees', 'projects', 'attendance', 'expenses'];
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        for (const table of essentialTables) {
            if (tableNames.includes(table)) {
                console.log(`   ✅ ${table} table exists`);
            } else {
                console.log(`   ❌ ${table} table MISSING`);
                allGood = false;
            }
        }

        // Check users
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`✅ Total users: ${users[0].count}`);

        // Check admin user
        const [admin] = await connection.query(
            "SELECT id, name, email, role FROM users WHERE role = 'admin' LIMIT 1"
        );
        if (admin.length > 0) {
            console.log(`✅ Admin user exists: ${admin[0].email}`);
        } else {
            console.log(`⚠️  No admin user found`);
        }

        await connection.end();
        console.log('');

    } catch (error) {
        console.log('❌ Database connection FAILED');
        console.log(`   Error: ${error.message}`);
        allGood = false;
        console.log('');
    }

    // 3. Check Frontend Configuration
    console.log('3️⃣  FRONTEND CONFIGURATION:');
    console.log('─────────────────────────────────────');
    
    const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env');
    if (fs.existsSync(frontendEnvPath)) {
        const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
        const apiUrlMatch = frontendEnv.match(/VITE_API_URL=(.+)/);
        
        if (apiUrlMatch) {
            const apiUrl = apiUrlMatch[1];
            console.log(`VITE_API_URL: ${apiUrl}`);
            
            if (apiUrl.includes('localhost')) {
                console.log('⚠️  Using LOCAL backend (development mode)');
                console.log('   For production, update to Railway backend URL');
            } else if (apiUrl.includes('railway.app')) {
                console.log('✅ Using Railway backend (production mode)');
            } else {
                console.log('⚠️  Verify this API URL is correct');
            }
        } else {
            console.log('❌ VITE_API_URL not found in frontend .env');
            allGood = false;
        }
    } else {
        console.log('❌ Frontend .env file not found');
        allGood = false;
    }
    console.log('');

    // 4. Check Backend Server CORS
    console.log('4️⃣  BACKEND CORS CONFIGURATION:');
    console.log('─────────────────────────────────────');
    
    const serverPath = path.join(__dirname, 'server.js');
    if (fs.existsSync(serverPath)) {
        const serverContent = fs.readFileSync(serverPath, 'utf8');
        
        if (serverContent.includes('cors')) {
            console.log('✅ CORS is configured');
            
            if (serverContent.includes('CORS_ORIGINS')) {
                console.log('✅ CORS_ORIGINS environment variable supported');
                
                if (process.env.CORS_ORIGINS) {
                    console.log(`   Current: ${process.env.CORS_ORIGINS}`);
                } else {
                    console.log('   Default: localhost:5173, localhost:3000');
                    console.log('   ⚠️  For production, add your frontend URL');
                }
            }
        } else {
            console.log('❌ CORS not configured');
            allGood = false;
        }
    } else {
        console.log('❌ server.js not found');
        allGood = false;
    }
    console.log('');

    // 5. Check Required Files
    console.log('5️⃣  REQUIRED FILES:');
    console.log('─────────────────────────────────────');
    
    const requiredFiles = [
        { path: 'server.js', name: 'Backend Server' },
        { path: 'src/config/database.js', name: 'Database Config' },
        { path: 'package.json', name: 'Backend Dependencies' },
        { path: '../frontend/package.json', name: 'Frontend Dependencies' },
        { path: '../frontend/src/services/api.js', name: 'Frontend API Service' },
        { path: '../database/schema.sql', name: 'Database Schema' },
    ];

    for (const file of requiredFiles) {
        const fullPath = path.join(__dirname, file.path);
        if (fs.existsSync(fullPath)) {
            console.log(`✅ ${file.name}`);
        } else {
            console.log(`❌ ${file.name} - MISSING`);
            allGood = false;
        }
    }
    console.log('');

    // 6. Deployment Status
    console.log('6️⃣  DEPLOYMENT STATUS:');
    console.log('─────────────────────────────────────');
    
    if (process.env.NODE_ENV === 'production') {
        console.log('✅ Running in PRODUCTION mode');
    } else {
        console.log('ℹ️  Running in DEVELOPMENT mode');
        console.log('   For production deployment, ensure:');
        console.log('   - Backend deployed to Railway');
        console.log('   - Frontend deployed to Vercel');
        console.log('   - Database schema created on Railway MySQL');
        console.log('   - Environment variables set correctly');
    }
    console.log('');

    // Final Summary
    console.log('========================================');
    if (allGood) {
        console.log('✅ ALL CHECKS PASSED!');
        console.log('========================================\n');
        console.log('Your system is properly configured!');
        console.log('\nFor local development:');
        console.log('  Backend: http://localhost:9000');
        console.log('  Frontend: http://localhost:5173');
        console.log('\nFor production:');
        console.log('  Deploy backend to Railway');
        console.log('  Deploy frontend to Vercel');
        console.log('');
    } else {
        console.log('⚠️  SOME CHECKS FAILED');
        console.log('========================================\n');
        console.log('Please fix the issues above before deploying.');
        console.log('');
    }
}

checkAllConnections().catch(err => {
    console.error('Error:', err.message);
});
