const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔍 Checking users table schema...\n');
        
        const [columns] = await pool.query('SHOW COLUMNS FROM users');
        const roleColumn = columns.find(c => c.Field === 'role');
        
        console.log('Role column details:');
        console.log(JSON.stringify(roleColumn, null, 2));
        
        console.log('\n🔧 Attempting to fix roles with direct SQL...\n');
        
        // Try direct DELETE and re-INSERT
        await pool.query('DELETE FROM users WHERE email IN ("sitemanager@test.com", "director@test.com", "deputy@test.com")');
        console.log('  ✓ Deleted users with empty roles');
        
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        // Re-insert with correct roles
        await pool.query(
            'INSERT INTO users (name, email, password, phone, role, is_approved, is_active, status) VALUES (?, ?, ?, ?, ?, TRUE, TRUE, "active")',
            ['Site Manager', 'sitemanager@test.com', hashedPassword, '+8801XXXXXXXXX', 'manager']
        );
        console.log('  ✓ Re-created Site Manager');
        
        await pool.query(
            'INSERT INTO users (name, email, password, phone, role, is_approved, is_active, status) VALUES (?, ?, ?, ?, ?, TRUE, TRUE, "active")',
            ['Project Director', 'director@test.com', hashedPassword, '+8801XXXXXXXXX', 'director']
        );
        console.log('  ✓ Re-created Project Director');
        
        await pool.query(
            'INSERT INTO users (name, email, password, phone, role, is_approved, is_active, status) VALUES (?, ?, ?, ?, ?, TRUE, TRUE, "active")',
            ['Deputy Director', 'deputy@test.com', hashedPassword, '+8801XXXXXXXXX', 'deputy_director']
        );
        console.log('  ✓ Re-created Deputy Director');
        
        // Update employee records with project assignment
        const adminResult = await pool.query('SELECT id FROM users WHERE email = "admin@test.com"');
        const adminId = adminResult[0][0].id;
        const projectResult = await pool.query('SELECT id FROM projects LIMIT 1');
        const projectId = projectResult[0][0].id;
        
        const newUsers = await pool.query('SELECT id, email FROM users WHERE email IN ("sitemanager@test.com", "director@test.com", "deputy@test.com")');
        
        for (const user of newUsers[0]) {
            const emailParts = user.email.split('@');
            const designation = emailParts[0].replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const employeeId = `EMP${String(user.id).padStart(4, '0')}`;
            
            await pool.query(
                'INSERT INTO employees (user_id, employee_id, name, phone, designation, category, department, assigned_project_id, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "active", ?)',
                [user.id, employeeId, designation, '+8801XXXXXXXXX', designation, 'Management', 'Management', projectId, adminId]
            );
            console.log(`  ✓ Created employee record for ${user.email}`);
        }
        
        console.log('\n✅ All roles fixed successfully!\n');
        
        // Final verification
        const [users] = await pool.query('SELECT id, email, role FROM users ORDER BY id');
        console.log('📋 Final User List:');
        users.forEach(u => {
            console.log(`  ${u.id}. ${u.email} → ${u.role}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
})();
