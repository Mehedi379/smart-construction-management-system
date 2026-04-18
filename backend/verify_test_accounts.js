const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    const [users] = await conn.query(
        'SELECT id, name, email, role, is_approved, is_active FROM users WHERE email LIKE ? ORDER BY id',
        ['%@test.com']
    );

    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           TEST ACCOUNTS VERIFICATION                    ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log('✅ ACTIVE TEST ACCOUNTS:\n');

    users.forEach(u => {
        const status = u.is_approved && u.is_active ? '✅ ACTIVE' : '❌ INACTIVE';
        console.log(`${status} | ${u.role.padEnd(20)} | ${u.email}`);
    });

    console.log(`\n📊 Total: ${users.length} test accounts\n`);

    await conn.end();
})();
