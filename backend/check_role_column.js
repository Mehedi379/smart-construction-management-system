const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('\n📋 Checking role column type:\n');
    const [cols] = await conn.query('SHOW FULL COLUMNS FROM users WHERE Field="role"');
    console.log(JSON.stringify(cols, null, 2));
    
    console.log('\n🔧 Trying direct SQL update...\n');
    await conn.query('UPDATE users SET role = ? WHERE id = 14', ['head_office_accounts_1']);
    await conn.query('UPDATE users SET role = ? WHERE id = 15', ['head_office_accounts_2']);
    await conn.query('UPDATE users SET role = ? WHERE id = 16', ['deputy_head_office']);
    
    const [users] = await conn.query('SELECT id, email, role, LENGTH(role) as role_length FROM users WHERE id IN (14, 15, 16)');
    console.log('After update:');
    users.forEach(u => console.log(`  ${u.id}. ${u.email} | role: "${u.role}" | length: ${u.role_length}`));
    
    console.log('\n');
    await conn.end();
})();
