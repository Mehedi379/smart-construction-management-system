// Check admin account
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAdminAccount() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'construction_db'
    });

    console.log('\n🔍 Checking Admin Account...\n');

    // Check if admin exists
    const [users] = await conn.query(
        'SELECT id, name, email, role, is_approved, is_active, status FROM users WHERE email = ?',
        ['admin@khazabilkis.com']
    );

    if (users.length === 0) {
        console.log('❌ Admin account NOT FOUND!');
        console.log('\n📝 Creating admin account...\n');

        // Create admin account
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        const [result] = await conn.query(
            `INSERT INTO users (name, email, password, phone, role, is_approved, is_active, status)
             VALUES ('System Admin', 'admin@khazabilkis.com', ?, '+8801700000000', 'admin', TRUE, TRUE, 'active')`,
            [hashedPassword]
        );

        console.log('✅ Admin account created!');
        console.log('   ID:', result.insertId);
        console.log('   Email: admin@khazabilkis.com');
        console.log('   Password: 123456');
        console.log('   Role: admin\n');
    } else {
        console.log('✅ Admin account EXISTS:');
        console.log('   ID:', users[0].id);
        console.log('   Name:', users[0].name);
        console.log('   Email:', users[0].email);
        console.log('   Role:', users[0].role);
        console.log('   Approved:', users[0].is_approved);
        console.log('   Active:', users[0].is_active);
        console.log('   Status:', users[0].status);

        // Test password
        const [passwordCheck] = await conn.query(
            'SELECT password FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );

        const isPasswordCorrect = await bcrypt.compare('123456', passwordCheck[0].password);
        
        console.log('\n🔐 Password Check:');
        if (isPasswordCorrect) {
            console.log('   ✅ Password "123456" is CORRECT');
        } else {
            console.log('   ❌ Password "123456" is WRONG');
            console.log('\n📝 Resetting password to 123456...\n');
            
            const newHashedPassword = await bcrypt.hash('123456', 10);
            await conn.query(
                'UPDATE users SET password = ? WHERE email = ?',
                [newHashedPassword, 'admin@khazabilkis.com']
            );
            
            console.log('   ✅ Password reset to: 123456\n');
        }
    }

    // Show all users
    const [allUsers] = await conn.query(
        'SELECT id, email, role, is_approved FROM users ORDER BY id'
    );

    console.log('\n👥 All Users in Database:');
    console.log('   ' + '-'.repeat(60));
    allUsers.forEach(user => {
        console.log(`   ${user.id}. ${user.email} (${user.role}) - Approved: ${user.is_approved}`);
    });
    console.log('   ' + '-'.repeat(60));
    console.log(`   Total: ${allUsers.length} users\n`);

    await conn.end();
}

checkAdminAccount().catch(console.error);
