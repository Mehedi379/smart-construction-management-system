const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('\n🔧 Fixing ENUM to include head_office_accounts and head_office_admin...\n');

    // Update the ENUM to include missing roles
    await conn.query(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM(
            'admin',
            'head_office_accounts',
            'head_office_admin',
            'head_office_accounts_1',
            'head_office_accounts_2',
            'deputy_head_office',
            'site_manager',
            'site_engineer',
            'site_director',
            'deputy_director',
            'project_director',
            'engineer',
            'accountant',
            'employee'
        ) DEFAULT 'employee'
    `);

    console.log('✅ ENUM updated successfully\n');

    // Verify the ENUM
    const [columns] = await conn.query(`
        SHOW COLUMNS FROM users WHERE Field = 'role'
    `);
    
    console.log('New ENUM values:');
    console.log(`  ${columns[0].Type}\n`);

    // Now update the roles
    console.log('🔄 Updating user roles...\n');
    
    const [result1] = await conn.query(`
        UPDATE users 
        SET role = 'head_office_accounts' 
        WHERE email IN ('ho.accounts1@test.com', 'ho.accounts2@test.com')
    `);
    console.log(`✅ Updated ${result1.affectedRows} users to head_office_accounts`);

    const [result2] = await conn.query(`
        UPDATE users 
        SET role = 'head_office_admin' 
        WHERE email = 'headoffice.admin@khazabilkis.com'
    `);
    console.log(`✅ Updated ${result2.affectedRows} users to head_office_admin\n`);

    // Verify
    const [verify] = await conn.query(`
        SELECT id, name, email, role 
        FROM users 
        WHERE email IN ('ho.accounts1@test.com', 'ho.accounts2@test.com', 'headoffice.admin@khazabilkis.com')
    `);

    console.log('📋 Verification:\n');
    verify.forEach(u => {
        console.log(`  ✅ ${u.email} => role: '${u.role}'`);
    });

    // Final workflow status
    console.log('\n📊 Complete Workflow Status:\n');
    
    const workflowSteps = [
        { step: 1, role: 'site_manager' },
        { step: 2, role: 'site_engineer' },
        { step: 3, role: 'project_director' },
        { step: 4, role: 'deputy_director' },
        { step: 5, role: 'head_office_accounts' },
        { step: 6, role: 'head_office_admin' }
    ];

    let allReady = true;

    for (const ws of workflowSteps) {
        const [count] = await conn.query(
            'SELECT COUNT(*) as c FROM users WHERE role = ? AND is_active = TRUE',
            [ws.role]
        );
        
        const status = count[0].c > 0 ? '✅' : '❌';
        if (count[0].c === 0) allReady = false;
        
        console.log(`   ${status} Step ${ws.step}: ${ws.role} - ${count[0].c} user(s)`);
    }

    console.log('');
    if (allReady) {
        console.log('🎉 SUCCESS! All 6 workflow steps now have users!\n');
    }

    await conn.end();
})();
