const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    
    console.log('\n📋 All Users in Database:\n');
    const [users] = await conn.query('SELECT id, name, email, role FROM users ORDER BY id');
    
    users.forEach(u => {
        console.log(`   ID: ${u.id} | ${u.name} | ${u.email} | Role: ${u.role || '(empty)'}`);
    });
    
    console.log(`\n   Total: ${users.length} users\n`);
    
    await conn.end();
})();
