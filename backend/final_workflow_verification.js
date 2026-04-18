// ============================================
// FINAL WORKFLOW VERIFICATION & FIX
// Smart Construction Management System
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('\n' + '='.repeat(80));
    console.log('🔍 FINAL WORKFLOW VERIFICATION');
    console.log('='.repeat(80) + '\n');

    // Expected workflow roles
    const expectedRoles = [
        'site_manager',
        'site_engineer',
        'project_director',
        'deputy_director',
        'head_office_accounts',
        'head_office_admin'
    ];

    console.log('📋 Expected Workflow Signature Roles:\n');
    expectedRoles.forEach((role, idx) => {
        console.log(`   Step ${idx + 1}: ${role}`);
    });

    // Step 1: Verify all roles exist in roles table
    console.log('\n\n📋 STEP 1: Verifying Roles Exist in Database...\n');
    
    const [roles] = await conn.query(
        'SELECT role_code, role_name, id FROM roles WHERE role_code IN (?)',
        [expectedRoles]
    );

    const existingRoleCodes = roles.map(r => r.role_code);
    const missingRoles = expectedRoles.filter(r => !existingRoleCodes.includes(r));

    if (missingRoles.length > 0) {
        console.log('⚠️ Missing roles found:\n');
        for (const roleCode of missingRoles) {
            console.log(`   ❌ ${roleCode} - Creating...`);
            
            // Create missing role
            const roleName = roleCode
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            await conn.query(
                `INSERT INTO roles (role_code, role_name, description, level, is_system_role, color) 
                 VALUES (?, ?, ? role for workflow', 10, TRUE, '#6366F1')`,
                [roleCode, roleName]
            );
            
            console.log(`   ✅ Created ${roleCode}`);
        }
    } else {
        console.log('✅ All workflow roles exist in database');
        roles.forEach(r => {
            console.log(`   ✅ ${r.role_code} - ${r.role_name} (ID: ${r.id})`);
        });
    }

    // Step 2: Update workflow steps
    console.log('\n\n📋 STEP 2: Updating Workflow Steps...\n');
    
    // Delete existing steps
    await conn.query('DELETE FROM workflow_steps WHERE workflow_id = 2');
    console.log('✅ Cleared old workflow steps');

    // Insert new workflow steps
    const stepNames = [
        'Site Manager Verification',
        'Site Engineer Approval',
        'Project Director Approval',
        'Deputy Director Review',
        'Head Office Accounts Approval',
        'Head Office Admin Final Approval'
    ];

    for (let i = 0; i < expectedRoles.length; i++) {
        const roleCode = expectedRoles[i];
        const stepName = stepNames[i];
        const stepNumber = i + 1;

        await conn.query(
            `INSERT INTO workflow_steps (workflow_id, role_id, step_number, step_name, action_required) 
             VALUES (2, (SELECT id FROM roles WHERE role_code = ?), ?, ?, 'sign')`,
            [roleCode, stepNumber, stepName]
        );

        console.log(`   ✅ Step ${stepNumber}: ${roleCode} - ${stepName}`);
    }

    // Step 3: Verify workflow steps
    console.log('\n\n📋 STEP 3: Verifying Workflow Configuration...\n');
    
    const [steps] = await conn.query(`
        SELECT 
            ws.step_number,
            r.role_code,
            r.role_name,
            ws.step_name
        FROM workflow_steps ws
        INNER JOIN roles r ON ws.role_id = r.id
        WHERE ws.workflow_id = 2
        ORDER BY ws.step_number
    `);

    console.log('   Step | Role Code | Role Name | Step Name');
    console.log('   ' + '-'.repeat(90));
    
    steps.forEach(step => {
        console.log(`   ${step.step_number} | ${step.role_code} | ${step.role_name} | ${step.step_name}`);
    });

    // Step 4: Check user availability
    console.log('\n\n📋 STEP 4: User Availability Check...\n');
    
    const workflowStatus = [];
    
    for (const step of steps) {
        const [users] = await conn.query(
            'SELECT id, name, email FROM users WHERE role = ? AND is_active = TRUE',
            [step.role_code]
        );

        const userCount = users.length;
        const status = userCount > 0 ? '✅' : '❌';
        
        console.log(`   ${status} Step ${step.step_number} (${step.role_code}): ${userCount} user(s)`);
        
        if (userCount > 0) {
            users.forEach(u => {
                console.log(`      → ${u.name} (${u.email})`);
            });
        }

        workflowStatus.push({
            step: step.step_number,
            role: step.role_code,
            users: userCount,
            ready: userCount > 0
        });
    }

    // Step 5: Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 WORKFLOW STATUS SUMMARY');
    console.log('='.repeat(80) + '\n');

    const readySteps = workflowStatus.filter(s => s.ready).length;
    const totalSteps = workflowStatus.length;
    const percentage = Math.round((readySteps / totalSteps) * 100);

    console.log(`   Workflow Steps: ${totalSteps}`);
    console.log(`   Steps with Users: ${readySteps}`);
    console.log(`   Steps without Users: ${totalSteps - readySteps}`);
    console.log(`   Completion: ${percentage}%\n`);

    if (percentage === 100) {
        console.log('   🎉 ALL WORKFLOW STEPS ARE READY!\n');
    } else {
        console.log('   ⚠️ Some steps still need users assigned:\n');
        workflowStatus.filter(s => !s.ready).forEach(s => {
            console.log(`   ❌ Step ${s.step}: ${s.role} - No users assigned`);
        });
        console.log('');
    }

    // Step 6: Recommendations
    console.log('='.repeat(80));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(80) + '\n');

    const stepsWithoutUsers = workflowStatus.filter(s => !s.ready);
    
    if (stepsWithoutUsers.length > 0) {
        console.log('To complete the workflow setup, you need to:\n');
        
        for (const step of stepsWithoutUsers) {
            console.log(`   Step ${step.step} (${step.role}):`);
            
            if (step.role === 'head_office_accounts') {
                console.log('   → Run: UPDATE users SET role = "head_office_accounts" WHERE role IN ("head_office_accounts_1", "head_office_accounts_2");\n');
            } else if (step.role === 'head_office_admin') {
                console.log('   → User already exists with email: headoffice.admin@khazabilkis.com');
                console.log('   → Just needs to be activated or created\n');
            }
        }
    } else {
        console.log('   ✅ All workflow steps have users assigned');
        console.log('   ✅ System is ready for production use\n');
    }

    console.log('='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80) + '\n');

    await conn.end();
})();
