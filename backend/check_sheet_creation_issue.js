const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔍 CHECKING SHEET CREATION FOR site_manager ROLE...\n');
        
        // Step 1: Find user "Deputy Head Office" with site_manager role
        console.log('📋 Step 1: Finding user...\n');
        
        const [users] = await pool.query(
            `SELECT id, name, email, role
             FROM users
             WHERE role = 'site_manager'
             AND name LIKE '%Deputy%'`
        );
        
        if (users.length === 0) {
            console.log('❌ No site_manager user found with "Deputy" in name\n');
            console.log('Available site_managers:\n');
            
            const [allSiteManagers] = await pool.query(
                `SELECT id, name, email, role
                 FROM users
                 WHERE role = 'site_manager'`
            );
            
            allSiteManagers.forEach(u => {
                console.log(`   - ${u.name} (${u.email})`);
            });
            console.log('');
            process.exit(0);
        }
        
        const user = users[0];
        console.log(`   Found: ${user.name} (${user.email})`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Role: ${user.role}\n`);
        
        // Step 2: Check if user has employee record
        console.log('📋 Step 2: Checking employee record...\n');
        
        const [employees] = await pool.query(
            `SELECT id, employee_id, name, designation, category, assigned_project_id, status
             FROM employees
             WHERE user_id = ?`,
            [user.id]
        );
        
        if (employees.length === 0) {
            console.log(`   ❌ No employee record found for this user!`);
            console.log(`   This might be the issue - user needs employee record\n`);
        } else {
            const emp = employees[0];
            console.log(`   Employee ID: ${emp.employee_id}`);
            console.log(`   Name: ${emp.name}`);
            console.log(`   Designation: ${emp.designation}`);
            console.log(`   Category: ${emp.category}`);
            console.log(`   Assigned Project: ${emp.assigned_project_id || 'NONE'}`);
            console.log(`   Status: ${emp.status}\n`);
        }
        
        // Step 3: Test workflow step 1 query
        console.log('📋 Step 3: Testing workflow step 1 query...\n');
        
        try {
            const [templates] = await pool.query(
                'SELECT id FROM workflow_templates WHERE entity_type = "sheet" AND is_active = TRUE LIMIT 1'
            );
            
            if (templates.length === 0) {
                console.log('   ❌ No active workflow template found!\n');
            } else {
                console.log(`   ✅ Workflow template found: ID ${templates[0].id}\n`);
                
                const [firstStep] = await pool.query(
                    `SELECT ws.role_id, r.role_name, r.role_code
                     FROM workflow_steps ws
                     INNER JOIN roles r ON ws.role_id = r.id
                     WHERE ws.workflow_id = ? AND ws.step_number = 1`,
                    [templates[0].id]
                );
                
                if (firstStep.length === 0) {
                    console.log('   ❌ No workflow step 1 found!\n');
                } else {
                    console.log(`   ✅ Step 1 Role: ${firstStep[0].role_code} (${firstStep[0].role_name})\n`);
                    
                    // Test the user notification query
                    console.log('📋 Step 4: Testing user notification query...\n');
                    
                    // Use project_id = 1 for test
                    const testProjectId = 1;
                    
                    const [usersForNotification] = await pool.query(
                        `SELECT u.id, u.email, u.name 
                         FROM users u
                         INNER JOIN employees e ON u.id = e.user_id
                         WHERE u.role = ? 
                         AND u.is_active = TRUE
                         AND e.assigned_project_id = ?`,
                        [firstStep[0].role_code, testProjectId]
                    );
                    
                    console.log(`   Found ${usersForNotification.length} user(s) for notification:\n`);
                    usersForNotification.forEach(u => {
                        console.log(`   - ${u.name} (${u.email})`);
                    });
                    console.log('');
                }
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
            console.log('   Full error:', error);
        }
        
        console.log('✅ Check complete!\n');
        console.log('💡 Common issues:');
        console.log('   1. User has no employee record');
        console.log('   2. assigned_project_id is NULL');
        console.log('   3. No workflow template exists');
        console.log('   4. No users match the notification query\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
