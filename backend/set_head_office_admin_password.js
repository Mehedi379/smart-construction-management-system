// ============================================
// SET HEAD OFFICE ADMIN PASSWORD
// Smart Construction Management System
// ============================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setAdminPassword() {
    let connection;
    
    try {
        console.log('\n' + '='.repeat(80));
        console.log('🔐 SETTING HEAD OFFICE ADMIN PASSWORD');
        console.log('='.repeat(80) + '\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected to database\n');

        // Check if head_office_admin user exists
        const [users] = await connection.query(
            `SELECT id, name, email, role FROM users WHERE role = 'head_office_admin'`
        );

        if (users.length === 0) {
            console.log('❌ No head_office_admin user found!');
            console.log('   Please run the migration script first: node backend/apply_all_fixes.js\n');
            return;
        }

        const adminUser = users[0];
        console.log(`👤 Found user: ${adminUser.name} (${adminUser.email})`);
        console.log(`   User ID: ${adminUser.id}\n`);

        // Generate password
        const password = 'headofficeadmin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('🔑 Setting password...');
        
        await connection.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, adminUser.id]
        );

        console.log('✅ Password updated successfully!\n');

        console.log('='.repeat(80));
        console.log('📋 LOGIN CREDENTIALS');
        console.log('='.repeat(80) + '\n');
        console.log(`Email: ${adminUser.email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: ${adminUser.role}`);
        console.log('\n⚠️ Please change this password after first login!\n');

        console.log('='.repeat(80));
        console.log('✅ PASSWORD SETUP COMPLETE');
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setAdminPassword();
