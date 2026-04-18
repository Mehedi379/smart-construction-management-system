// ============================================
// UPDATE WORKFLOW STEPS TO USE site_engineer
// Smart Construction Management System
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateWorkflowSteps() {
    let connection;
    
    try {
        console.log('\n' + '='.repeat(80));
        console.log('🔄 UPDATING WORKFLOW STEPS');
        console.log('='.repeat(80) + '\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected to database\n');

        // Delete existing workflow steps for sheet workflow
        console.log('📋 Removing old workflow steps...');
        await connection.query('DELETE FROM workflow_steps WHERE workflow_id = 2');
        console.log('✅ Old steps removed\n');

        // Insert new workflow steps with site_engineer instead of engineer
        console.log('📋 Creating new 6-step workflow...\n');
        
        await connection.query(`
            INSERT INTO workflow_steps (workflow_id, role_id, step_number, step_name, action_required) 
            VALUES 
            (2, (SELECT id FROM roles WHERE role_code = 'site_manager'), 1, 'Site Manager Verification', 'sign'),
            (2, (SELECT id FROM roles WHERE role_code = 'site_engineer'), 2, 'Site Engineer Approval', 'sign'),
            (2, (SELECT id FROM roles WHERE role_code = 'project_director'), 3, 'Project Director Approval', 'sign'),
            (2, (SELECT id FROM roles WHERE role_code = 'deputy_director'), 4, 'Deputy Director Review', 'sign'),
            (2, (SELECT id FROM roles WHERE role_code = 'head_office_accounts'), 5, 'Head Office Accounts Approval', 'sign'),
            (2, (SELECT id FROM roles WHERE role_code = 'head_office_admin'), 6, 'Head Office Admin Final Approval', 'sign')
        `);

        console.log('✅ New workflow steps created\n');

        // Verify the workflow steps
        console.log('📋 Updated Workflow Steps:\n');
        const [steps] = await connection.query(`
            SELECT 
                ws.step_number,
                r.role_code,
                r.role_name,
                ws.step_name,
                ws.action_required
            FROM workflow_steps ws
            INNER JOIN roles r ON ws.role_id = r.id
            WHERE ws.workflow_id = 2
            ORDER BY ws.step_number
        `);

        console.log('   Step | Role Code | Role Name | Action');
        console.log('   ' + '-'.repeat(76));
        
        steps.forEach(step => {
            console.log(`   ${step.step_number} | ${step.role_code} | ${step.role_name} | ${step.action_required}`);
        });

        // Check user availability for each step
        console.log('\n📋 User Availability:\n');
        
        for (const step of steps) {
            const [users] = await connection.query(
                `SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = TRUE`,
                [step.role_code]
            );
            
            const count = users[0].count;
            const status = count > 0 ? `✅ ${count} user(s)` : '❌ NO USERS';
            console.log(`   Step ${step.step_number} (${step.role_code}): ${status}`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ WORKFLOW STEPS UPDATED SUCCESSFULLY');
        console.log('='.repeat(80) + '\n');

        console.log('📝 Summary:');
        console.log('   Step 1: site_manager (was: site_manager) ✅');
        console.log('   Step 2: site_engineer (was: engineer) ✅ UPDATED');
        console.log('   Step 3: project_director (unchanged) ✅');
        console.log('   Step 4: deputy_director (unchanged) ✅');
        console.log('   Step 5: head_office_accounts (unchanged) ✅');
        console.log('   Step 6: head_office_admin (unchanged) ✅\n');

        console.log('🚀 Next Steps:');
        console.log('   1. Restart backend server: npm run dev');
        console.log('   2. Test voucher → sheet → signature workflow');
        console.log('   3. Verify site_engineer can sign Step 2\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

updateWorkflowSteps();
