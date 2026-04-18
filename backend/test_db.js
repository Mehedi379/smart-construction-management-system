const mysql = require('mysql2/promise');

async function testDB() {
    try {
        console.log('Testing MySQL connection...');
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });
        console.log('✓ MySQL Connected!');
        
        const [dbs] = await conn.query('SHOW DATABASES LIKE "construction_db"');
        console.log('✓ Database exists:', dbs.length > 0);
        
        if (dbs.length > 0) {
            await conn.query('USE construction_db');
            const [users] = await conn.query('SELECT COUNT(*) as count FROM users');
            console.log('✓ Users count:', users[0].count);
            
            const [admins] = await conn.query('SELECT id, name, email, role FROM users WHERE role = "admin"');
            console.log('✓ Admin users:', admins);
        }
        
        await conn.end();
        console.log('\n✅ All tests passed!');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testDB();
