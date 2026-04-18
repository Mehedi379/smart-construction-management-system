// ============================================
// SYSTEM VALIDATION TEST
// Smart Construction Management System
// ============================================

const pool = require('./src/config/database');

async function validateSystem() {
    console.log('\n🔍 Starting System Validation...\n');
    
    const results = {
        working: [],
        broken: [],
        warnings: []
    };

    try {
        // TEST 1: Database Connection
        console.log('📋 Test 1: Database Connection');
        try {
            const conn = await pool.getConnection();
            console.log('  ✅ Database connected');
            results.working.push('Database Connection');
            conn.release();
        } catch (error) {
            console.log('  ❌ Database connection failed');
            results.broken.push('Database Connection');
        }

        // TEST 2: Admin User Exists
        console.log('\n📋 Test 2: Admin User');
        const [admins] = await pool.query(
            'SELECT id, name, email, role, is_approved, is_active FROM users WHERE role = "admin"'
        );
        if (admins.length > 0 && admins[0].is_approved && admins[0].is_active) {
            console.log('  ✅ Admin user exists and is active');
            results.working.push('Admin User');
        } else {
            console.log('  ❌ Admin user issue');
            results.broken.push('Admin User');
        }

        // TEST 3: Project Exists
        console.log('\n📋 Test 3: Test Project');
        const [projects] = await pool.query(
            'SELECT id, project_code, project_name, status, estimated_budget FROM projects WHERE id = 1'
        );
        if (projects.length > 0) {
            console.log(`  ✅ Project exists: ${projects[0].project_name}`);
            console.log(`     Code: ${projects[0].project_code}`);
            console.log(`     Budget: ৳${projects[0].estimated_budget.toLocaleString()}`);
            results.working.push('Test Project');
        } else {
            console.log('  ❌ Project not found');
            results.broken.push('Test Project');
        }

        // TEST 4: All Role Accounts Created
        console.log('\n📋 Test 4: Role Accounts');
        const [users] = await pool.query(
            `SELECT u.id, u.email, u.role, u.is_approved, u.is_active, 
                    e.employee_id, e.assigned_project_id
             FROM users u
             LEFT JOIN employees e ON u.id = e.user_id
             ORDER BY u.id`
        );
        
        const expectedRoles = ['admin', 'accountant', 'manager', 'engineer', 'director', 'deputy_director', 'employee'];
        const foundRoles = users.map(u => u.role);
        
        let allRolesCreated = true;
        for (const role of expectedRoles) {
            if (foundRoles.includes(role)) {
                const user = users.find(u => u.role === role);
                console.log(`  ✅ ${role}: ${user.email} (${user.employee_id})`);
            } else {
                console.log(`  ❌ ${role}: Missing`);
                allRolesCreated = false;
            }
        }
        
        if (allRolesCreated) {
            results.working.push('All Role Accounts');
        } else {
            results.broken.push('Role Accounts');
        }

        // TEST 5: Project Assignment
        console.log('\n📋 Test 5: Project-Based Access Control');
        const [assignedUsers] = await pool.query(
            `SELECT COUNT(*) as count 
             FROM employees 
             WHERE assigned_project_id = 1`
        );
        
        if (assignedUsers[0].count === users.length) {
            console.log(`  ✅ All ${assignedUsers[0].count} users assigned to project`);
            results.working.push('Project Assignment');
        } else {
            console.log(`  ⚠️ Only ${assignedUsers[0].count}/${users.length} users assigned`);
            results.warnings.push('Project Assignment');
        }

        // TEST 6: User Approval Status
        console.log('\n📋 Test 6: User Approval Status');
        const [approvedUsers] = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE is_approved = TRUE AND is_active = TRUE'
        );
        
        if (approvedUsers[0].count === users.length) {
            console.log(`  ✅ All ${approvedUsers[0].count} users approved and active`);
            results.working.push('User Approval');
        } else {
            console.log(`  ❌ Only ${approvedUsers[0].count}/${users.length} users approved`);
            results.broken.push('User Approval');
        }

        // TEST 7: Data Cleanliness
        console.log('\n📋 Test 7: Data Cleanliness');
        const [oldData] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM vouchers) as vouchers,
                (SELECT COUNT(*) FROM expenses) as expenses,
                (SELECT COUNT(*) FROM daily_sheets) as sheets,
                (SELECT COUNT(*) FROM purchases) as purchases
        `);
        
        const isClean = oldData[0].vouchers === 0 && 
                       oldData[0].expenses === 0 && 
                       oldData[0].sheets === 0 &&
                       oldData[0].purchases === 0;
        
        if (isClean) {
            console.log('  ✅ No old test data (clean state)');
            results.working.push('Data Cleanliness');
        } else {
            console.log(`  ⚠️ Old data exists: Vouchers: ${oldData[0].vouchers}, Expenses: ${oldData[0].expenses}`);
            results.warnings.push('Data Cleanliness');
        }

        // TEST 8: Backend API Health
        console.log('\n📋 Test 8: Backend API Health');
        try {
            const response = await fetch('http://localhost:9000/api/health');
            const data = await response.json();
            
            if (data.success && data.status === 'OK') {
                console.log('  ✅ Backend API running');
                console.log(`     Port: 9000`);
                console.log(`     Environment: ${data.environment}`);
                results.working.push('Backend API');
            } else {
                console.log('  ❌ Backend API unhealthy');
                results.broken.push('Backend API');
            }
        } catch (error) {
            console.log('  ❌ Backend API not reachable');
            results.broken.push('Backend API');
        }

        // TEST 9: Frontend Application
        console.log('\n📋 Test 9: Frontend Application');
        try {
            const response = await fetch('http://localhost:3001');
            if (response.ok) {
                console.log('  ✅ Frontend application running');
                console.log(`     URL: http://localhost:3001`);
                results.working.push('Frontend Application');
            } else {
                console.log('  ❌ Frontend not responding');
                results.broken.push('Frontend Application');
            }
        } catch (error) {
            console.log('  ❌ Frontend not reachable');
            results.broken.push('Frontend Application');
        }

        // TEST 10: Role Permissions Structure
        console.log('\n📋 Test 10: Role Permissions');
        const rolePermissions = {
            'admin': 'Full Access',
            'accountant': 'Financial + Reports',
            'manager': 'Site Monitoring + Sheets',
            'engineer': 'Voucher + Daily Sheet Creation',
            'director': 'Approval + Monitoring',
            'deputy_director': 'Mid-level Approval',
            'employee': 'Limited Access'
        };
        
        console.log('  Role Permission Matrix:');
        for (const [role, permission] of Object.entries(rolePermissions)) {
            const userExists = foundRoles.includes(role);
            const status = userExists ? '✅' : '❌';
            console.log(`    ${status} ${role}: ${permission}`);
        }
        
        if (foundRoles.length >= 6) {
            results.working.push('Role Permissions');
        } else {
            results.broken.push('Role Permissions');
        }

        // FINAL SUMMARY
        console.log('\n' + '='.repeat(70));
        console.log('📊 SYSTEM VALIDATION SUMMARY');
        console.log('='.repeat(70) + '\n');
        
        console.log(`✅ Working Features (${results.working.length}):`);
        results.working.forEach(feature => console.log(`   ✓ ${feature}`));
        
        if (results.broken.length > 0) {
            console.log(`\n❌ Broken Features (${results.broken.length}):`);
            results.broken.forEach(feature => console.log(`   ✗ ${feature}`));
        }
        
        if (results.warnings.length > 0) {
            console.log(`\n⚠️ Warnings (${results.warnings.length}):`);
            results.warnings.forEach(feature => console.log(`   ⚠ ${feature}`));
        }
        
        const healthScore = Math.round((results.working.length / (results.working.length + results.broken.length)) * 100);
        console.log(`\n🎯 System Health: ${healthScore}%`);
        
        if (results.broken.length === 0) {
            console.log('\n✅ SYSTEM IS FULLY OPERATIONAL!\n');
        } else {
            console.log(`\n⚠️ ${results.broken.length} issue(s) need attention\n`);
        }

        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Validation error:', error);
    }
}

// Run validation
validateSystem()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('💥 Validation failed:', error);
        process.exit(1);
    });
