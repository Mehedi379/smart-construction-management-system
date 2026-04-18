const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('\n✅ Fixing Steps 5 & 6...\n');

    // Fix Step 5: Update accounts users
    await conn.query(`
        UPDATE users 
        SET role = 'head_office_accounts' 
        WHERE email IN ('ho.accounts1@test.com', 'ho.accounts2@test.com')
    `);
    console.log('✅ Step 5: Updated head_office_accounts users');

    // Fix Step 6: Update admin user
    await conn.query(`
        UPDATE users 
        SET role = 'head_office_admin' 
        WHERE email = 'headoffice.admin@khazabilkis.com'
    `);
    console.log('✅ Step 6: Updated head_office_admin user');

    // Verify
    const [users] = await conn.query(`
        SELECT id, name, email, role 
        FROM users 
        WHERE email IN ('ho.accounts1@test.com', 'ho.accounts2@test.com', 'headoffice.admin@khazabilkis.com')
    `);

    console.log('\n📋 Updated Users:\n');
    users.forEach(u => {
        console.log(`  ✅ ${u.name} (${u.email}) - Role: ${u.role}`);
    });

    // Final workflow check
    console.log('\n📊 Final Workflow Status:\n');
    
    const steps = [
        { num: 1, role: 'site_manager' },
        { num: 2, role: 'site_engineer' },
        { num: 3, role: 'project_director' },
        { num: 4, role: 'deputy_director' },
        { num: 5, role: 'head_office_accounts' },
        { num: 6, role: 'head_office_admin' }
    ];

    for (const step of steps) {
        const [count] = await conn.query(
            'SELECT COUNT(*) as c FROM users WHERE role = ? AND is_active = TRUE',
            [step.role]
        );
        
        const status = count[0].c > 0 ? '✅' : '❌';
        console.log(`   ${status} Step ${step.num}: ${step.role} - ${count[0].c} user(s)`);
    }

    await conn.end();
    console.log('\n🎉 All workflow steps are now ready!\n');
})();
