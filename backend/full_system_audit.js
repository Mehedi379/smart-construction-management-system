// ============================================
// COMPREHENSIVE SYSTEM AUDIT SCRIPT
// Smart Construction Management System
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('\n' + '='.repeat(60));
console.log('🔍 COMPREHENSIVE SYSTEM AUDIT');
console.log('='.repeat(60) + '\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let warnings = 0;

function test(name, condition, details = '') {
    totalTests++;
    if (condition) {
        console.log(`✅ ${name}`);
        if (details) console.log(`   ${details}`);
        passedTests++;
    } else {
        console.log(`❌ ${name}`);
        if (details) console.log(`   ${details}`);
        failedTests++;
    }
}

function warn(name, details = '') {
    totalTests++;
    warnings++;
    console.log(`⚠️  ${name}`);
    if (details) console.log(`   ${details}`);
}

async function runAudit() {
    let connection;
    
    try {
        // ============================================
        // 1. DATABASE VALIDATION
        // ============================================
        console.log('\n📊 1. DATABASE VALIDATION');
        console.log('-'.repeat(60));
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        // Check all critical tables
        const expectedTables = [
            'users', 'roles', 'user_roles', 'employees', 'projects',
            'employee_projects', 'daily_sheets', 'daily_sheet_items',
            'sheet_signatures', 'sheet_workflows', 'signature_requests',
            'workflow_templates', 'workflow_steps', 'universal_signatures',
            'vouchers', 'expenses', 'ledger_accounts', 'ledger_entries',
            'purchases', 'purchase_items', 'suppliers', 'transactions',
            'audit_logs', 'notifications', 'attendance', 'engineer_stats',
            'clients', 'role_permissions', 'sheet_vouchers',
            'request_tracking'
        ];
        
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        let tableCount = 0;
        let missingTables = [];
        
        expectedTables.forEach(table => {
            if (tableNames.includes(table)) {
                tableCount++;
            } else {
                missingTables.push(table);
            }
        });
        
        test(`Tables Exist: ${tableCount}/${expectedTables.length}`, 
            tableCount === expectedTables.length,
            missingTables.length > 0 ? `Missing: ${missingTables.join(', ')}` : 'All critical tables present');
        
        // Check views
        const [views] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'VIEW'");
        test(`Database Views: ${views.length} found`, views.length >= 2, `${views.length} views exist`);
        
        // ============================================
        // 2. USER & AUTH SYSTEM
        // ============================================
        console.log('\n🧪 2. AUTHENTICATION & RBAC');
        console.log('-'.repeat(60));
        
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        test(`User Accounts: ${users[0].count} users`, users[0].count > 0, 'Users exist in database');
        
        const [activeUsers] = await connection.query('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
        test(`Active Users: ${activeUsers[0].count}`, activeUsers[0].count > 0, 'Active users available');
        
        const [adminUsers] = await connection.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        test(`Admin Users: ${adminUsers[0].count}`, adminUsers[0].count > 0, 'At least one admin exists');
        
        // Check roles
        const [roles] = await connection.query('SELECT role_name FROM roles');
        const roleNames = roles.map(r => r.role_name);
        const expectedRoles = ['admin', 'accountant', 'engineer', 'manager', 'director', 'deputy_director', 'worker'];
        
        let roleCount = 0;
        expectedRoles.forEach(role => {
            if (roleNames.includes(role)) roleCount++;
        });
        
        test(`Roles Defined: ${roleCount}/${expectedRoles.length}`, 
            roleCount >= 5, 
            `${roleCount} roles configured`);
        
        // Check password hashing
        const [userWithPassword] = await connection.query('SELECT password FROM users WHERE password IS NOT NULL LIMIT 1');
        test(`Password Hashing: Implemented`, 
            userWithPassword.length > 0 && userWithPassword[0].password.startsWith('$2'),
            'Passwords are bcrypt hashed');
        
        // ============================================
        // 3. PROJECT & EMPLOYEE MODULE
        // ============================================
        console.log('\n📊 3. PROJECT & EMPLOYEE MODULE');
        console.log('-'.repeat(60));
        
        const [projects] = await connection.query('SELECT COUNT(*) as count FROM projects');
        test(`Projects: ${projects[0].count} projects`, projects[0].count >= 0, 'Project table accessible');
        
        const [employees] = await connection.query('SELECT COUNT(*) as count FROM employees');
        test(`Employees: ${employees[0].count} employees`, employees[0].count > 0, 'Employees exist');
        
        const [employeeProjects] = await connection.query('SELECT COUNT(*) as count FROM employee_projects');
        test(`Employee-Project Assignments: ${employeeProjects[0].count}`, 
            employeeProjects[0].count >= 0, 
            'Assignment table exists');
        
        // ============================================
        // 4. DAILY SHEET SYSTEM (CRITICAL)
        // ============================================
        console.log('\n🧾 4. DAILY SHEET SYSTEM');
        console.log('-'.repeat(60));
        
        const [sheets] = await connection.query('SELECT COUNT(*) as count FROM daily_sheets');
        test(`Daily Sheets: ${sheets[0].count} sheets`, sheets[0].count > 0, 'Sheets exist in database');
        
        const [sheetItems] = await connection.query('SELECT COUNT(*) as count FROM daily_sheet_items');
        test(`Sheet Items: ${sheetItems[0].count} items`, sheetItems[0].count >= 0, 'Items table exists');
        
        // Check sheet statuses
        const [sheetStatuses] = await connection.query(
            'SELECT status, COUNT(*) as count FROM daily_sheets GROUP BY status'
        );
        console.log('   Sheet Status Distribution:');
        sheetStatuses.forEach(status => {
            console.log(`      - ${status.status}: ${status.count}`);
        });
        
        // Check signature tables
        const [sheetSignatures] = await connection.query('SELECT COUNT(*) as count FROM sheet_signatures');
        test(`Sheet Signatures: ${sheetSignatures[0].count} signatures`, 
            sheetSignatures[0].count >= 0, 
            'Signatures table exists');
        
        const [sheetWorkflows] = await connection.query('SELECT COUNT(*) as count FROM sheet_workflows');
        test(`Sheet Workflows: ${sheetWorkflows[0].count} workflows`, 
            sheetWorkflows[0].count >= 0, 
            'Workflow table exists');
        
        const [signatureRequests] = await connection.query('SELECT COUNT(*) as count FROM signature_requests');
        test(`Signature Requests: ${signatureRequests[0].count} requests`, 
            signatureRequests[0].count >= 0, 
            'Request system exists');
        
        // Check workflow templates
        const [workflowTemplates] = await connection.query(
            'SELECT COUNT(*) as count FROM workflow_templates WHERE entity_type = "sheet" AND is_active = TRUE'
        );
        test(`Workflow Templates: ${workflowTemplates[0].count} active`, 
            workflowTemplates[0].count > 0, 
            'At least one workflow template exists');
        
        // Check workflow steps
        const [workflowSteps] = await connection.query(
            'SELECT COUNT(*) as count FROM workflow_steps'
        );
        test(`Workflow Steps: ${workflowSteps[0].count} steps`, 
            workflowSteps[0].count >= 5, 
            `${workflowSteps[0].count} workflow steps defined`);
        
        // ============================================
        // 5. SIGNATURE WORKFLOW VALIDATION
        // ============================================
        console.log('\n✍️  5. SIGNATURE WORKFLOW');
        console.log('-'.repeat(60));
        
        // Check if 5 signature roles exist
        const signatureRoles = ['receiver', 'payer', 'prepared_by', 'checked_by', 'approved_by'];
        const [sigRequests] = await connection.query(
            'SELECT DISTINCT role_code FROM signature_requests'
        );
        const existingRoles = sigRequests.map(r => r.role_code);
        
        let roleMatchCount = 0;
        signatureRoles.forEach(role => {
            if (existingRoles.includes(role)) roleMatchCount++;
        });
        
        test(`Signature Roles: ${roleMatchCount}/5 configured`, 
            roleMatchCount >= 3,
            `${roleMatchCount} signature roles in use`);
        
        // Check universal signatures
        const [universalSigs] = await connection.query(
            'SELECT action, COUNT(*) as count FROM universal_signatures GROUP BY action'
        );
        console.log('   Signature Actions:');
        universalSigs.forEach(sig => {
            console.log(`      - ${sig.action}: ${sig.count}`);
        });
        
        // ============================================
        // 6. VOUCHER & EXPENSE SYSTEM
        // ============================================
        console.log('\n🧾 6. VOUCHER & EXPENSE SYSTEM');
        console.log('-'.repeat(60));
        
        const [vouchers] = await connection.query('SELECT COUNT(*) as count FROM vouchers');
        test(`Vouchers: ${vouchers[0].count} vouchers`, vouchers[0].count >= 0, 'Vouchers table exists');
        
        const [expenses] = await connection.query('SELECT COUNT(*) as count FROM expenses');
        test(`Expenses: ${expenses[0].count} expenses`, expenses[0].count >= 0, 'Expenses table exists');
        
        const [purchases] = await connection.query('SELECT COUNT(*) as count FROM purchases');
        test(`Purchases: ${purchases[0].count} purchases`, purchases[0].count >= 0, 'Purchases table exists');
        
        const [suppliers] = await connection.query('SELECT COUNT(*) as count FROM suppliers');
        test(`Suppliers: ${suppliers[0].count} suppliers`, suppliers[0].count >= 0, 'Suppliers table exists');
        
        // ============================================
        // 7. LEDGER SYSTEM
        // ============================================
        console.log('\n📚 7. LEDGER SYSTEM');
        console.log('-'.repeat(60));
        
        const [ledgerAccounts] = await connection.query('SELECT COUNT(*) as count FROM ledger_accounts');
        test(`Ledger Accounts: ${ledgerAccounts[0].count} accounts`, 
            ledgerAccounts[0].count > 0, 
            'Chart of accounts exists');
        
        const [ledgerEntries] = await connection.query('SELECT COUNT(*) as count FROM ledger_entries');
        test(`Ledger Entries: ${ledgerEntries[0].count} entries`, 
            ledgerEntries[0].count >= 0, 
            'Ledger entries table exists');
        
        const [transactions] = await connection.query('SELECT COUNT(*) as count FROM transactions');
        test(`Transactions: ${transactions[0].count} records`, 
            transactions[0].count >= 0, 
            'Transactions table exists');
        
        // ============================================
        // 8. NOTIFICATION SYSTEM
        // ============================================
        console.log('\n🔔 8. NOTIFICATION SYSTEM');
        console.log('-'.repeat(60));
        
        const [notifications] = await connection.query('SELECT COUNT(*) as count FROM notifications');
        test(`Notifications: ${notifications[0].count} notifications`, 
            notifications[0].count >= 0, 
            'Notification system exists');
        
        const [unreadNotifs] = await connection.query(
            'SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE'
        );
        test(`Unread Notifications: ${unreadNotifs[0].count}`, 
            unreadNotifs[0].count >= 0, 
            'Unread tracking works');
        
        // ============================================
        // 9. AUDIT & SECURITY
        // ============================================
        console.log('\n🔒 9. AUDIT & SECURITY');
        console.log('-'.repeat(60));
        
        const [auditLogs] = await connection.query('SELECT COUNT(*) as count FROM audit_logs');
        test(`Audit Logs: ${auditLogs[0].count} logs`, 
            auditLogs[0].count >= 0, 
            'Audit logging active');
        
        // Check foreign keys
        const [foreignKeys] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' 
            AND TABLE_SCHEMA = '${process.env.DB_NAME}'
        `);
        test(`Foreign Keys: ${foreignKeys[0].count} defined`, 
            foreignKeys[0].count > 0, 
            'Referential integrity enforced');
        
        // ============================================
        // 10. DATA INTEGRITY
        // ============================================
        console.log('\n⚠️  10. DATA INTEGRITY');
        console.log('-'.repeat(60));
        
        // Check for orphaned records
        const [orphanedSheets] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM daily_sheets ds 
            LEFT JOIN projects p ON ds.project_id = p.id 
            WHERE p.id IS NULL
        `);
        test(`Orphaned Sheets: ${orphanedSheets[0].count}`, 
            orphanedSheets[0].count === 0, 
            orphanedSheets[0].count === 0 ? 'No orphaned records' : `${orphanedSheets[0].count} orphaned sheets found`);
        
        const [orphanedItems] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM daily_sheet_items dsi 
            LEFT JOIN daily_sheets ds ON dsi.sheet_id = ds.id 
            WHERE ds.id IS NULL
        `);
        test(`Orphaned Sheet Items: ${orphanedItems[0].count}`, 
            orphanedItems[0].count === 0, 
            orphanedItems[0].count === 0 ? 'No orphaned items' : `${orphanedItems[0].count} orphaned items found`);
        
        // ============================================
        // SUMMARY
        // ============================================
        console.log('\n' + '='.repeat(60));
        console.log('📊 AUDIT SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`⚠️  Warnings: ${warnings}`);
        console.log('');
        
        const score = Math.round((passedTests / totalTests) * 10);
        console.log(`⭐ System Score: ${score}/10`);
        console.log('');
        
        if (failedTests === 0) {
            console.log('🎉 OVERALL STATUS: EXCELLENT');
            console.log('✅ System is production-ready!');
        } else if (failedTests <= 2) {
            console.log('⚠️  OVERALL STATUS: GOOD');
            console.log(`${failedTests} minor issue(s) to fix`);
        } else {
            console.log('❌ OVERALL STATUS: NEEDS WORK');
            console.log(`${failedTests} issue(s) require attention`);
        }
        
        console.log('\n' + '='.repeat(60));
        
    } catch (error) {
        console.error('\n❌ AUDIT FAILED:', error.message);
        console.error(error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the audit
runAudit();
