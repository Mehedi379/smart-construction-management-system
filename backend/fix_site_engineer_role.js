const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('\n📋 Current roles in database:\n');
    const [roles] = await conn.query('SELECT id, role_code, role_name FROM roles ORDER BY id');
    roles.forEach(r => console.log(`  ${r.id}. ${r.role_code} - ${r.role_name}`));

    // Check if site_engineer exists
    const [siteEngineer] = await conn.query("SELECT id FROM roles WHERE role_code = 'site_engineer'");
    
    if (siteEngineer.length === 0) {
        console.log('\n⚠️ site_engineer role not found in roles table');
        console.log('   But users have role = "site_engineer"');
        console.log('\n📝 Creating site_engineer role...\n');
        
        // Create site_engineer role
        const [result] = await conn.query(`
            INSERT INTO roles (role_code, role_name, description, level, is_system_role, color) 
            VALUES ('site_engineer', 'Site Engineer', 'Site-level engineering role', 3, TRUE, '#10B981')
        `);
        
        console.log(`✅ Created site_engineer role (ID: ${result.insertId})\n`);
    } else {
        console.log('\n✅ site_engineer role exists (ID: ' + siteEngineer[0].id + ')\n');
    }

    // Now update workflow steps
    console.log('🔄 Updating workflow steps...\n');
    await conn.query('DELETE FROM workflow_steps WHERE workflow_id = 2');
    
    await conn.query(`
        INSERT INTO workflow_steps (workflow_id, role_id, step_number, step_name, action_required) 
        VALUES 
        (2, (SELECT id FROM roles WHERE role_code = 'site_manager'), 1, 'Site Manager Verification', 'sign'),
        (2, (SELECT id FROM roles WHERE role_code = 'site_engineer'), 2, 'Site Engineer Approval', 'sign'),
        (2, (SELECT id FROM roles WHERE role_code = 'project_director'), 3, 'Project Director Approval', 'sign'),
        (2, (SELECT id FROM roles WHERE role_code = 'deputy_director'), 4, 'Deputy Director Review', 'sign'),
        (2, (SELECT id FROM roles WHERE role_code = 'head_office_accounts'), 5, 'Head Office Accounts Approval', 'sign'),
        (2, (SELECT id FROM roles WHERE role_code = 'head_office_admin'), 6, 'Head Office Admin Final Approval', 'sign')
    `);

    // Verify
    const [steps] = await conn.query(`
        SELECT ws.step_number, r.role_code, r.role_name, ws.step_name
        FROM workflow_steps ws
        JOIN roles r ON ws.role_id = r.id
        WHERE ws.workflow_id = 2
        ORDER BY ws.step_number
    `);

    console.log('✅ Updated Workflow Steps:\n');
    console.log('   Step | Role Code | Role Name');
    console.log('   ' + '-'.repeat(60));
    steps.forEach(s => {
        console.log(`   ${s.step_number} | ${s.role_code} | ${s.role_name}`);
    });

    // Check users
    console.log('\n📊 User Count per Step:\n');
    for (const step of steps) {
        const [users] = await conn.query(
            'SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = TRUE',
            [step.role_code]
        );
        const status = users[0].count > 0 ? `✅ ${users[0].count} user(s)` : '❌ NO USERS';
        console.log(`   Step ${step.step_number} (${step.role_code}): ${status}`);
    }

    await conn.end();
    console.log('\n✅ Done!\n');
})();
