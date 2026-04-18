const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔍 CHECKING ROLES IN SYSTEM...\n');
        
        // 1. Check what roles exist in database
        console.log('📋 Step 1: Checking roles in database...');
        const [roles] = await pool.query(
            `SELECT role_code, role_name, description, level, is_active 
             FROM roles 
             ORDER BY level`
        );
        
        console.log(`\nFound ${roles.length} roles in database:\n`);
        roles.forEach(role => {
            console.log(`   ${role.role_code} - ${role.role_name} (Level ${role.level}) ${role.is_active ? '✅' : '❌'}`);
        });
        
        // 2. Check what roles are available in registration (from Login.jsx)
        console.log('\n\n📋 Step 2: Registration form available categories...');
        const registrationCategories = [
            'Site Manager',      // → site_manager
            'Site Engineer',     // → site_engineer
            'Site Director',     // → site_director
            'Accounts',          // → accountant
            'Engineering',       // → engineer
            'Employee'           // → employee
        ];
        
        registrationCategories.forEach(cat => {
            console.log(`   ${cat}`);
        });
        
        // 3. Check what roles are showing in project details (from your screenshot)
        console.log('\n\n📋 Step 3: Roles showing in Project Details (from screenshot)...');
        const projectDetailRoles = [
            'Site Manager',           // ✅ Valid
            'Head Office Accounts',   // ❌ NOT in registration
            'Engineering',            // ✅ Valid (as "Engineering" category)
            'Deputy Director',        // ❌ NOT in registration
            'Project Director',       // ❌ NOT in registration
            'Management',             // ❌ NOT in registration
            'Accounts',               // ✅ Valid
            'Employee'                // ✅ Valid
        ];
        
        projectDetailRoles.forEach(role => {
            console.log(`   ${role}`);
        });
        
        // 4. Find mismatched roles
        console.log('\n\n📋 Step 4: Finding OLD/INVALID roles...\n');
        
        const [users] = await pool.query(
            `SELECT u.id, u.email, u.name, u.role, e.category, e.designation
             FROM users u
             LEFT JOIN employees e ON u.id = e.user_id
             ORDER BY u.role`
        );
        
        // Valid roles that should exist
        const validRoles = [
            'admin',
            'site_manager',
            'site_engineer', 
            'site_director',
            'accountant',
            'engineer',
            'employee',
            'supervisor',
            'store_keeper',
            'foreman',
            'qa_officer',
            'billing_officer'
        ];
        
        // Old/invalid roles that might exist
        const oldRoles = [
            'head_office_accounts',
            'head_office_accounts_1',
            'head_office_accounts_2',
            'deputy_director',
            'project_director',
            'head_office_admin',
            'deputy_head_office'
        ];
        
        console.log('Users with OLD/INVALID roles:\n');
        const usersWithOldRoles = users.filter(u => oldRoles.includes(u.role));
        
        if (usersWithOldRoles.length > 0) {
            usersWithOldRoles.forEach(user => {
                console.log(`   ❌ ${user.name} (${user.email})`);
                console.log(`      Current Role: ${user.role}`);
                console.log(`      Category: ${user.category || 'N/A'}`);
                console.log(`      Designation: ${user.designation || 'N/A'}\n`);
            });
        } else {
            console.log('   ✅ No users with old roles found!\n');
        }
        
        // 5. Summary
        console.log('\n\n📋 SUMMARY:\n');
        console.log('✅ VALID Roles (in registration):');
        console.log('   - Site Manager (site_manager)');
        console.log('   - Site Engineer (site_engineer)');
        console.log('   - Site Director (site_director)');
        console.log('   - Accounts (accountant)');
        console.log('   - Engineering (engineer)');
        console.log('   - Employee (employee)');
        
        console.log('\n❌ OLD Roles (NOT in registration - should be removed/updated):');
        console.log('   - Head Office Accounts');
        console.log('   - Deputy Director');
        console.log('   - Project Director');
        console.log('   - Management');
        console.log('   - Head Office Admin');
        
        console.log('\n\n💡 RECOMMENDATION:');
        console.log('   1. Remove old roles from database');
        console.log('   2. Update users with old roles to valid roles');
        console.log('   3. Ensure only registration-available roles show in project details');
        
        console.log('\n✅ Check complete!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
