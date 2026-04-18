// ============================================
// COMPLETE SYSTEM CHECK BEFORE RESTART
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('\n' + '='.repeat(60));
console.log('🔍 COMPLETE SYSTEM CHECK');
console.log('='.repeat(60) + '\n');

async function checkSystem() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Database Connection: OK\n');
        
        // 1. Check Users
        console.log('👥 1. USERS & ROLES');
        console.log('-'.repeat(60));
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
        console.log(`   Active Users: ${users[0].count}`);
        
        const [adminUsers] = await connection.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = TRUE");
        console.log(`   Admin Users: ${adminUsers[0].count}`);
        
        const [deputyUsers] = await connection.query("SELECT COUNT(*) as count FROM users WHERE role = 'deputy_director' AND is_active = TRUE");
        console.log(`   Deputy Directors: ${deputyUsers[0].count}`);
        console.log('');
        
        // 2. Check Projects
        console.log('📊 2. PROJECTS');
        console.log('-'.repeat(60));
        const [projects] = await connection.query('SELECT COUNT(*) as count FROM projects');
        console.log(`   Total Projects: ${projects[0].count}`);
        console.log('');
        
        // 3. Check Employees
        console.log('👷 3. EMPLOYEES');
        console.log('-'.repeat(60));
        const [employees] = await connection.query('SELECT COUNT(*) as count FROM employees');
        console.log(`   Total Employees: ${employees[0].count}`);
        console.log('');
        
        // 4. Check Daily Sheets
        console.log('📝 4. DAILY SHEETS');
        console.log('-'.repeat(60));
        const [sheets] = await connection.query('SELECT COUNT(*) as count FROM daily_sheets');
        console.log(`   Total Sheets: ${sheets[0].count}`);
        
        const [sheetStatuses] = await connection.query('SELECT status, COUNT(*) as count FROM daily_sheets GROUP BY status');
        sheetStatuses.forEach(s => console.log(`   - ${s.status || 'draft'}: ${s.count}`));
        console.log('');
        
        // 5. Check Workflows
        console.log('🔄 5. WORKFLOWS');
        console.log('-'.repeat(60));
        const [workflows] = await connection.query('SELECT COUNT(*) as count FROM sheet_workflows');
        console.log(`   Sheet Workflows: ${workflows[0].count}`);
        
        const [workflowTemplates] = await connection.query('SELECT COUNT(*) as count FROM workflow_templates WHERE is_active = TRUE');
        console.log(`   Active Templates: ${workflowTemplates[0].count}`);
        console.log('');
        
        // 6. Check Signature Requests
        console.log('✍️  6. SIGNATURE REQUESTS');
        console.log('-'.repeat(60));
        const [sigRequests] = await connection.query('SELECT COUNT(*) as count FROM signature_requests');
        console.log(`   Total Requests: ${sigRequests[0].count}`);
        
        const [requestedStatus] = await connection.query("SELECT COUNT(*) as count FROM signature_requests WHERE status = 'requested'");
        console.log(`   Pending Signatures (requested): ${requestedStatus[0].count}`);
        
        const [signedStatus] = await connection.query("SELECT COUNT(*) as count FROM signature_requests WHERE status = 'signed'");
        console.log(`   Completed Signatures (signed): ${signedStatus[0].count}`);
        
        // Check by role
        const [byRole] = await connection.query(`
            SELECT role_code, 
                   SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END) as pending,
                   SUM(CASE WHEN status = 'signed' THEN 1 ELSE 0 END) as signed
            FROM signature_requests 
            GROUP BY role_code
        `);
        console.log('\n   By Role:');
        byRole.forEach(r => console.log(`   - ${r.role_code}: ${r.pending} pending, ${r.signed} signed`));
        console.log('');
        
        // 7. Check Vouchers
        console.log('🧾 7. VOUCHERS');
        console.log('-'.repeat(60));
        const [vouchers] = await connection.query('SELECT COUNT(*) as count FROM vouchers');
        console.log(`   Total Vouchers: ${vouchers[0].count}`);
        console.log('');
        
        // 8. Check Expenses
        console.log('💰 8. EXPENSES');
        console.log('-'.repeat(60));
        const [expenses] = await connection.query('SELECT COUNT(*) as count FROM expenses');
        console.log(`   Total Expenses: ${expenses[0].count}`);
        console.log('');
        
        // 9. Check Ledger
        console.log('📚 9. LEDGER');
        console.log('-'.repeat(60));
        const [accounts] = await connection.query('SELECT COUNT(*) as count FROM ledger_accounts');
        console.log(`   Ledger Accounts: ${accounts[0].count}`);
        
        const [entries] = await connection.query('SELECT COUNT(*) as count FROM ledger_entries');
        console.log(`   Ledger Entries: ${entries[0].count}`);
        console.log('');
        
        // 10. Check Notifications
        console.log('🔔 10. NOTIFICATIONS');
        console.log('-'.repeat(60));
        const [notifications] = await connection.query('SELECT COUNT(*) as count FROM notifications');
        console.log(`   Total Notifications: ${notifications[0].count}`);
        
        const [unread] = await connection.query('SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE');
        console.log(`   Unread: ${unread[0].count}`);
        console.log('');
        
        // 11. Data Integrity
        console.log('✅ 11. DATA INTEGRITY');
        console.log('-'.repeat(60));
        
        // Check orphaned sheets
        const [orphanedSheets] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM daily_sheets ds 
            LEFT JOIN projects p ON ds.project_id = p.id 
            WHERE p.id IS NULL
        `);
        console.log(`   Orphaned Sheets: ${orphanedSheets[0].count === 0 ? '✅ None' : `❌ ${orphanedSheets[0].count} found`}`);
        
        // Check sheets without workflows
        const [sheetsWithoutWorkflow] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM daily_sheets ds 
            LEFT JOIN sheet_workflows sw ON ds.id = sw.sheet_id 
            WHERE sw.id IS NULL
        `);
        console.log(`   Sheets Without Workflow: ${sheetsWithoutWorkflow[0].count === 0 ? '✅ None' : `❌ ${sheetsWithoutWorkflow[0].count} found`}`);
        
        // Check signature requests without workflows
        const [requestsWithoutWorkflow] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM signature_requests sr 
            LEFT JOIN sheet_workflows sw ON sr.sheet_id = sw.sheet_id 
            WHERE sw.id IS NULL
        `);
        console.log(`   Requests Without Workflow: ${requestsWithoutWorkflow[0].count === 0 ? '✅ None' : `❌ ${requestsWithoutWorkflow[0].count} found`}`);
        
        console.log('');
        console.log('='.repeat(60));
        console.log('📊 SYSTEM CHECK SUMMARY');
        console.log('='.repeat(60));
        console.log('');
        console.log('✅ Database: Connected');
        console.log(`✅ Users: ${users[0].count} active`);
        console.log(`✅ Projects: ${projects[0].count}`);
        console.log(`✅ Daily Sheets: ${sheets[0].count}`);
        console.log(`✅ Workflows: ${workflows[0].count}`);
        console.log(`✅ Signature Requests: ${sigRequests[0].count} (${requestedStatus[0].count} pending)`);
        console.log(`✅ Vouchers: ${vouchers[0].count}`);
        console.log(`✅ Employees: ${employees[0].count}`);
        console.log('');
        
        if (sheetsWithoutWorkflow[0].count === 0 && orphanedSheets[0].count === 0) {
            console.log('🎉 SYSTEM STATUS: ✅ ALL GOOD!');
            console.log('');
            console.log('📋 Ready for restart!');
        } else {
            console.log('⚠️  SYSTEM STATUS: NEEDS ATTENTION');
            console.log('');
            console.log('Issues found - check above for details');
        }
        
        console.log('');
        
    } catch (error) {
        console.error('\n❌ SYSTEM CHECK FAILED:', error.message);
        console.error(error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the check
checkSystem();
