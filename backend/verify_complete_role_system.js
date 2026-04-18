// ============================================
// COMPLETE ROLE-WISE SYSTEM VERIFICATION
// Smart Construction Management System
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifySystem() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('\n' + '='.repeat(80));
        console.log('🔍 COMPLETE ROLE-WISE SYSTEM VERIFICATION');
        console.log('='.repeat(80) + '\n');

        // ============================================
        // 1. CHECK ALL ROLES IN DATABASE
        // ============================================
        console.log('\n📋 STEP 1: ALL ROLES IN DATABASE');
        console.log('-'.repeat(80));
        
        const [roles] = await connection.query(
            `SELECT id, role_code, role_name, description, level, is_system_role, color
             FROM roles 
             ORDER BY level, id`
        );
        
        console.log(`\nTotal Roles Found: ${roles.length}\n`);
        console.log('ID | Role Code | Role Name | Level | System Role');
        console.log('-'.repeat(80));
        roles.forEach(role => {
            const systemIcon = role.is_system_role ? '✅' : '❌';
            console.log(`${role.id} | ${role.role_code} | ${role.role_name} | ${role.level} | ${systemIcon}`);
        });

        // ============================================
        // 2. CHECK ALL USERS AND THEIR ROLES
        // ============================================
        console.log('\n\n👥 STEP 2: ALL USERS AND THEIR ROLES');
        console.log('-'.repeat(80));
        
        const [users] = await connection.query(
            `SELECT u.id, u.name, u.email, u.role, u.is_approved, u.is_active, 
                    e.assigned_project_id, p.project_name
             FROM users u
             LEFT JOIN employees e ON u.id = e.user_id
             LEFT JOIN projects p ON e.assigned_project_id = p.id
             ORDER BY u.role, u.id`
        );
        
        console.log(`\nTotal Users Found: ${users.length}\n`);
        
        // Group by role
        const usersByRole = {};
        users.forEach(user => {
            if (!usersByRole[user.role]) {
                usersByRole[user.role] = [];
            }
            usersByRole[user.role].push(user);
        });
        
        Object.keys(usersByRole).sort().forEach(role => {
            console.log(`\n📌 Role: ${role} (${usersByRole[role].length} users)`);
            usersByRole[role].forEach(user => {
                const status = user.is_approved ? (user.is_active ? '✅ Active' : '❌ Inactive') : '⏳ Pending';
                const project = user.project_name ? ` → ${user.project_name}` : ' → No Project';
                console.log(`   ${user.id}. ${user.name} (${user.email}) ${status}${project}`);
            });
        });

        // ============================================
        // 3. CHECK WORKFLOW STEPS
        // ============================================
        console.log('\n\n🔄 STEP 3: WORKFLOW STEPS CONFIGURATION');
        console.log('-'.repeat(80));
        
        const [workflows] = await connection.query(
            `SELECT wt.id, wt.entity_type, wt.is_active
             FROM workflow_templates wt
             ORDER BY wt.id`
        );
        
        console.log(`\nWorkflow Templates: ${workflows.length}\n`);
        
        for (const workflow of workflows) {
            console.log(`\n📌 Workflow ID: ${workflow.id} (Type: ${workflow.entity_type}, Active: ${workflow.is_active})`);
            
            const [steps] = await connection.query(
                `SELECT ws.step_number, ws.step_name, r.role_code, r.role_name, ws.action_required
                 FROM workflow_steps ws
                 INNER JOIN roles r ON ws.role_id = r.id
                 WHERE ws.workflow_id = ?
                 ORDER BY ws.step_number`,
                [workflow.id]
            );
            
            if (steps.length > 0) {
                console.log('   Step | Role Code | Role Name | Action');
                console.log('   ' + '-'.repeat(76));
                steps.forEach(step => {
                    console.log(`   ${step.step_number} | ${step.role_code} | ${step.role_name} | ${step.action_required}`);
                });
            } else {
                console.log('   ⚠️ No steps defined!');
            }
        }

        // ============================================
        // 4. CHECK ROLE MISMATCHES
        // ============================================
        console.log('\n\n⚠️ STEP 4: ROLE MISMATCH DETECTION');
        console.log('-'.repeat(80));
        
        // Get all role codes from workflow steps
        const [workflowRoleCodes] = await connection.query(
            `SELECT DISTINCT r.role_code
             FROM workflow_steps ws
             INNER JOIN roles r ON ws.role_id = r.id`
        );
        
        const workflowRoles = workflowRoleCodes.map(r => r.role_code);
        const userRoles = Object.keys(usersByRole);
        
        console.log('\nRoles in Workflow Steps:', workflowRoles.join(', '));
        console.log('Roles with Actual Users:', userRoles.join(', '));
        
        // Find workflow roles without users
        const workflowRolesWithoutUsers = workflowRoles.filter(role => !userRoles.includes(role));
        const userRolesNotInWorkflow = userRoles.filter(role => !workflowRoles.includes(role) && role !== 'admin' && role !== 'employee');
        
        if (workflowRolesWithoutUsers.length > 0) {
            console.log('\n❌ CRITICAL: Workflow roles with NO users:');
            workflowRolesWithoutUsers.forEach(role => {
                console.log(`   → ${role} (Cannot sign in workflow!)`);
            });
        } else {
            console.log('\n✅ All workflow roles have at least one user');
        }
        
        if (userRolesNotInWorkflow.length > 0) {
            console.log('\n⚠️ User roles not in workflow (cannot sign):');
            userRolesNotInWorkflow.forEach(role => {
                console.log(`   → ${role} (${usersByRole[role].length} users affected)`);
            });
        }

        // ============================================
        // 5. CHECK STORED PROCEDURES
        // ============================================
        console.log('\n\n🗄️ STEP 5: STORED PROCEDURES');
        console.log('-'.repeat(80));
        
        const [procedures] = await connection.query(
            `SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED, LAST_ALTERED
             FROM information_schema.ROUTINES
             WHERE ROUTINE_SCHEMA = ?
             ORDER BY ROUTINE_NAME`,
            [process.env.DB_NAME]
        );
        
        console.log(`\nTotal Procedures: ${procedures.length}\n`);
        
        const requiredProcedures = [
            'create_or_add_to_sheet',
            'add_signature_to_sheet',
            'validate_signature_order',
            'generate_sheet_pdf_data'
        ];
        
        const existingProcedures = procedures.map(p => p.ROUTINE_NAME);
        
        requiredProcedures.forEach(proc => {
            if (existingProcedures.includes(proc)) {
                console.log(`✅ ${proc} - EXISTS`);
            } else {
                console.log(`❌ ${proc} - MISSING!`);
            }
        });

        // ============================================
        // 6. CHECK PROJECT ASSIGNMENTS
        // ============================================
        console.log('\n\n🏗️ STEP 6: PROJECT ASSIGNMENTS');
        console.log('-'.repeat(80));
        
        const [projects] = await connection.query(
            `SELECT p.id, p.project_code, p.project_name, p.status,
                    COUNT(DISTINCT e.user_id) as user_count,
                    GROUP_CONCAT(DISTINCT u.role) as roles
             FROM projects p
             LEFT JOIN employees e ON p.id = e.assigned_project_id
             LEFT JOIN users u ON e.user_id = u.id
             GROUP BY p.id
             ORDER BY p.id`
        );
        
        console.log(`\nTotal Projects: ${projects.length}\n`);
        projects.forEach(project => {
            console.log(`📁 Project ${project.id}: ${project.project_name} (${project.project_code})`);
            console.log(`   Status: ${project.status}`);
            console.log(`   Users: ${project.user_count}`);
            console.log(`   Roles: ${project.roles || 'None'}`);
            console.log('');
        });

        // ============================================
        // 7. CHECK VOUCHER AND SHEET STATISTICS
        // ============================================
        console.log('\n\n📊 STEP 7: VOUCHER & SHEET STATISTICS');
        console.log('-'.repeat(80));
        
        const [voucherStats] = await connection.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(amount) as total_amount
             FROM vouchers`
        );
        
        console.log('\n💰 Vouchers:');
        console.log(`   Total: ${voucherStats[0].total}`);
        console.log(`   Pending: ${voucherStats[0].pending}`);
        console.log(`   Approved: ${voucherStats[0].approved}`);
        console.log(`   Rejected: ${voucherStats[0].rejected}`);
        console.log(`   Total Amount: ৳${parseFloat(voucherStats[0].total_amount || 0).toFixed(2)}`);
        
        const [sheetStats] = await connection.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN is_locked = TRUE THEN 1 ELSE 0 END) as locked
             FROM daily_sheets`
        );
        
        console.log('\n📄 Daily Sheets:');
        console.log(`   Total: ${sheetStats[0].total}`);
        console.log(`   Draft: ${sheetStats[0].draft}`);
        console.log(`   Pending: ${sheetStats[0].pending}`);
        console.log(`   Approved: ${sheetStats[0].approved}`);
        console.log(`   Locked: ${sheetStats[0].locked}`);

        // ============================================
        // 8. CHECK SIGNATURE WORKFLOW STATUS
        // ============================================
        console.log('\n\n✍️ STEP 8: SIGNATURE WORKFLOW STATUS');
        console.log('-'.repeat(80));
        
        const [sheetWorkflows] = await connection.query(
            `SELECT sw.id, sw.sheet_id, ds.sheet_no, sw.current_step, sw.status,
                    COUNT(us.id) as signatures_count
             FROM sheet_workflows sw
             INNER JOIN daily_sheets ds ON sw.sheet_id = ds.id
             LEFT JOIN universal_signatures us ON sw.sheet_id = us.entity_id AND us.entity_type = 'sheet'
             GROUP BY sw.id
             ORDER BY sw.id DESC
             LIMIT 10`
        );
        
        if (sheetWorkflows.length > 0) {
            console.log(`\nRecent Sheet Workflows: ${sheetWorkflows.length}\n`);
            sheetWorkflows.forEach(wf => {
                console.log(`Sheet: ${wf.sheet_no} (ID: ${wf.sheet_id})`);
                console.log(`   Status: ${wf.status}, Current Step: ${wf.current_step}, Signatures: ${wf.signatures_count}`);
                console.log('');
            });
        } else {
            console.log('\n⚠️ No sheet workflows found');
        }

        // ============================================
        // 9. CRITICAL ISSUES SUMMARY
        // ============================================
        console.log('\n\n🚨 CRITICAL ISSUES SUMMARY');
        console.log('='.repeat(80));
        
        const issues = [];
        
        // Issue 1: Workflow roles without users
        if (workflowRolesWithoutUsers.length > 0) {
            issues.push({
                severity: 'CRITICAL',
                issue: 'Workflow roles without users',
                details: workflowRolesWithoutUsers.join(', '),
                impact: 'Signature workflow will fail - no users to sign'
            });
        }
        
        // Issue 2: Missing stored procedures
        const missingProcs = requiredProcedures.filter(p => !existingProcedures.includes(p));
        if (missingProcs.length > 0) {
            issues.push({
                severity: 'CRITICAL',
                issue: 'Missing stored procedures',
                details: missingProcs.join(', '),
                impact: 'Auto sheet creation and signature workflow will fail'
            });
        }
        
        // Issue 3: Users without project assignment
        const usersWithoutProject = users.filter(u => !u.assigned_project_id && u.role !== 'admin');
        if (usersWithoutProject.length > 0) {
            issues.push({
                severity: 'HIGH',
                issue: 'Users without project assignment',
                details: `${usersWithoutProject.length} users affected`,
                impact: 'These users cannot see project-filtered data'
            });
        }
        
        // Issue 4: Inactive approved users
        const inactiveApproved = users.filter(u => u.is_approved && !u.is_active);
        if (inactiveApproved.length > 0) {
            issues.push({
                severity: 'MEDIUM',
                issue: 'Approved but inactive users',
                details: `${inactiveApproved.length} users`,
                impact: 'These users cannot login'
            });
        }
        
        if (issues.length > 0) {
            issues.forEach((issue, idx) => {
                const icon = issue.severity === 'CRITICAL' ? '🔴' : issue.severity === 'HIGH' ? '🟠' : '🟡';
                console.log(`\n${idx + 1}. ${icon} ${issue.severity}: ${issue.issue}`);
                console.log(`   Details: ${issue.details}`);
                console.log(`   Impact: ${issue.impact}`);
            });
        } else {
            console.log('\n✅ No critical issues found!');
        }

        // ============================================
        // 10. RECOMMENDATIONS
        // ============================================
        console.log('\n\n💡 RECOMMENDATIONS');
        console.log('='.repeat(80));
        
        console.log('\n1. Role Code Standardization:');
        console.log('   - Align registration roles with workflow signature roles');
        console.log('   - Decide: Use head_office_accounts OR head_office_accounts_1/2');
        
        console.log('\n2. User Assignment:');
        if (workflowRolesWithoutUsers.length > 0) {
            console.log('   - Create user accounts for missing workflow roles:');
            workflowRolesWithoutUsers.forEach(role => {
                console.log(`     * ${role}`);
            });
        }
        
        console.log('\n3. Stored Procedures:');
        if (missingProcs.length > 0) {
            console.log('   - Run database migration to create missing procedures');
            console.log('   - File: database/PRODUCTION_erp_automation.sql');
        }
        
        console.log('\n4. Permission Enforcement:');
        console.log('   - Add role-based middleware to voucher creation route');
        console.log('   - Restrict sheet creation to authorized roles only');
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ VERIFICATION COMPLETE');
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('\n❌ Error during verification:', error.message);
        console.error(error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verifySystem();
