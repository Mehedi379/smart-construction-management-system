const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAndFixEnum() {
    console.log('\n🔍 CHECKING USERS TABLE SCHEMA...\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        // Check table structure
        console.log('📋 Users table structure:');
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM users LIKE 'role'
        `);
        
        console.table(columns);
        console.log('');

        // Alter table to include 'viewer' in ENUM
        console.log('🔧 Adding viewer to role ENUM...');
        await connection.query(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('admin', 'accountant', 'engineer', 'viewer', 'employee') 
            DEFAULT 'viewer'
        `);
        console.log('✅ Role ENUM updated!\n');

        // Now update the roles
        console.log('🔧 Updating user roles...');
        await connection.query(`UPDATE users SET role = 'viewer' WHERE role = '' OR role IS NULL`);
        console.log('✅ Empty roles set to viewer!\n');

        // Verify
        console.log('📋 Final user roles:');
        const [users] = await connection.query(
            'SELECT id, email, name, role FROM users ORDER BY id ASC'
        );
        
        console.table(users);
        console.log('');

        console.log('========================================');
        console.log('✅ ALL FIXED!');
        console.log('========================================\n');

        console.log('🎯 Role Summary:');
        users.forEach(u => {
            const icon = u.role === 'admin' ? '👑' : 
                        u.role === 'accountant' ? '👨‍💼' : 
                        u.role === 'engineer' ? '👷' : '👀';
            console.log(`   ${icon} ${u.email} → ${u.role}`);
        });
        console.log('');

        console.log('🚀 NOW LOGIN AGAIN!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) await connection.end();
    }
}

checkAndFixEnum();
