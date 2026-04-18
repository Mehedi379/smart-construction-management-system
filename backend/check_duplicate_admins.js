require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDuplicateAdmins() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });
        
        console.log('========================================');
        console.log('🔍 CHECKING FOR DUPLICATE ADMIN ACCOUNTS');
        console.log('========================================\n');

        // Check all admin users
        const [admins] = await connection.query(
            'SELECT id, name, email, role, is_active, is_approved, created_at FROM users WHERE role = "admin" ORDER BY id'
        );

        console.log(`📊 Total admin accounts found: ${admins.length}\n`);
        
        if (admins.length === 0) {
            console.log('❌ No admin accounts found!');
        } else if (admins.length === 1) {
            console.log('✅ Only ONE admin account found (this is correct)\n');
            console.log('Admin Details:');
            console.log(`   ID: ${admins[0].id}`);
            console.log(`   Name: ${admins[0].name}`);
            console.log(`   Email: ${admins[0].email}`);
            console.log(`   Active: ${admins[0].is_active ? 'Yes ✓' : 'No ✗'}`);
            console.log(`   Approved: ${admins[0].is_approved ? 'Yes ✓' : 'No ✗'}`);
            console.log(`   Created: ${admins[0].created_at}`);
        } else {
            console.log('⚠️  MULTIPLE admin accounts found! (Possible duplicates)\n');
            console.log('Admin Accounts:');
            admins.forEach((admin, index) => {
                console.log(`\n${index + 1}. Admin #${admin.id}:`);
                console.log(`   Name: ${admin.name}`);
                console.log(`   Email: ${admin.email}`);
                console.log(`   Active: ${admin.is_active ? 'Yes ✓' : 'No ✗'}`);
                console.log(`   Approved: ${admin.is_approved ? 'Yes ✓' : 'No ✗'}`);
                console.log(`   Created: ${admin.created_at}`);
            });
            
            console.log('\n\n🔧 RECOMMENDATION:');
            console.log('   Keep only ONE admin account and remove duplicates');
            console.log('   The oldest account (lowest ID) is usually the original one\n');
        }

        // Check for any users with admin-like emails
        console.log('\n📧 Checking for admin-like email addresses:');
        const [adminEmails] = await connection.query(
            'SELECT id, name, email, role FROM users WHERE email LIKE "%admin%" ORDER BY id'
        );
        
        if (adminEmails.length > 0) {
            adminEmails.forEach(user => {
                console.log(`   - ${user.email} (${user.role}) - ${user.name}`);
            });
        } else {
            console.log('   No admin-like email addresses found');
        }

        // Check users table structure
        console.log('\n📋 Users table columns:');
        const [columns] = await connection.query('SHOW COLUMNS FROM users');
        columns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type})`);
        });

        console.log('\n========================================');
        console.log('✅ ADMIN CHECK COMPLETE');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) await connection.end();
    }
}

checkDuplicateAdmins();