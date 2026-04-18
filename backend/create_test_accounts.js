// ============================================
// CREATE TEST ACCOUNTS FOR ALL ROLES
// Smart Construction Management System
// ============================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const TEST_PASSWORD = '123456';

const testAccounts = [
    {
        name: 'System Admin',
        email: 'admin@test.com',
        role: 'admin',
        designation: 'Administrator',
        category: 'Management',
        department: 'Head Office',
        phone: '01700000001'
    },
    {
        name: 'Head Accountant',
        email: 'accountant@test.com',
        role: 'accountant',
        designation: 'Senior Accountant',
        category: 'Accounts',
        department: 'Finance',
        phone: '01700000002'
    },
    {
        name: 'Site Manager',
        email: 'sitemanager@test.com',
        role: 'site_manager',
        designation: 'Site Manager',
        category: 'Management',
        department: 'Site Operations',
        phone: '01700000003'
    },
    {
        name: 'Site Engineer',
        email: 'engineer@test.com',
        role: 'engineer',
        designation: 'Site Engineer',
        category: 'Engineer',
        department: 'Engineering',
        phone: '01700000004'
    },
    {
        name: 'Project Director',
        email: 'director@test.com',
        role: 'project_director',
        designation: 'Project Director',
        category: 'Management',
        department: 'Executive',
        phone: '01700000005'
    },
    {
        name: 'Deputy Director',
        email: 'deputydirector@test.com',
        role: 'deputy_director',
        designation: 'Deputy Director',
        category: 'Management',
        department: 'Executive',
        phone: '01700000006'
    },
    {
        name: 'Test Worker',
        email: 'worker@test.com',
        role: 'worker',
        designation: 'Raj Mistri',
        category: 'Labor',
        department: 'Construction',
        phone: '01700000007'
    }
];

async function createTestAccounts() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     CREATING TEST ACCOUNTS FOR ALL ROLES               ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    let connection;

    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'construction_db'
        });

        console.log('✅ Database connected\n');

        // Get available project
        const [projects] = await connection.query('SELECT id, project_name FROM projects LIMIT 1');
        const projectId = projects.length > 0 ? projects[0].id : null;
        const projectName = projects.length > 0 ? projects[0].project_name : 'No Project';

        console.log(`📁 Available Project: ${projectName} (ID: ${projectId})\n`);

        // Hash password once
        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

        console.log('Creating test accounts...\n');

        for (const account of testAccounts) {
            console.log(`👤 Creating ${account.role}: ${account.email}`);

            try {
                // Check if user already exists
                const [existing] = await connection.query(
                    'SELECT id FROM users WHERE email = ?',
                    [account.email]
                );

                if (existing.length > 0) {
                    console.log(`   ⏭️  User already exists, skipping\n`);
                    continue;
                }

                // Create user (approved and active)
                const [userResult] = await connection.query(
                    `INSERT INTO users (
                        name, email, password, phone, role,
                        is_approved, is_active, status
                    ) VALUES (?, ?, ?, ?, ?, TRUE, TRUE, 'active')`,
                    [
                        account.name,
                        account.email,
                        hashedPassword,
                        account.phone,
                        account.role
                    ]
                );

                const userId = userResult.insertId;
                const employeeId = `EMP${String(userId).padStart(4, '0')}`;

                // Create employee record
                await connection.query(
                    `INSERT INTO employees (
                        user_id, employee_id, name, phone,
                        designation, category, department,
                        assigned_project_id, status, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL)`,
                    [
                        userId,
                        employeeId,
                        account.name,
                        account.phone,
                        account.designation,
                        account.category,
                        account.department,
                        projectId
                    ]
                );

                console.log(`   ✅ Created (User ID: ${userId}, Employee ID: ${employeeId})\n`);

            } catch (error) {
                console.error(`   ❌ Error: ${error.message}\n`);
            }
        }

        // Display all test accounts
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║         ✅ TEST ACCOUNTS CREATED SUCCESSFULLY           ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        console.log('🔑 LOGIN CREDENTIALS:');
        console.log('─'.repeat(50));
        console.log(`Password for ALL accounts: ${TEST_PASSWORD}\n`);

        for (const account of testAccounts) {
            console.log(`Role: ${account.role.toUpperCase()}`);
            console.log(`Email: ${account.email}`);
            console.log(`Password: ${TEST_PASSWORD}`);
            console.log('─'.repeat(50));
        }

        console.log('\n📋 TESTING CHECKLIST:');
        console.log('─'.repeat(50));
        console.log('1. ✅ Login with each account');
        console.log('2. ✅ Verify dashboard shows correct data');
        console.log('3. ✅ Check role-based navigation');
        console.log('4. ✅ Test project access');
        console.log('5. ✅ Test voucher creation/viewing');
        console.log('6. ✅ Test expense management');
        console.log('7. ✅ Test daily sheet access');
        console.log('8. ✅ Verify restricted features blocked');
        console.log('9. ✅ Test approval workflows');
        console.log('10. ✅ Check financial calculations\n');

        console.log('🎯 ROLE-BASED ACCESS GUIDE:');
        console.log('─'.repeat(50));
        console.log('ADMIN: Full system access');
        console.log('  - Can access: Everything');
        console.log('  - Special: User approvals, system settings\n');

        console.log('ACCOUNTANT: Financial operations');
        console.log('  - Can access: Dashboard, Projects, Vouchers, Expenses, Purchases, Ledger, Reports');
        console.log('  - Cannot access: Admin panel, Employee management\n');

        console.log('SITE MANAGER: Project operations');
        console.log('  - Can access: Dashboard, Projects, Daily Sheets, Vouchers, Expenses');
        console.log('  - Cannot access: Admin, Reports, Ledger, Purchases\n');

        console.log('SITE ENGINEER: Technical work');
        console.log('  - Can access: Dashboard, Projects, Daily Sheets, Vouchers, Expenses');
        console.log('  - Cannot access: Admin, Reports, Ledger, Purchases\n');

        console.log('PROJECT DIRECTOR: Oversight');
        console.log('  - Can access: Dashboard, Projects, Vouchers, Daily Sheets, Reports');
        console.log('  - Cannot access: Admin, Expenses, Purchases, Ledger\n');

        console.log('DEPUTY DIRECTOR: Oversight');
        console.log('  - Can access: Dashboard, Projects, Vouchers, Daily Sheets, Reports');
        console.log('  - Cannot access: Admin, Expenses, Purchases, Ledger\n');

        console.log('WORKER: Personal data');
        console.log('  - Can access: Dashboard, Vouchers (own only)');
        console.log('  - Cannot access: Everything else\n');

    } catch (error) {
        console.error('❌ Script failed:', error.message);
        console.error(error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createTestAccounts();
