const mysql = require('mysql2/promise');
require('dotenv').config();

async function assignOfficeRolesToProjects() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'construction_db'
    });

    console.log('\n🎯 ASSIGNING OFFICE ROLES TO SPECIFIC PROJECTS (ID-WISE)\n');

    // Get all office role accounts
    const [officeUsers] = await conn.query(
        `SELECT id, name, email, role 
         FROM users 
         WHERE role IN ('head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office')
         ORDER BY role, id`
    );

    console.log(`Found ${officeUsers.length} office role accounts:\n`);

    // Get all projects
    const [projects] = await conn.query(
        'SELECT id, project_code, project_name FROM projects ORDER BY id'
    );

    console.log('📋 Available Projects:\n');
    projects.forEach(p => {
        console.log(`   ID: ${p.id} | ${p.project_code} - ${p.project_name}`);
    });

    console.log('\n');

    // Assign office accounts to projects (round-robin distribution)
    for (const user of officeUsers) {
        // Find or create employee record
        const [existing] = await conn.query(
            'SELECT id, assigned_project_id FROM employees WHERE user_id = ?',
            [user.id]
        );

        // Assign to first project (or cycle through projects)
        const userIndex = officeUsers.indexOf(user);
        const assignedProjectId = projects[userIndex % projects.length]?.id;

        if (!assignedProjectId) {
            console.log(`⚠️  No projects available for ${user.email}`);
            continue;
        }

        if (existing.length > 0) {
            // Update existing employee record
            await conn.query(
                'UPDATE employees SET assigned_project_id = ? WHERE user_id = ?',
                [assignedProjectId, user.id]
            );
            console.log(`✅ Updated: ${user.email} (${user.role}) → Project ${assignedProjectId}`);
        } else {
            // Create new employee record with unique employee_id
            const empId = `OFFICE-${user.role.toUpperCase().substring(0, 10)}-${user.id}`;
            await conn.query(
                `INSERT INTO employees (
                    employee_id, name, email, phone, designation, department, 
                    assigned_project_id, user_id, status
                ) VALUES (?, ?, ?, '', ?, 'Office', ?, ?, 'active')`,
                [empId, user.name, user.email, user.role.replace(/_/g, ' ').toUpperCase(), assignedProjectId, user.id]
            );
            console.log(`✅ Created: ${user.email} (${user.role}) → Project ${assignedProjectId} (ID: ${empId})`);
        }
    }

    // Verify assignments
    console.log('\n📊 FINAL ASSIGNMENTS:\n');
    const [assignments] = await conn.query(
        `SELECT 
            u.name,
            u.email,
            u.role,
            e.assigned_project_id,
            p.project_code,
            p.project_name
         FROM users u
         INNER JOIN employees e ON e.user_id = u.id
         INNER JOIN projects p ON p.id = e.assigned_project_id
         WHERE u.role IN ('head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office')
         ORDER BY u.role`
    );

    assignments.forEach(a => {
        console.log(`   ${a.name} (${a.role})`);
        console.log(`      Email: ${a.email}`);
        console.log(`      Project: ${a.project_code} - ${a.project_name} (ID: ${a.assigned_project_id})\n`);
    });

    console.log('\n✅ Office roles are now ID-WISE! Each account sees only their assigned project.');

    await conn.end();
}

assignOfficeRolesToProjects().catch(console.error);
