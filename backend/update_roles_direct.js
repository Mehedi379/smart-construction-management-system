const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('\n📋 Current users table data:\n');
    
    const [users] = await conn.query('SELECT id, email, role FROM users WHERE id IN (14, 15, 16)');
    console.log('Before update:');
    users.forEach(u => console.log(`  ${u.id}. ${u.email} | role: "${u.role}"`));
    
    console.log('\n🔧 Updating roles...\n');
    
    const result1 = await conn.query('UPDATE users SET role="head_office_accounts_1" WHERE id=14');
    console.log(`Update 14: ${result1[0].affectedRows} rows affected`);
    
    const result2 = await conn.query('UPDATE users SET role="head_office_accounts_2" WHERE id=15');
    console.log(`Update 15: ${result2[0].affectedRows} rows affected`);
    
    const result3 = await conn.query('UPDATE users SET role="deputy_head_office" WHERE id=16');
    console.log(`Update 16: ${result3[0].affectedRows} rows affected`);
    
    console.log('\n✅ After update:');
    const [updatedUsers] = await conn.query('SELECT id, email, role FROM users WHERE id IN (14, 15, 16)');
    updatedUsers.forEach(u => console.log(`  ${u.id}. ${u.email} | role: "${u.role}"`));
    
    console.log('\n');
    await conn.end();
})();
