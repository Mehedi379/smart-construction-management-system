const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔧 FIXING OLD ROLES...\n');
        
        // Step 1: Update users with old roles to valid roles
        console.log('📋 Step 1: Updating users with old roles...\n');
        
        const roleUpdates = [
            {
                oldRole: 'deputy_head_office',
                newRole: 'site_manager',
                reason: 'Deputy Head Office → Site Manager'
            },
            {
                oldRole: 'deputy_director',
                newRole: 'site_manager',
                reason: 'Deputy Director → Site Manager'
            },
            {
                oldRole: 'project_director',
                newRole: 'site_manager',
                reason: 'Project Director → Site Manager'
            },
            {
                oldRole: 'head_office_accounts',
                newRole: 'accountant',
                reason: 'Head Office Accounts → Accountant'
            },
            {
                oldRole: 'head_office_admin',
                newRole: 'admin',
                reason: 'Head Office Admin → Admin'
            }
        ];
        
        let totalUpdated = 0;
        
        for (const update of roleUpdates) {
            const [result] = await pool.query(
                `UPDATE users SET role = ? WHERE role = ?`,
                [update.newRole, update.oldRole]
            );
            
            if (result.affectedRows > 0) {
                console.log(`   ✅ ${update.reason}: ${result.affectedRows} user(s) updated`);
                totalUpdated += result.affectedRows;
            }
        }
        
        console.log(`\n   Total users updated: ${totalUpdated}\n`);
        
        // Step 2: Verify the changes
        console.log('📋 Step 2: Verifying role distribution...\n');
        
        const [roleStats] = await pool.query(
            `SELECT u.role, COUNT(*) as count
             FROM users u
             WHERE u.is_active = TRUE
             GROUP BY u.role
             ORDER BY count DESC`
        );
        
        console.log('Current role distribution:\n');
        roleStats.forEach(stat => {
            console.log(`   ${stat.role}: ${stat.count} user(s)`);
        });
        
        // Step 3: Check if any invalid roles remain
        console.log('\n📋 Step 3: Checking for remaining invalid roles...\n');
        
        const [invalidRoles] = await pool.query(
            `SELECT DISTINCT u.role, COUNT(*) as count
             FROM users u
             WHERE u.role NOT IN (
                 'admin', 'site_manager', 'site_engineer', 'site_director',
                 'accountant', 'engineer', 'employee', 'supervisor',
                 'store_keeper', 'foreman', 'qa_officer', 'billing_officer'
             )
             GROUP BY u.role`
        );
        
        if (invalidRoles.length > 0) {
            console.log('   ⚠️  Found users with invalid roles:\n');
            invalidRoles.forEach(role => {
                console.log(`      ${role.role}: ${role.count} user(s)`);
            });
        } else {
            console.log('   ✅ All users have valid roles!\n');
        }
        
        // Step 4: Summary
        console.log('\n📋 SUMMARY:\n');
        console.log('✅ Fixed Roles:');
        console.log('   - deputy_head_office → site_manager');
        console.log('   - deputy_director → site_manager');
        console.log('   - project_director → site_manager');
        console.log('   - head_office_accounts → accountant');
        console.log('   - head_office_admin → admin');
        
        console.log('\n✅ Valid Roles (available in registration):');
        console.log('   - admin');
        console.log('   - site_manager');
        console.log('   - site_engineer');
        console.log('   - site_director');
        console.log('   - accountant');
        console.log('   - engineer');
        console.log('   - employee');
        console.log('   - supervisor');
        console.log('   - store_keeper');
        console.log('   - foreman');
        console.log('   - qa_officer');
        console.log('   - billing_officer');
        
        console.log('\n✅ Fix complete! Project details will now show only valid roles.\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
