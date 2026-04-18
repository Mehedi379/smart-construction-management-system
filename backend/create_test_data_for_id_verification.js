const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestData() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n' + '='.repeat(70));
        console.log('🧪 CREATING TEST DATA FOR ID-WISE VERIFICATION');
        console.log('='.repeat(70) + '\n');

        // Create test projects
        console.log('📁 Creating test projects...');
        const [project1Result] = await connection.query(
            `INSERT INTO projects (project_code, project_name, location, estimated_budget, status, created_by, start_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['PRJ-001', 'Test Project 1', 'Dhaka', 500000, 'ongoing', 1, '2026-01-01']
        );
        const project1Id = project1Result.insertId;
        console.log(`   ✅ Created Project 1: ID = ${project1Id}`);

        const [project2Result] = await connection.query(
            `INSERT INTO projects (project_code, project_name, location, estimated_budget, status, created_by, start_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['PRJ-002', 'Test Project 2', 'Chittagong', 750000, 'ongoing', 1, '2026-02-01']
        );
        const project2Id = project2Result.insertId;
        console.log(`   ✅ Created Project 2: ID = ${project2Id}`);

        // Create test employees for Project 1
        console.log('\n👷 Creating test employees for Project 1...');
        const [emp1Result] = await connection.query(
            `INSERT INTO employees (employee_id, name, category, assigned_project_id, status) 
             VALUES (?, ?, ?, ?, ?)`,
            ['EMP-001', 'Test Employee 1', 'engineer', project1Id, 'active']
        );
        console.log(`   ✅ Created Employee 1: ID = ${emp1Result.insertId}`);

        const [emp2Result] = await connection.query(
            `INSERT INTO employees (employee_id, name, category, assigned_project_id, status) 
             VALUES (?, ?, ?, ?, ?)`,
            ['EMP-002', 'Test Employee 2', 'worker', project1Id, 'active']
        );
        console.log(`   ✅ Created Employee 2: ID = ${emp2Result.insertId}`);

        // Create test employees for Project 2
        console.log('\n👷 Creating test employees for Project 2...');
        const [emp3Result] = await connection.query(
            `INSERT INTO employees (employee_id, name, category, assigned_project_id, status) 
             VALUES (?, ?, ?, ?, ?)`,
            ['EMP-003', 'Test Employee 3', 'supervisor', project2Id, 'active']
        );
        console.log(`   ✅ Created Employee 3: ID = ${emp3Result.insertId}`);

        // Create test daily sheets for Project 1
        console.log('\n📄 Creating test daily sheets for Project 1...');
        const [sheet1Result] = await connection.query(
            `INSERT INTO daily_sheets (sheet_no, project_id, created_by, sheet_date, today_expense, status) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['SHEET-001', project1Id, 1, '2026-04-15', 15000, 'approved']
        );
        console.log(`   ✅ Created Sheet 1: ID = ${sheet1Result.insertId}`);

        const [sheet2Result] = await connection.query(
            `INSERT INTO daily_sheets (sheet_no, project_id, created_by, sheet_date, today_expense, status) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['SHEET-002', project1Id, 1, '2026-04-16', 22000, 'pending']
        );
        console.log(`   ✅ Created Sheet 2: ID = ${sheet2Result.insertId}`);

        // Create test daily sheets for Project 2
        console.log('\n📄 Creating test daily sheets for Project 2...');
        const [sheet3Result] = await connection.query(
            `INSERT INTO daily_sheets (sheet_no, project_id, created_by, sheet_date, today_expense, status) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['SHEET-003', project2Id, 1, '2026-04-15', 18000, 'approved']
        );
        console.log(`   ✅ Created Sheet 3: ID = ${sheet3Result.insertId}`);

        // Create test vouchers for Project 1
        console.log('\n🎫 Creating test vouchers for Project 1...');
        const [voucher1Result] = await connection.query(
            `INSERT INTO vouchers (voucher_no, project_id, created_by, amount, status, voucher_type) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['VCH-001', project1Id, 1, 25000, 'approved', 'receipt']
        );
        console.log(`   ✅ Created Voucher 1: ID = ${voucher1Result.insertId}`);

        // Create test vouchers for Project 2
        console.log('\n🎫 Creating test vouchers for Project 2...');
        const [voucher2Result] = await connection.query(
            `INSERT INTO vouchers (voucher_no, project_id, created_by, amount, status, voucher_type) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['VCH-002', project2Id, 1, 30000, 'pending', 'payment']
        );
        console.log(`   ✅ Created Voucher 2: ID = ${voucher2Result.insertId}`);

        // Create test expenses for Project 1
        console.log('\n💰 Creating test expenses for Project 1...');
        const [exp1Result] = await connection.query(
            `INSERT INTO expenses (expense_date, category, amount, description, project_id, voucher_id, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['2026-04-15', 'material', 15000, 'Cement purchase', project1Id, voucher1Result.insertId, 1]
        );
        console.log(`   ✅ Created Expense 1: ID = ${exp1Result.insertId}`);

        const [exp2Result] = await connection.query(
            `INSERT INTO expenses (expense_date, category, amount, description, project_id, voucher_id, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['2026-04-15', 'labor', 10000, 'Worker payment', project1Id, voucher1Result.insertId, 1]
        );
        console.log(`   ✅ Created Expense 2: ID = ${exp2Result.insertId}`);

        // Create test signature requests
        console.log('\n✍️  Creating test signature requests...');
        const [sig1Result] = await connection.query(
            `INSERT INTO signature_requests (sheet_id, role_code, role_name, requested_by, status) 
             VALUES (?, ?, ?, ?, ?)`,
            [sheet1Result.insertId, 'ENGINEER', 'Project Engineer', 1, 'pending']
        );
        console.log(`   ✅ Created Signature Request 1: ID = ${sig1Result.insertId}`);

        console.log('\n' + '='.repeat(70));
        console.log('✅ TEST DATA CREATED SUCCESSFULLY');
        console.log('='.repeat(70));
        console.log('\n📊 Summary:');
        console.log(`   - Projects: 2 (IDs: ${project1Id}, ${project2Id})`);
        console.log(`   - Employees: 3 (Project 1: 2, Project 2: 1)`);
        console.log(`   - Daily Sheets: 3 (Project 1: 2, Project 2: 1)`);
        console.log(`   - Vouchers: 2 (Project 1: 1, Project 2: 1)`);
        console.log(`   - Expenses: 2 (Project 1: 2)`);
        console.log(`   - Signature Requests: 1`);
        console.log('\n💡 Now run "node comprehensive_id_analysis.js" to verify ID-wise functionality\n');

    } catch (error) {
        console.error('❌ Error creating test data:', error.message);
        console.error(error);
    } finally {
        if (connection) await connection.end();
    }
}

createTestData();
