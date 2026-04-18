const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('\n📋 Checking users with empty or accounts-related roles...\n');
    
    const [users] = await conn.query(`
        SELECT id, name, email, role 
        FROM users 
        WHERE role IN ('head_office_accounts_1', 'head_office_accounts_2', '')
        OR email LIKE '%accounts%'
        OR email LIKE '%ho.%'
    `);

    console.log('Found users:\n');
    users.forEach(u => {
        console.log(`  ${u.id}. ${u.name} (${u.email})`);
        console.log(`     Current role: '${u.role}'\n`);
    });

    // Update users with old roles
    console.log('\n🔧 Updating roles...\n');
    
    const [result] = await conn.query(`
        UPDATE users 
        SET role = 'head_office_accounts'
        WHERE role IN ('head_office_accounts_1', 'head_office_accounts_2')
    `);

    console.log(`✅ Updated ${result.affectedRows} users from old roles\n`);

    // Update users with empty role who have accounts email
    const [result2] = await conn.query(`
        UPDATE users 
        SET role = 'head_office_accounts'
        WHERE role = '' AND (email LIKE '%accounts%' OR email LIKE '%ho.%')
    `);

    console.log(`✅ Updated ${result2.affectedRows} users from empty role\n`);

    // Verify
    const [updated] = await conn.query(`
        SELECT id, name, email, role 
        FROM users 
        WHERE role = 'head_office_accounts'
    `);

    console.log('\n✅ head_office_accounts users:\n');
    updated.forEach(u => {
        console.log(`  ${u.id}. ${u.name} (${u.email}) - role: '${u.role}'\n`);
    });

    // Check head_office_admin
    const [admins] = await conn.query(`
        SELECT id, name, email, role, is_active
        FROM users 
        WHERE role = 'head_office_admin'
    `);

    console.log('\n📋 head_office_admin users:\n');
    if (admins.length === 0) {
        console.log('  ❌ No head_office_admin users found\n');
        
        // Create the user
        console.log('🔧 Creating head_office_admin user...\n');
        const [newUser] = await conn.query(`
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

        const userId = newUser.insertId;
        console.log(`✅ Created user ID: ${userId}\n`);

        // Create employee record
        try {
            await conn.query(`
                INSERT INTO employees (user_id, employee_id, name, designation, category, assigned_project_id, status) 
                VALUES (?, 'EMP0099', 'Head Office Admin', 'Head Office Admin', 'Admin', 1, 'active')
            `, [userId]);
            console.log('✅ Created employee record\n');
        } catch (e) {
            console.log('⚠️ Employee record may already exist\n');
        }
    } else {
        admins.forEach(a => {
            console.log(`  ${a.id}. ${a.name} (${a.email}) - Active: ${a.is_active}\n`);
        });
    }

    await conn.end();
    console.log('✅ Done!\n');
})();
