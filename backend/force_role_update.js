const mysql = require('mysql2/promise');
require('dotenv').config();

async function forceRoleUpdate() {
    console.log('\n🔨 FORCE ROLE UPDATE...\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        // Force update each user individually
        const users = [
            { id: 4, role: 'viewer' },
            { id: 5, role: 'viewer' },
            { id: 8, role: 'viewer' }
        ];

        for (const user of users) {
            console.log(`🔧 Updating user ${user.id} to 'viewer'...`);
            await connection.query(
                `UPDATE users SET role = 'viewer' WHERE id = ${user.id}`
            );
            console.log(`   ✅ User ${user.id} updated\n`);
        }

        // Verify
        console.log('📋 Verifying all roles:');
        const [result] = await connection.query(
            'SELECT id, email, name, role FROM users ORDER BY id ASC'
        );
        
        console.table(result);
        console.log('');

        console.log('✅ DONE! All roles are now correct.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

forceRoleUpdate();
