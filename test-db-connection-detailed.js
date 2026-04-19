const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabase() {
    console.log('🗄️  Testing Database Connection...\n');
    
    try {
        // Try to connect to the database
        console.log('Attempting to connect with these settings:');
        console.log('Host:', process.env.DB_HOST || process.env.MYSQLHOST || 'localhost');
        console.log('Port:', process.env.DB_PORT || process.env.MYSQLPORT || '3306');
        console.log('User:', process.env.DB_USER || process.env.MYSQLUSER || 'root');
        console.log('Database:', process.env.DB_NAME || process.env.MYSQLDATABASE || 'construction_db');
        console.log('');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
            port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
            user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
            password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
            database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'construction_db'
        });
        
        console.log('✅ Database connection successful!\n');
        
        // Check if users table exists
        const [tables] = await connection.query('SHOW TABLES LIKE "users"');
        if (tables.length === 0) {
            console.log('❌ Users table does not exist!');
            await connection.end();
            return;
        }
        console.log('✅ Users table exists\n');
        
        // Check admin user
        const [users] = await connection.query(
            'SELECT id, email, name, role, is_approved, is_active FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );
        
        if (users.length === 0) {
            console.log('❌ Admin user not found in database!');
            console.log('You need to create the admin user first.');
        } else {
            console.log('✅ Admin user found:');
            console.log(users[0]);
            console.log('');
            
            // Check password hash
            const bcrypt = require('bcrypt');
            const testPassword = 'admin123';
            const isValid = await bcrypt.compare(testPassword, users[0].password);
            console.log('Password "admin123" valid:', isValid ? '✅ YES' : '❌ NO');
        }
        
        await connection.end();
        
    } catch (error) {
        console.log('❌ Database connection failed!');
        console.log('Error:', error.message);
        console.log('\nThis is likely the issue - the backend cannot connect to the database.');
    }
}

testDatabase();
