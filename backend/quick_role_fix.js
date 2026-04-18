const mysql = require('mysql2/promise');
require('dotenv').config();

async function quickRoleFix() {
    console.log('\n⚡ QUICK ROLE FIX...\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        // Fix all empty or 'employee' roles to 'viewer'
        console.log('🔧 Setting all employee/empty roles to viewer...');
        const [result] = await connection.query(
            `UPDATE users 
             SET role = 'viewer' 
             WHERE role = 'employee' OR role = '' OR role IS NULL`
        );
        
        console.log(`✅ Updated ${result.affectedRows} users to 'viewer' role\n`);

        // Show final result
        console.log('📋 Final user roles:');
        const [users] = await connection.query(
            'SELECT id, email, name, role FROM users ORDER BY id ASC'
        );
        console.table(users);
        console.log('');

        console.log('========================================');
        console.log('✅ ALL ROLES FIXED');
        console.log('========================================\n');

        console.log('🎯 Role Summary:');
        users.forEach(u => {
            const icon = u.role === 'admin' ? '👑' : 
                        u.role === 'accountant' ? '👨‍💼' : 
                        u.role === 'engineer' ? '👷' : '👀';
            console.log(`   ${icon} ${u.email} → ${u.role}`);
        });
        console.log('');

        console.log('🚀 Now you can:');
        console.log('   1. Logout');
        console.log('   2. Login with any account');
        console.log('   3. See correct role dashboard\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

quickRoleFix();
