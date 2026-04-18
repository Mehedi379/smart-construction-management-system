const mysql = require('mysql2/promise');
require('dotenv').config();

async function testRailwayConnection() {
    console.log('\n========================================');
    console.log('🔍 TESTING DATABASE CONNECTION');
    console.log('========================================\n');

    console.log('Current Configuration:');
    console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
    console.log('DB_USER:', process.env.DB_USER || 'root');
    console.log('DB_NAME:', process.env.DB_NAME || 'construction_db');
    console.log('DB_PORT:', process.env.DB_PORT || '3306');
    console.log('');

    let connection;
    
    try {
        console.log('⏳ Attempting to connect...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db',
            port: process.env.DB_PORT || 3306,
            connectTimeout: 10000
        });

        console.log('✅ CONNECTION SUCCESSFUL!');
        console.log('');
        
        // Test query
        const [result] = await connection.query('SELECT 1 as test');
        console.log('✅ Query test passed:', result);
        
        // Get database info
        const [dbInfo] = await connection.query('SELECT DATABASE() as current_db, VERSION() as mysql_version');
        console.log('✅ Current Database:', dbInfo[0].current_db);
        console.log('✅ MySQL Version:', dbInfo[0].mysql_version);
        
        // Count tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('✅ Number of tables:', tables.length);
        
        await connection.end();
        
        console.log('\n========================================');
        console.log('✓ Database is working perfectly!');
        console.log('========================================\n');
        
    } catch (error) {
        console.log('\n❌ CONNECTION FAILED!');
        console.log('');
        console.log('Error Details:');
        console.log('Error Code:', error.code);
        console.log('Error Message:', error.message);
        console.log('');
        
        if (error.code === 'ECONNREFUSED') {
            console.log('🔧 TROUBLESHOOTING:');
            console.log('─────────────────────────────────────');
            console.log('❌ Connection Refused');
            console.log('');
            console.log('Possible causes:');
            console.log('1. MySQL server is not running');
            console.log('2. Wrong host/port configuration');
            console.log('3. Railway database is not accessible from local machine');
            console.log('');
            console.log('Solutions:');
            console.log('✓ For LOCAL development: Use localhost MySQL');
            console.log('✓ For RAILWAY: Deploy backend to Railway first');
            console.log('');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('🔧 TROUBLESHOOTING:');
            console.log('─────────────────────────────────────');
            console.log('❌ Access Denied');
            console.log('');
            console.log('Possible causes:');
            console.log('1. Wrong username or password');
            console.log('2. User does not have access to this database');
            console.log('');
            console.log('Solutions:');
            console.log('✓ Check Railway variables for correct credentials');
            console.log('✓ Verify DB_USER and DB_PASSWORD in .env file');
            console.log('');
        } else if (error.code === 'ENOTFOUND') {
            console.log('🔧 TROUBLESHOOTING:');
            console.log('─────────────────────────────────────');
            console.log('❌ Host Not Found');
            console.log('');
            console.log('Possible causes:');
            console.log('1. Railway database host is incorrect');
            console.log('2. Railway database is internal-only');
            console.log('');
            console.log('IMPORTANT: Railway MySQL is typically ONLY accessible from within Railway network!');
            console.log('');
            console.log('Solutions:');
            console.log('✓ Deploy your backend to Railway (recommended)');
            console.log('✓ OR use Railway\'s public URL if available');
            console.log('✓ OR use local MySQL for development');
            console.log('');
        } else if (error.message.includes('timed out')) {
            console.log('🔧 TROUBLESHOOTING:');
            console.log('─────────────────────────────────────');
            console.log('❌ Connection Timed Out');
            console.log('');
            console.log('Possible causes:');
            console.log('1. Firewall blocking connection');
            console.log('2. Railway database not publicly accessible');
            console.log('3. Wrong host address');
            console.log('');
            console.log('Solutions:');
            console.log('✓ Railway MySQL is internal-only by default');
            console.log('✓ Deploy backend to Railway to access it');
            console.log('✓ OR enable public access in Railway settings');
            console.log('');
        } else {
            console.log('🔧 TROUBLESHOOTING:');
            console.log('─────────────────────────────────────');
            console.log('Unexpected error occurred');
            console.log('');
            console.log('Solutions:');
            console.log('1. Check Railway dashboard for database status');
            console.log('2. Verify all environment variables are correct');
            console.log('3. Try deploying backend to Railway');
            console.log('');
        }
    }
}

testRailwayConnection();
