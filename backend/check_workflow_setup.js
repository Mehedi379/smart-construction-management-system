const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔍 CHECKING SHEET WORKFLOW & SIGNATURE SETUP...\n');
        
        // Step 1: Check workflow steps
        console.log('📋 Step 1: Current workflow steps...\n');
        
        const [workflowSteps] = await pool.query(
            `SELECT 
                ws.id,
                ws.workflow_id,
                ws.step_number,
                ws.step_name,
                r.role_code,
                r.role_name
             FROM workflow_steps ws
             INNER JOIN roles r ON ws.role_id = r.id
             WHERE ws.workflow_id = 2
             ORDER BY ws.step_number`
        );
        
        console.log('Sheet Approval Workflow (6 steps):\n');
        workflowSteps.forEach(step => {
            console.log(`   Step ${step.step_number}: ${step.step_name}`);
            console.log(`             Role: ${step.role_code} (${step.role_name})`);
            console.log('');
        });
        
        // Step 2: Check users with accountant role
        console.log('\n📋 Step 2: Users with "accountant" role...\n');
        
        const [accountantUsers] = await pool.query(
            `SELECT id, name, email, role
             FROM users
             WHERE role = 'accountant'
             AND is_active = TRUE`
        );
        
        console.log(`Found ${accountantUsers.length} accountant(s):\n`);
        accountantUsers.forEach(user => {
            console.log(`   ${user.name} (${user.email})`);
            console.log(`   Role: ${user.role}\n`);
        });
        
        // Step 3: Check sheets
        console.log('\n📋 Step 3: Current sheets...\n');
        
        const [sheets] = await pool.query(
            `SELECT 
                ds.id,
                ds.sheet_no,
                ds.status,
                ds.project_id,
                p.project_name,
                sw.current_step,
                sw.workflow_status
             FROM daily_sheets ds
             LEFT JOIN sheet_workflows sw ON ds.id = sw.sheet_id
             LEFT JOIN projects p ON ds.project_id = p.id
             ORDER BY ds.id DESC
             LIMIT 5`
        );
        
        console.log(`Recent sheets:\n`);
        sheets.forEach(sheet => {
            console.log(`   Sheet: ${sheet.sheet_no}`);
            console.log(`   Status: ${sheet.status}`);
            console.log(`   Workflow: ${sheet.workflow_status || 'No workflow'}`);
            console.log(`   Current Step: ${sheet.current_step || 'N/A'}`);
            console.log(`   Project: ${sheet.project_name || 'N/A'}`);
            console.log('');
        });
        
        // Step 4: The problem
        console.log('\n⚠️  PROBLEM IDENTIFIED:\n');
        console.log('   Workflow Step 5 requires role: "head_office_accounts"');
        console.log('   But user has role: "accountant"');
        console.log('   These are DIFFERENT roles!');
        console.log('');
        console.log('   Solution: Either:');
        console.log('   1. Change workflow to use "accountant" role, OR');
        console.log('   2. Change user role to "head_office_accounts"');
        console.log('');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
