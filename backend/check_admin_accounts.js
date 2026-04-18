const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    const [users] = await conn.query(
        'SELECT id, name, email, role, is_approved, is_active FROM users WHERE role = "admin" ORDER BY id'
    );

    console.log('\n' + '='.repeat(70));
    console.log('👑 ADMIN ACCOUNTS IN DATABASE');
    console.log('='.repeat(70) + '\n');

    if (users.length === 0) {
        console.log('❌ No admin accounts found!\n');
        console.log('💡 Creating default admin account...\n');
        
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        await conn.query(
            `INSERT INTO users (name, email, password, role, is_approved, is_active, created_at)
             VALUES ('System Admin', 'admin@khazabilkis.com', ?, 'admin', 1, 1, NOW())`,
            [hashedPassword]
        );
        
        console.log('✅ Admin account created successfully!\n');
        console.log('📋 Login Credentials:');
        console.log('   Email: admin@khazabilkis.com');
        console.log('   Password: 123456\n');
    } else {
        console.log(`Found ${users.length} admin account(s):\n`);
        
        users.forEach((u, index) => {
            console.log(`${index + 1}. ${u.name}`);
            console.log(`   Email: ${u.email}`);
            console.log(`   Role: ${u.role}`);
            console.log(`   Approved: ${u.is_approved ? 'Yes ✅' : 'No ❌'}`);
            console.log(`   Active: ${u.is_active ? 'Yes ✅' : 'No ❌'}`);
            console.log('');
        });
        
        console.log('💡 Try logging in with any of these accounts');
        console.log('   Password: 123456 (or the password you set)\n');
    }

    console.log('='.repeat(70) + '\n');

    await conn.end();
})();
