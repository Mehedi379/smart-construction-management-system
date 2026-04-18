const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createDeputyDirectorAccount() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n' + '='.repeat(70));
        console.log('🔧 CREATING DEPUTY DIRECTOR ACCOUNT');
        console.log('='.repeat(70) + '\n');

        // Account details
        const accountData = {
            name: 'Deputy Director',
            email: 'deputy.director@khazabilkis.com',
            phone: '+880-1234567890',
            role: 'deputy_director',
            password: 'deputy123',
            is_approved: true,
            is_active: true
        };

        console.log('📝 Account Details:');
        console.log('   ' + '-'.repeat(50));
        console.log(`   👤 Name: ${accountData.name}`);
        console.log(`   📧 Email: ${accountData.email}`);
        console.log(`   📱 Phone: ${accountData.phone}`);
        console.log(`   👔 Role: ${accountData.role}`);
        console.log(`   🔑 Password: ${accountData.password}`);
        console.log(`   ✅ Approved: Yes`);
        console.log(`   🟢 Active: Yes`);
        console.log('');

        // Check if email already exists
        const [existing] = await connection.query(
            'SELECT id, email FROM users WHERE email = ?',
            [accountData.email]
        );

        if (existing.length > 0) {
            console.log('⚠️  Email already exists!');
            console.log(`   User ID: ${existing[0].id}`);
            console.log(`   Email: ${existing[0].email}`);
            console.log('\n💡 Account already exists. You can login with these credentials.\n');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(accountData.password, 10);
        console.log('🔒 Password hashed successfully\n');

        // Insert user
        const [result] = await connection.query(
            `INSERT INTO users 
            (name, email, phone, role, password, is_approved, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                accountData.name,
                accountData.email,
                accountData.phone,
                accountData.role,
                hashedPassword,
                accountData.is_approved,
                accountData.is_active
            ]
        );

        const userId = result.insertId;
        console.log('✅ Deputy Director account created successfully!\n');
        console.log('='.repeat(70));
        console.log('📋 LOGIN CREDENTIALS:');
        console.log('='.repeat(70));
        console.log(`   🌐 Login URL: http://localhost:5173/login`);
        console.log(`   📧 Email: ${accountData.email}`);
        console.log(`   🔑 Password: ${accountData.password}`);
        console.log(`   👤 User ID: ${userId}`);
        console.log('='.repeat(70) + '\n');

        console.log('🎯 What Deputy Director Can Do:');
        console.log('   ✅ Login to the system');
        console.log('   ✅ Receive signature requests (Checked By role)');
        console.log('   ✅ View pending signature requests on dashboard');
        console.log('   ✅ Sign daily sheets when requested');
        console.log('   ✅ Track signature workflow status');
        console.log('   ✅ View assigned projects');
        console.log('');

        console.log('📝 Next Steps:');
        console.log('   1. Refresh your browser');
        console.log('   2. Go to login page');
        console.log('   3. Login with above credentials');
        console.log('   4. Go to Daily Sheets page');
        console.log('   5. Click "View" on any sheet');
        console.log('   6. Scroll to "Signature Requests" section');
        console.log('   7. Click "Send Request" for Deputy Director role');
        console.log('   8. Login as Deputy Director to see the request');
        console.log('');

        // Verify account was created
        const [verify] = await connection.query(
            'SELECT id, name, email, role, is_approved, is_active FROM users WHERE id = ?',
            [userId]
        );

        if (verify.length > 0) {
            console.log('✅ Account verification successful!');
            console.log(`   ID: ${verify[0].id}`);
            console.log(`   Name: ${verify[0].name}`);
            console.log(`   Email: ${verify[0].email}`);
            console.log(`   Role: ${verify[0].role}`);
            console.log(`   Approved: ${verify[0].is_approved ? 'Yes' : 'No'}`);
            console.log(`   Active: ${verify[0].is_active ? 'Yes' : 'No'}`);
            console.log('');
        }

        console.log('='.repeat(70));
        console.log('✅ DEPUTY DIRECTOR ACCOUNT CREATION COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Failed to create account:', error.message);
        console.error('   Error code:', error.code);
        if (error.sql) {
            console.error('   SQL:', error.sql);
        }
    } finally {
        if (connection) await connection.end();
    }
}

createDeputyDirectorAccount();
