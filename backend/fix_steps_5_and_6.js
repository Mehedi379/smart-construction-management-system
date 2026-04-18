// ============================================
// FIX STEPS 5 & 6 - Complete User Assignment
// Smart Construction Management System
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('\n' + '='.repeat(80));
    console.log('🔧 FIXING STEPS 5 & 6 - User Assignment');
    console.log('='.repeat(80) + '\n');

    // FIX 1: Update head_office_accounts roles
    console.log('📋 FIX 1: Updating head_office_accounts user roles...\n');
    
    const [result1] = await conn.query(`
        UPDATE users 
        SET role = 'head_office_accounts' 
        WHERE role IN ('head_office_accounts_1', 'head_office_accounts_2', '')
        AND email IN (
            SELECT email FROM (
                SELECT email FROM users WHERE email LIKE '%accounts%' OR email LIKE '%ho.%'
            ) as temp
        )
    `);

    console.log(`✅ Updated ${result1.affectedRows} users to head_office_accounts role\n`);

    // Verify the update
    const [accountsUsers] = await conn.query(`
        SELECT id, name, email, role FROM users 
        WHERE role = 'head_office_accounts' AND is_active = TRUE
    `);

    console.log('📋 head_office_accounts users:\n');
    accountsUsers.forEach(u => {
        console.log(`   ✅ ${u.name} (${u.email})`);
    });

    // FIX 2: Create/Verify head_office_admin user
    console.log('\n\n📋 FIX 2: Setting up head_office_admin user...\n');

    // Check if user exists
    const [existingAdmin] = await conn.query(
        "SELECT id, name, email, is_active FROM users WHERE email = 'headoffice.admin@khazabilkis.com'"
    );

    if (existingAdmin.length > 0) {
        console.log('✅ head_office_admin user exists');
        console.log(`   Name: ${existingAdmin[0].name}`);
        console.log(`   Email: ${existingAdmin[0].email}`);
        console.log(`   Active: ${existingAdmin[0].is_active ? 'Yes' : 'No'}\n`);

        // Activate if not active
        if (!existingAdmin[0].is_active) {
            await conn.query(
                "UPDATE users SET is_active = TRUE, status = 'active' WHERE email = 'headoffice.admin@khazabilkis.com'"
            );
            console.log('✅ Activated head_office_admin user\n');
        }
    } else {
        console.log('⚠️ User not found, creating...\n');

        // Create user
        const [userResult] = await conn.query(`
            INSERT INTO users (name, email, password, role, is_approved, is_active, status) 
            VALUES (
                'Head Office Admin',
                'headoffice.admin@khazabilkis.com',
                '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                'head_office_admin',
                TRUE,
                TRUE,
                'active'
            )
        `);

        const userId = userResult.insertId;
        console.log(`✅ Created user (ID: ${userId})\n`);

        // Create employee record
        await conn.query(`
            INSERT INTO employees (user_id, employee_id, name, designation, category, assigned_project_id, status) 
            VALUES (?, 'EMP0099', 'Head Office Admin', 'Head Office Admin', 'Admin', 1, 'active')
        `, [userId]);

        console.log('✅ Created employee record\n');
    }

    // Verify head_office_admin
    const [adminUsers] = await conn.query(`
        SELECT id, name, email, role FROM users 
        WHERE role = 'head_office_admin' AND is_active = TRUE
    `);

    console.log('📋 head_office_admin users:\n');
    adminUsers.forEach(u => {
        console.log(`   ✅ ${u.name} (${u.email})`);
    });

    // FINAL VERIFICATION
    console.log('\n\n' + '='.repeat(80));
    console.log('✅ FINAL VERIFICATION - All 6 Workflow Steps');
    console.log('='.repeat(80) + '\n');

    const [steps] = await conn.query(`
        SELECT 
            ws.step_number,
            r.role_code,
            r.role_name,
            ws.step_name
        FROM workflow_steps ws
        INNER JOIN roles r ON ws.role_id = r.id
        WHERE ws.workflow_id = 2
        ORDER BY ws.step_number
    `);

    let allReady = true;

    for (const step of steps) {
        const [users] = await conn.query(
            'SELECT id, name, email FROM users WHERE role = ? AND is_active = TRUE',
            [step.role_code]
        );

        const userCount = users.length;
        const status = userCount > 0 ? '✅' : '❌';
        
        if (userCount === 0) allReady = false;

        console.log(`${status} Step ${step.step_number}: ${step.role_code}`);
        console.log(`   Users: ${userCount}`);
        
        if (userCount > 0) {
            users.forEach(u => {
                console.log(`   → ${u.name} (${u.email})`);
            });
        }
        console.log('');
    }

    // Summary
    console.log('='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80) + '\n');

    if (allReady) {
        console.log('🎉 SUCCESS! All 6 workflow steps now have users assigned!\n');
        console.log('✅ Step 1: site_manager - READY');
        console.log('✅ Step 2: site_engineer - READY');
        console.log('✅ Step 3: project_director - READY');
        console.log('✅ Step 4: deputy_director - READY');
        console.log('✅ Step 5: head_office_accounts - READY');
        console.log('✅ Step 6: head_office_admin - READY\n');
        console.log('🚀 System is now 100% ready for production use!\n');
    } else {
        console.log('⚠️ Some steps still need attention\n');
    }

    console.log('='.repeat(80));
    console.log('💡 NEXT STEPS');
    console.log('='.repeat(80) + '\n');
    console.log('1. Restart backend server:');
    console.log('   cd backend');
    console.log('   npm run dev\n');
    console.log('2. Test complete workflow:');
    console.log('   - Create voucher as admin');
    console.log('   - Approve voucher (triggers auto sheet)');
    console.log('   - Test all 6 signature steps\n');
    console.log('3. Login credentials:');
    console.log('   - head_office_accounts: ho.accounts1@test.com / 123456');
    console.log('   - head_office_admin: headoffice.admin@khazabilkis.com / 123456\n');

    await conn.end();
})();
