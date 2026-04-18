const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔧 FIXING WORKFLOW TO USE ACCOUNTANT ROLE...\n');
        
        // Step 1: Show current workflow
        console.log('📋 Step 1: Current workflow step 5...\n');
        
        const [currentStep5] = await pool.query(
            `SELECT 
                ws.id,
                ws.step_number,
                ws.step_name,
                r.role_code,
                r.role_name
             FROM workflow_steps ws
             INNER JOIN roles r ON ws.role_id = r.id
             WHERE ws.workflow_id = 2 AND ws.step_number = 5`
        );
        
        console.log(`   Current Step 5: ${currentStep5[0].step_name}`);
        console.log(`   Current Role: ${currentStep5[0].role_code} (${currentStep5[0].role_name})\n`);
        
        // Step 2: Get accountant role ID
        console.log('📋 Step 2: Getting accountant role ID...\n');
        
        const [accountantRole] = await pool.query(
            `SELECT id, role_code, role_name
             FROM roles
             WHERE role_code = 'accountant'`
        );
        
        console.log(`   Accountant Role ID: ${accountantRole[0].id}`);
        console.log(`   Role Code: ${accountantRole[0].role_code}`);
        console.log(`   Role Name: ${accountantRole[0].role_name}\n`);
        
        // Step 3: Update workflow step 5
        console.log('📋 Step 3: Updating workflow step 5 to use accountant role...\n');
        
        const [updateResult] = await pool.query(
            `UPDATE workflow_steps
             SET role_id = ?
             WHERE workflow_id = 2 AND step_number = 5`,
            [accountantRole[0].id]
        );
        
        console.log(`   ✅ Updated ${updateResult.affectedRows} workflow step(s)\n`);
        
        // Step 4: Verify the update
        console.log('📋 Step 4: Verifying updated workflow...\n');
        
        const [updatedSteps] = await pool.query(
            `SELECT 
                ws.step_number,
                ws.step_name,
                r.role_code,
                r.role_name
             FROM workflow_steps ws
             INNER JOIN roles r ON ws.role_id = r.id
             WHERE ws.workflow_id = 2
             ORDER BY ws.step_number`
        );
        
        console.log('Updated Sheet Approval Workflow:\n');
        updatedSteps.forEach(step => {
            console.log(`   Step ${step.step_number}: ${step.step_name}`);
            console.log(`             Role: ${step.role_code} (${step.role_name})`);
            console.log('');
        });
        
        // Step 5: Check how many users can now sign
        console.log('📋 Step 5: Users who can now sign Step 5...\n');
        
        const [accountantUsers] = await pool.query(
            `SELECT id, name, email, role
             FROM users
             WHERE role = 'accountant'
             AND is_active = TRUE`
        );
        
        console.log(`   Found ${accountantUsers.length} user(s) with accountant role:\n`);
        accountantUsers.forEach(user => {
            console.log(`   ✅ ${user.name} (${user.email})`);
        });
        
        console.log('\n✅ Workflow fix complete!');
        console.log('\n💡 Next Steps:');
        console.log('   1. Restart backend server');
        console.log('   2. Login as Head Office Accounts 1 (ho.accounts1@test.com)');
        console.log('   3. Go to Daily Sheets');
        console.log('   4. Send sheets for signature');
        console.log('   5. Accountant users can now sign Step 5!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
