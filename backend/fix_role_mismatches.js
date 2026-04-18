const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔧 FIXING EMPLOYEE ROLE MISMATCHES...\n');
        
        // Step 1: Show current mismatches
        console.log('📋 Step 1: Finding role mismatches...\n');
        
        const [mismatches] = await pool.query(
            `SELECT 
                e.id,
                e.employee_id,
                e.name,
                e.category,
                e.designation,
                u.role as user_role,
                u.email,
                p.project_name
             FROM employees e
             LEFT JOIN users u ON e.user_id = u.id
             LEFT JOIN projects p ON e.assigned_project_id = p.id
             WHERE e.status = 'active'
             AND (
                 (e.category = 'Site Manager' AND u.role != 'site_manager') OR
                 (e.category = 'Site Engineer' AND u.role != 'site_engineer') OR
                 (e.category = 'Site Director' AND u.role != 'site_director') OR
                 (e.category = 'Accounts' AND u.role != 'accountant') OR
                 (e.category = 'Engineering' AND u.role != 'engineer') OR
                 (e.category = 'Employee' AND u.role != 'employee') OR
                 (e.category = 'Labor' AND u.role != 'employee')
             )
             ORDER BY e.id`
        );
        
        console.log(`Found ${mismatches.length} role mismatches:\n`);
        mismatches.forEach((emp, index) => {
            console.log(`${index + 1}. ${emp.name} (${emp.employee_id})`);
            console.log(`   Category: ${emp.category}`);
            console.log(`   Current Role: ${emp.user_role}`);
            console.log(`   Project: ${emp.project_name || 'N/A'}`);
            console.log('');
        });
        
        // Step 2: Fix the mismatches
        console.log('\n📋 Step 2: Fixing role mismatches...\n');
        
        const roleMapping = {
            'Site Manager': 'site_manager',
            'Site Engineer': 'site_engineer',
            'Site Director': 'site_director',
            'Accounts': 'accountant',
            'Engineering': 'engineer',
            'Employee': 'employee',
            'Labor': 'employee'
        };
        
        let totalFixed = 0;
        
        for (const [category, correctRole] of Object.entries(roleMapping)) {
            const [result] = await pool.query(
                `UPDATE users u
                 INNER JOIN employees e ON u.id = e.user_id
                 SET u.role = ?
                 WHERE e.category = ? 
                 AND u.role != ?
                 AND e.status = 'active'`,
                [correctRole, category, correctRole]
            );
            
            if (result.affectedRows > 0) {
                console.log(`   ✅ Category "${category}" → Role "${correctRole}": ${result.affectedRows} user(s) updated`);
                totalFixed += result.affectedRows;
            }
        }
        
        console.log(`\n   Total roles fixed: ${totalFixed}\n`);
        
        // Step 3: Verify the fix
        console.log('📋 Step 3: Verifying role-category consistency...\n');
        
        const [stillMismatched] = await pool.query(
            `SELECT 
                e.id,
                e.name,
                e.category,
                u.role as user_role
             FROM employees e
             LEFT JOIN users u ON e.user_id = u.id
             WHERE e.status = 'active'
             AND (
                 (e.category = 'Site Manager' AND u.role != 'site_manager') OR
                 (e.category = 'Site Engineer' AND u.role != 'site_engineer') OR
                 (e.category = 'Site Director' AND u.role != 'site_director') OR
                 (e.category = 'Accounts' AND u.role != 'accountant') OR
                 (e.category = 'Engineering' AND u.role != 'engineer') OR
                 (e.category = 'Employee' AND u.role != 'employee') OR
                 (e.category = 'Labor' AND u.role != 'employee')
             )`
        );
        
        if (stillMismatched.length > 0) {
            console.log(`   ⚠️  Still ${stillMismatched.length} mismatches remaining:\n`);
            stillMismatched.forEach(emp => {
                console.log(`      ${emp.name}: Category="${emp.category}", Role="${emp.user_role}"`);
            });
        } else {
            console.log('   ✅ All employees now have roles matching their categories!\n');
        }
        
        // Step 4: Show final distribution
        console.log('📋 Step 4: Final role distribution...\n');
        
        const [finalDistribution] = await pool.query(
            `SELECT u.role, COUNT(*) as count
             FROM users u
             INNER JOIN employees e ON u.id = e.user_id
             WHERE e.status = 'active'
             GROUP BY u.role
             ORDER BY count DESC`
        );
        
        finalDistribution.forEach(stat => {
            console.log(`   ${stat.role}: ${stat.count} employee(s)`);
        });
        
        console.log('\n✅ Role mismatch fix complete!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
