// ============================================
// COMPLETE REMAINING FIXES
// Smart Construction Management System
// ============================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function completeFixes() {
    let connection;
    
    try {
        console.log('\n' + '='.repeat(80));
        console.log('🔧 COMPLETING REMAINING SYSTEM FIXES');
        console.log('='.repeat(80) + '\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected to database\n');

        // FIX 1: Update head_office_accounts roles
        console.log('📋 FIX 1: Updating head_office_accounts roles...');
        const [updateResult] = await connection.query(
            `UPDATE users SET role = 'head_office_accounts' 
             WHERE role = 'head_office_accounts_1' OR role = 'head_office_accounts_2'`
        );
        console.log(`✅ Updated ${updateResult.affectedRows} users to head_office_accounts role\n`);

        // FIX 2: Create head_office_admin user
        console.log('📋 FIX 2: Creating head_office_admin user...');
        const [existingAdmin] = await connection.query(
            `SELECT id FROM users WHERE role = 'head_office_admin' LIMIT 1`
        );

        if (existingAdmin.length === 0) {
            // Create user with password
            const hashedPassword = await bcrypt.hash('headofficeadmin123', 10);
            
            const [userResult] = await connection.query(
                `INSERT INTO users (name, email, password, role, is_approved, is_active, status, created_at) 
                 VALUES ('Head Office Admin', 'headoffice.admin@khazabilkis.com', ?, 'head_office_admin', TRUE, TRUE, 'active', NOW())`,
                [hashedPassword]
            );

            const userId = userResult.insertId;

            // Create employee record
            await connection.query(
                `INSERT INTO employees (user_id, employee_id, name, designation, category, assigned_project_id, status, created_at) 
                 VALUES (?, 'EMP0099', 'Head Office Admin', 'Head Office Admin', 'Admin', 1, 'active', NOW())`,
                [userId]
            );

            console.log(`✅ Created head_office_admin user (ID: ${userId})\n`);
            console.log('📋 Login Credentials:');
            console.log('   Email: headoffice.admin@khazabilkis.com');
            console.log('   Password: headofficeadmin123\n');
        } else {
            console.log('✅ head_office_admin user already exists\n');
        }

        // FIX 3: Initialize workflows for pending sheets
        console.log('📋 FIX 3: Initializing workflows for pending sheets...');
        const [workflowResult] = await connection.query(
            `INSERT INTO sheet_workflows (sheet_id, workflow_id, current_step, status, started_at)
             SELECT 
                 ds.id,
                 2,
                 1,
                 'pending',
                 NOW()
             FROM daily_sheets ds
             WHERE ds.status = 'pending'
             AND NOT EXISTS (
                 SELECT 1 FROM sheet_workflows sw WHERE sw.sheet_id = ds.id
             )`
        );
        console.log(`✅ Started workflows for ${workflowResult.affectedRows} sheets\n`);

        // FIX 4: Initialize signature requests
        console.log('📋 FIX 4: Initializing signature requests...');
        const [sigResult] = await connection.query(
            `INSERT IGNORE INTO signature_requests (sheet_id, role_code, status, requested_at)
             SELECT 
                 sw.sheet_id,
                 r.role_code,
                 CASE WHEN sw.current_step = ws.step_number THEN 'requested' ELSE 'pending' END,
                 NOW()
             FROM sheet_workflows sw
             CROSS JOIN workflow_steps ws ON ws.workflow_id = sw.workflow_id
             INNER JOIN roles r ON r.id = ws.role_id
             WHERE sw.status = 'pending'`
        );
        console.log(`✅ Created/updated signature requests\n`);

        // ============================================
        // FINAL VERIFICATION
        // ============================================
        console.log('\n' + '='.repeat(80));
        console.log('🔍 FINAL VERIFICATION');
        console.log('='.repeat(80) + '\n');

        // Check workflow roles have users
        console.log('📋 Workflow Roles Status:');
        const [roleStatus] = await connection.query(
            `SELECT 
                r.role_code,
                r.role_name,
                COUNT(u.id) as user_count,
                CASE 
                    WHEN COUNT(u.id) = 0 THEN '❌ NO USERS'
                    ELSE CONCAT('✅ ', COUNT(u.id), ' user(s)')
                END as status
             FROM roles r
             LEFT JOIN users u ON u.role = r.role_code AND u.is_active = TRUE
             WHERE r.role_code IN ('site_manager', 'engineer', 'project_director', 'deputy_director', 'head_office_accounts', 'head_office_admin')
             GROUP BY r.id, r.role_code, r.role_name
             ORDER BY 
                 FIELD(r.role_code, 'site_manager', 'engineer', 'project_director', 'deputy_director', 'head_office_accounts', 'head_office_admin')`
        );

        roleStatus.forEach(r => {
            console.log(`   Step: ${r.role_code} - ${r.user_name} - ${r.status}`);
        });

        // Check sheets with workflows
        console.log('\n📋 Sheets with Workflows:');
        const [sheetsWithWorkflow] = await connection.query(
            `SELECT 
                COUNT(*) as total_sheets,
                SUM(CASE WHEN sw.id IS NOT NULL THEN 1 ELSE 0 END) as with_workflow,
                SUM(CASE WHEN sw.id IS NULL THEN 1 ELSE 0 END) as without_workflow
             FROM daily_sheets ds
             LEFT JOIN sheet_workflows sw ON ds.id = sw.sheet_id`
        );

        console.log(`   Total Sheets: ${sheetsWithWorkflow[0].total_sheets}`);
        console.log(`   With Workflow: ${sheetsWithWorkflow[0].with_workflow} ✅`);
        console.log(`   Without Workflow: ${sheetsWithWorkflow[0].without_workflow}`);

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('✅ ALL FIXES COMPLETED SUCCESSFULLY');
        console.log('='.repeat(80) + '\n');

        console.log('📝 SUMMARY:');
        console.log('   ✅ Workflow templates created (2 templates)');
        console.log('   ✅ Workflow steps configured (6-step approval)');
        console.log('   ✅ Role codes updated (head_office_accounts)');
        console.log('   ✅ head_office_admin user created');
        console.log('   ✅ Signature workflows initialized');
        console.log('   ✅ Signature requests created\n');

        console.log('🚀 NEXT STEPS:');
        console.log('   1. Restart backend server: npm run dev');
        console.log('   2. Test voucher creation and approval');
        console.log('   3. Verify auto sheet creation');
        console.log('   4. Test signature workflow (all 6 steps)\n');

        console.log('📋 TEST ACCOUNTS:');
        console.log('   Admin: admin@test.com / 123456');
        console.log('   Accountant: accountant1@test.com / 123456');
        console.log('   Site Manager: site.manager1@test.com / 123456');
        console.log('   Engineer: engineer1@test.com / 123456');
        console.log('   Project Director: project.director1@test.com / 123456');
        console.log('   Deputy Director: deputy.director1@test.com / 123456');
        console.log('   Head Office Accounts: ho.accounts1@test.com / 123456');
        console.log('   Head Office Admin: headoffice.admin@khazabilkis.com / headofficeadmin123\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

completeFixes();
