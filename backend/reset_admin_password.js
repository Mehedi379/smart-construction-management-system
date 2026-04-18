const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    console.log('\n' + '='.repeat(70));
    console.log('🔧 RESETTING ADMIN PASSWORDS');
    console.log('='.repeat(70) + '\n');

    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const adminEmails = [
        'admin@test.com',
        'admin@khazabilkis.com'
    ];

    for (const email of adminEmails) {
        console.log(`Updating: ${email}`);
        
        const [result] = await conn.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        if (result.affectedRows > 0) {
            console.log(`   ✅ Password updated successfully!\n`);
        } else {
            console.log(`   ⚠️  Account not found\n`);
        }
    }

    console.log('='.repeat(70));
    console.log('✅ ALL ADMIN PASSWORDS RESET');
    console.log('='.repeat(70) + '\n');

    console.log('📋 Login Credentials:');
    console.log('   Option 1:');
    console.log('   Email: admin@test.com');
    console.log('   Password: 123456\n');
    
    console.log('   Option 2:');
    console.log('   Email: admin@khazabilkis.com');
    console.log('   Password: 123456\n');

    console.log('🌐 Login URL: http://localhost:3000/login\n');

    await conn.end();
})();
