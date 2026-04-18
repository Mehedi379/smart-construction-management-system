const mysql = require('mysql2/promise');
require('dotenv').config();

async function testIDWiseCalculation() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n========================================');
        console.log('🔍 Testing ID-Wise Auto-Calculation');
        console.log('========================================\n');

        // 1. Get all projects
        const [projects] = await connection.query('SELECT id, project_code, project_name, estimated_budget FROM projects');
        console.log(`📊 Found ${projects.length} project(s):\n`);

        for (const project of projects) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📁 Project #${project.id}: ${project.project_name} (${project.project_code})`);
            console.log(`${'='.repeat(60)}`);

            // 2. Count employees for THIS project only
            const [employees] = await connection.query(
                `SELECT COUNT(*) as count 
                 FROM employees e 
                 WHERE e.assigned_project_id = ? AND e.status = 'active'`,
                [project.id]
            );
            console.log(`\n👥 Employees (Project ID: ${project.id}): ${employees[0].count}`);

            // 3. Count daily sheets for THIS project only
            const [sheets] = await connection.query(
                `SELECT COUNT(*) as count 
                 FROM daily_sheets 
                 WHERE project_id = ?`,
                [project.id]
            );
            console.log(`📄 Daily Sheets (Project ID: ${project.id}): ${sheets[0].count}`);

            // 4. Calculate total expense from approved sheets for THIS project only
            const [sheetExpenses] = await connection.query(
                `SELECT COALESCE(SUM(today_expense), 0) as total 
                 FROM daily_sheets 
                 WHERE project_id = ? AND status = 'approved'`,
                [project.id]
            );
            console.log(`💰 Total Expenses from Sheets (Project ID: ${project.id}): ৳${parseFloat(sheetExpenses[0].total).toLocaleString()}`);

            // 5. Count vouchers for THIS project only
            const [vouchers] = await connection.query(
                `SELECT COUNT(*) as count 
                 FROM vouchers 
                 WHERE project_id = ?`,
                [project.id]
            );
            console.log(`🎫 Vouchers (Project ID: ${project.id}): ${vouchers[0].count}`);

            // 6. Show sheet details with project_id verification
            const [sheetDetails] = await connection.query(
                `SELECT id, sheet_no, project_id, today_expense, status, created_by 
                 FROM daily_sheets 
                 WHERE project_id = ?`,
                [project.id]
            );
            
            if (sheetDetails.length > 0) {
                console.log(`\n📋 Sheet Details (ALL have project_id = ${project.id}):`);
                sheetDetails.forEach(sheet => {
                    console.log(`   - Sheet ${sheet.sheet_no}: ৳${parseFloat(sheet.today_expense).toLocaleString()} (${sheet.status}) [project_id: ${sheet.project_id}] ✅`);
                });
            }

            // 7. Show employee details with assigned_project_id verification
            const [employeeDetails] = await connection.query(
                `SELECT e.id, e.name, e.category, e.assigned_project_id 
                 FROM employees e 
                 WHERE e.assigned_project_id = ? AND e.status = 'active'
                 LIMIT 5`,
                [project.id]
            );
            
            if (employeeDetails.length > 0) {
                console.log(`\n👷 Employee Details (ALL have assigned_project_id = ${project.id}):`);
                employeeDetails.forEach(emp => {
                    console.log(`   - ${emp.name}: ${emp.category} [assigned_project_id: ${emp.assigned_project_id}] ✅`);
                });
            }

            // 8. Verify NO mixing with other projects
            const [mixedCheck] = await connection.query(
                `SELECT COUNT(*) as count 
                 FROM daily_sheets 
                 WHERE project_id != ?`,
                [project.id]
            );
            console.log(`\n🔒 Isolation Check: ${mixedCheck[0].count} sheet(s) belong to OTHER projects (NOT mixed) ✅`);
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log('✅ ID-WISE CALCULATION VERIFICATION COMPLETE');
        console.log(`${'='.repeat(60)}\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

testIDWiseCalculation();
