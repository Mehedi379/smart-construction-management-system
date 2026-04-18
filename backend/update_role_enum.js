const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('\n🔧 Updating role ENUM column...\n');

    // Update ENUM to include new roles
    await conn.query(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM(
            'admin',
            'accountant',
            'engineer',
            'viewer',
            'employee',
            'manager',
            'director',
            'deputy_director',
            'site_manager',
            'site_engineer',
            'site_director',
            'head_office_accounts_1',
            'head_office_accounts_2',
            'deputy_head_office'
        ) DEFAULT 'employee'
    `);

    console.log('✅ ENUM updated!\n');

    // Now update the roles
    await conn.query('UPDATE users SET role = ? WHERE id = 14', ['head_office_accounts_1']);
    await conn.query('UPDATE users SET role = ? WHERE id = 15', ['head_office_accounts_2']);
    await conn.query('UPDATE users SET role = ? WHERE id = 16', ['deputy_head_office']);

    console.log('✅ Roles assigned!\n');

    // Verify
    const [users] = await conn.query('SELECT id, email, role FROM users WHERE id IN (14, 15, 16)');
    console.log('Updated accounts:');
    users.forEach(u => console.log(`  ${u.id}. ${u.email} → ${u.role}`));

    console.log('\n✅ All fixed!\n');
    await conn.end();
})();
