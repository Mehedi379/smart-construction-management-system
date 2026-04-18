// Check Database Status
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
    let connection;
    
    try {
        console.log('\n' + '='.repeat(60));
        console.log('🔍 CHECKING DATABASE STATUS');
        console.log('='.repeat(60) + '\n');

        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('✅ Connected to database\n');

        // Check projects
        console.log('1️⃣  PROJECTS:');
        const [projects] = await connection.query('SELECT id, project_code, project_name, status, estimated_budget FROM projects');
        console.log(`   Total: ${projects.length}`);
        if (projects.length > 0) {
            projects.forEach(p => {
                console.log(`   - ${p.project_name} (${p.project_code}): ৳${p.estimated_budget.toLocaleString()} [${p.status}]`);
            });
        } else {
            console.log('   ⚠️  NO PROJECTS FOUND!');
        }

        // Check employees
        console.log('\n2️⃣  EMPLOYEES:');
        const [employees] = await connection.query(`
            SELECT e.id, e.employee_id, e.name, e.status, p.project_name
            FROM employees e
            LEFT JOIN projects p ON e.assigned_project_id = p.id
        `);
        console.log(`   Total: ${employees.length}`);
        if (employees.length > 0) {
            employees.slice(0, 5).forEach(emp => {
                console.log(`   - ${emp.name} (${emp.employee_id}): ${emp.project_name || 'No project'}`);
            });
            if (employees.length > 5) console.log(`   ... and ${employees.length - 5} more`);
        } else {
            console.log('   ⚠️  NO EMPLOYEES FOUND!');
        }

        // Check expenses
        console.log('\n3️⃣  EXPENSES:');
        const [expenses] = await connection.query('SELECT id, amount, category, expense_date FROM expenses ORDER BY id DESC LIMIT 5');
        const [expenseTotal] = await connection.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
        console.log(`   Total: ৳${parseFloat(expenseTotal[0].total).toLocaleString()}`);
        if (expenses.length > 0) {
            expenses.forEach(exp => {
                console.log(`   - ৳${exp.amount.toLocaleString()} (${exp.category}) - ${exp.expense_date}`);
            });
        } else {
            console.log('   ⚠️  NO EXPENSES FOUND!');
        }

        // Check vouchers
        console.log('\n4️⃣  VOUCHERS:');
        const [vouchers] = await connection.query('SELECT id, voucher_type, amount, status FROM vouchers ORDER BY id DESC LIMIT 5');
        const [voucherTotal] = await connection.query('SELECT COALESCE(SUM(amount), 0) as total FROM vouchers WHERE voucher_type = "receipt" AND status = "approved"');
        console.log(`   Total Income (Approved Receipts): ৳${parseFloat(voucherTotal[0].total).toLocaleString()}`);
        if (vouchers.length > 0) {
            vouchers.forEach(v => {
                console.log(`   - ৳${v.amount.toLocaleString()} (${v.voucher_type}) [${v.status}]`);
            });
        } else {
            console.log('   ⚠️  NO VOUCHERS FOUND!');
        }

        // Check users
        console.log('\n5️⃣  USERS:');
        const [users] = await connection.query('SELECT id, name, email, role, is_approved, is_active FROM users WHERE role = "admin"');
        console.log(`   Admin Users: ${users.length}`);
        users.forEach(u => {
            console.log(`   - ${u.name} (${u.email}) [Approved: ${u.is_approved}, Active: ${u.is_active}]`);
        });

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY:');
        console.log('='.repeat(60));
        console.log(`   Projects: ${projects.length}`);
        console.log(`   Employees: ${employees.length}`);
        console.log(`   Total Expenses: ৳${parseFloat(expenseTotal[0].total).toLocaleString()}`);
        console.log(`   Total Income: ৳${parseFloat(voucherTotal[0].total).toLocaleString()}`);
        console.log('='.repeat(60) + '\n');

        if (projects.length === 0) {
            console.log('⚠️  WARNING: No projects found in database!');
            console.log('💡 This is why dashboard shows "All Projects: 0"');
            console.log('\n📝 To add projects:');
            console.log('   1. Login as admin');
            console.log('   2. Go to Projects page');
            console.log('   3. Click "New Project" button');
            console.log('   4. Fill in project details and save');
            console.log('');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) await connection.end();
    }
}

checkDatabase();
