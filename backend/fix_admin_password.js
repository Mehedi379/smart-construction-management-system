const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixAdminPassword() {
    try {
        // Connect to database
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'construction_db'
        });

        console.log('✅ Connected to database');

        // Generate new password hash
        const newPassword = 'admin123';
        const hash = bcrypt.hashSync(newPassword, 10);
        
        console.log('🔐 Generated new hash:', hash);

        // Update admin password
        const [result] = await conn.execute(
            'UPDATE users SET password = ?, is_active = 1, is_approved = 1 WHERE email = ?',
            [hash, 'admin@khazabilkis.com']
        );

        console.log('✅ Password updated successfully!');
        console.log('Rows affected:', result.affectedRows);

        // Verify
        const [users] = await conn.execute(
            'SELECT id, name, email, role, is_active, is_approved FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );

        console.log('\n✅ Verification:');
        console.table(users);

        // Test password match
        const match = bcrypt.compareSync(newPassword, hash);
        console.log('\n🔍 Password match test:', match ? '✅ PASS' : '❌ FAIL');

        await conn.end();
        
        console.log('\n🎉 Done! You can now login with:');
        console.log('   Email: admin@khazabilkis.com');
        console.log('   Password: admin123');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

fixAdminPassword();
