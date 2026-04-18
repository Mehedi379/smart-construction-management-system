// ============================================
// APPLY ALL SYSTEM FIXES
// Smart Construction Management System
// ============================================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyFixes() {
    let connection;
    
    try {
        console.log('\n' + '='.repeat(80));
        console.log('🔧 APPLYING ALL SYSTEM FIXES');
        console.log('='.repeat(80) + '\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        console.log('✅ Connected to database\n');

        // Read and execute the SQL migration file
        const sqlFilePath = path.join(__dirname, '../database/FIX_ALL_ROLE_WORKFLOW_ISSUES.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('📝 Executing migration script...\n');
        
        // Execute the migration
        const results = await connection.query(sqlContent);
        
        console.log('\n✅ Migration script executed successfully!\n');

        // ============================================
        // VERIFY THE FIXES
        // ============================================
        console.log('\n' + '='.repeat(80));
        console.log('🔍 VERIFYING FIXES');
        console.log('='.repeat(80) + '\n');

        // 1. Check Workflow Templates
        console.log('📋 1. Workflow Templates:');
        const [templates] = await connection.query(
            'SELECT id, entity_type, is_active FROM workflow_templates ORDER BY id'
        );
        
        if (templates.length > 0) {
            templates.forEach(t => {
                console.log(`   ✅ Template ${t.id}: ${t.entity_type} (${t.is_active ? 'Active' : 'Inactive'})`);
            });
        } else {
            console.log('   ❌ No workflow templates found!');
        }

        // 2. Check Workflow Steps
        console.log('\n📋 2. Workflow Steps (Sheet Approval):');
        const [steps] = await connection.query(
            `SELECT ws.step_number, r.role_code, r.role_name, ws.step_name
             FROM workflow_steps ws
             INNER JOIN roles r ON ws.role_id = r.id
             WHERE ws.workflow_id = 2
             ORDER BY ws.step_number`
        );
        
        if (steps.length > 0) {
            console.log('   6-Step Approval Chain:');
            steps.forEach((step, idx) => {
                const arrow = idx < steps.length - 1 ? ' →' : '';
                console.log(`   Step ${step.step_number}: ${step.role_code} (${step.role_name}) ${arrow}`);
            });
        } else {
            console.log('   ❌ No workflow steps found!');
        }

        // 3. Check Role Distribution
        console.log('\n📋 3. Users by Role (Active Only):');
        const [roleDistribution] = await connection.query(
            `SELECT role, COUNT(*) as count
             FROM users
             WHERE is_active = TRUE
             GROUP BY role
             ORDER BY role`
        );
        
        roleDistribution.forEach(r => {
            console.log(`   ${r.role}: ${r.count} user(s)`);
        });

        // 4. Check head_office_accounts users
        console.log('\n📋 4. Head Office Accounts Users:');
        const [hoAccounts] = await connection.query(
            `SELECT id, name, email, role, is_active
             FROM users
             WHERE role = 'head_office_accounts'`
        );
        
        if (hoAccounts.length > 0) {
            hoAccounts.forEach(u => {
                console.log(`   ✅ ${u.name} (${u.email}) - Role: ${u.role}`);
            });
        } else {
            console.log('   ⚠️ No head_office_accounts users found');
        }

        // 5. Check head_office_admin user
        console.log('\n📋 5. Head Office Admin User:');
        const [hoAdmin] = await connection.query(
            `SELECT id, name, email, role, is_active
             FROM users
             WHERE role = 'head_office_admin'`
        );
        
        if (hoAdmin.length > 0) {
            hoAdmin.forEach(u => {
                console.log(`   ✅ ${u.name} (${u.email}) - Role: ${u.role}`);
            });
        } else {
            console.log('   ❌ No head_office_admin user found - Manual creation needed');
        }

        // 6. Check Sheets with Workflows
        console.log('\n📋 6. Sheets with Workflows:');
        const [sheetsWithWorkflow] = await connection.query(
            `SELECT ds.id, ds.sheet_no, ds.status, sw.current_step, sw.workflow_status
             FROM daily_sheets ds
             LEFT JOIN sheet_workflows sw ON ds.id = sw.sheet_id
             ORDER BY ds.id DESC
             LIMIT 5`
        );
        
        if (sheetsWithWorkflow.length > 0) {
            sheetsWithWorkflow.forEach(s => {
                const hasWorkflow = s.current_step ? `✅ Step ${s.current_step}` : '❌ No workflow';
                console.log(`   Sheet ${s.sheet_no}: ${s.status} - ${hasWorkflow}`);
            });
        } else {
            console.log('   ⚠️ No sheets found');
        }

        // 7. Check Signature Requests
        console.log('\n📋 7. Signature Requests:');
        const [sigRequests] = await connection.query(
            `SELECT status, COUNT(*) as count
             FROM signature_requests
             GROUP BY status`
        );
        
        if (sigRequests.length > 0) {
            sigRequests.forEach(sr => {
                console.log(`   ${sr.status}: ${sr.count} requests`);
            });
        } else {
            console.log('   ⚠️ No signature requests found');
        }

        // 8. Critical Issues Check
        console.log('\n' + '='.repeat(80));
        console.log('🚨 CRITICAL ISSUES CHECK');
        console.log('='.repeat(80) + '\n');

        const issues = [];

        // Check if workflow templates exist
        if (templates.length === 0) {
            issues.push('CRITICAL: No workflow templates in database');
        }

        // Check if head_office_accounts has users
        if (hoAccounts.length === 0) {
            issues.push('CRITICAL: No users with head_office_accounts role');
        }

        // Check if head_office_admin has users
        if (hoAdmin.length === 0) {
            issues.push('HIGH: No users with head_office_admin role');
        }

        // Check if any sheets have workflows
        const [sheetWorkflowCount] = await connection.query(
            'SELECT COUNT(*) as count FROM sheet_workflows'
        );
        
        if (sheetWorkflowCount[0].count === 0) {
            issues.push('MEDIUM: No sheets have active workflows');
        }

        if (issues.length > 0) {
            console.log('⚠️ Remaining Issues:\n');
            issues.forEach((issue, idx) => {
                console.log(`   ${idx + 1}. ${issue}`);
            });
            console.log('\n');
        } else {
            console.log('✅ No critical issues found!\n');
        }

        // ============================================
        // NEXT STEPS
        // ============================================
        console.log('='.repeat(80));
        console.log('📝 NEXT STEPS (Manual Actions Required)');
        console.log('='.repeat(80) + '\n');

        console.log('1. UPDATE BACKEND ROUTES - Add permission middleware:');
        console.log('   File: backend/src/routes/vouchers.js');
        console.log('   Add: authorize("admin", "accountant") to POST route\n');

        console.log('2. UPDATE VOUCHER APPROVAL LOGIC:');
        console.log('   File: backend/src/controllers/voucherController.js');
        console.log('   Change line 106 to allow accountant approval\n');

        console.log('3. SET PASSWORD FOR head_office_admin:');
        console.log('   Run: node backend/set_admin_password.js\n');

        console.log('4. RESTART BACKEND SERVER:');
        console.log('   cd backend && npm run dev\n');

        console.log('5. TEST COMPLETE FLOW:');
        console.log('   - Create voucher as admin/accountant');
        console.log('   - Approve voucher');
        console.log('   - Verify auto sheet creation');
        console.log('   - Check signature workflow started');
        console.log('   - Test sequential signing (all 6 steps)\n');

        console.log('='.repeat(80));
        console.log('✅ FIX APPLICATION COMPLETE');
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('\n❌ Error applying fixes:', error.message);
        console.error(error.stack);
        
        if (connection) {
            try {
                await connection.rollback();
                console.log('\n🔄 Transaction rolled back');
            } catch (rollbackError) {
                console.error('Rollback error:', rollbackError.message);
            }
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed\n');
        }
    }
}

applyFixes();
