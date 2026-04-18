const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('\n🔧 Updating Office Role Accounts...\n');

    await conn.query('UPDATE users SET role=? WHERE email=?', ['head_office_accounts_1', 'accounts.head1@khazabilkis.com']);
    await conn.query('UPDATE users SET role=? WHERE email=?', ['head_office_accounts_2', 'accounts.head2@khazabilkis.com']);
    await conn.query('UPDATE users SET role=? WHERE email=?', ['deputy_head_office', 'deputy.head@khazabilkis.com']);

    console.log('✅ Roles updated!\n');

    const [users] = await conn.query('SELECT id, email, role FROM users WHERE id IN (14, 15, 16)');
    users.forEach(u => console.log(`  ${u.id}. ${u.email} → ${u.role}`));

    console.log('\n✅ Done!\n');
    await conn.end();
})();
