const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    console.log('\n' + '='.repeat(70));
    console.log('🔍 CHECKING EMPLOYEE ASSIGNMENTS FOR PROJECT 1');
    console.log('='.repeat(70) + '\n');

    // Check Project 1 employees
    const [employees] = await conn.query(`
        SELECT e.id, e.employee_id, e.name, e.designation, e.category, 
               e.assigned_project_id, e.status, u.email, u.role
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.assigned_project_id = 1
        ORDER BY e.category, e.name
    `);

    console.log(`📊 Project 1 (Dhaka Tower Construction) - Employees Found: ${employees.length}\n`);

    if (employees.length === 0) {
        console.log('❌ No employees assigned to Project 1!\n');
        
        // Check all employees
        const [allEmployees] = await conn.query(`
            SELECT e.id, e.employee_id, e.name, e.category, 
                   e.assigned_project_id, e.status
            FROM employees e
            ORDER BY e.id
            LIMIT 20
        `);

        console.log('📋 All Employees in Database:\n');
        allEmployees.forEach(emp => {
            const project = emp.assigned_project_id ? `Project ${emp.assigned_project_id}` : '❌ NO PROJECT';
            console.log(`${emp.employee_id} - ${emp.name.padEnd(25)} | ${emp.category.padEnd(20)} | ${project} | ${emp.status}`);
        });

        console.log('\n\n💡 SOLUTION: Assigning employees to Project 1...\n');

        // Get all employees without project or with wrong project
        const [unassignedEmployees] = await conn.query(`
            SELECT id, category 
            FROM employees 
            WHERE assigned_project_id IS NULL OR assigned_project_id != 1
        `);

        if (unassignedEmployees.length > 0) {
            console.log(`Found ${unassignedEmployees.length} employees to assign\n`);
            
            // Update employees to Project 1
            const [result] = await conn.query(`
                UPDATE employees 
                SET assigned_project_id = 1 
                WHERE assigned_project_id IS NULL OR assigned_project_id = 0
            `);

            console.log(`✅ Updated ${result.affectedRows} employees to Project 1\n`);
        }
    } else {
        // Show category-wise breakdown
        const categories = {};
        employees.forEach(emp => {
            if (!categories[emp.category]) {
                categories[emp.category] = 0;
            }
            categories[emp.category]++;
        });

        console.log('📋 Category-Wise Breakdown:\n');
        Object.entries(categories).forEach(([category, count]) => {
            console.log(`   ${category.padEnd(25)}: ${count} employee(s)`);
        });

        console.log('\n\n👥 Employee Details:\n');
        employees.forEach((emp, index) => {
            console.log(`${index + 1}. ${emp.name}`);
            console.log(`   Employee ID: ${emp.employee_id}`);
            console.log(`   Category: ${emp.category}`);
            console.log(`   Designation: ${emp.designation || 'N/A'}`);
            console.log(`   Email: ${emp.email || 'N/A'}`);
            console.log(`   Role: ${emp.role || 'N/A'}`);
            console.log(`   Project ID: ${emp.assigned_project_id}`);
            console.log(`   Status: ${emp.status}`);
            console.log('');
        });
    }

    console.log('='.repeat(70) + '\n');

    await conn.end();
})();
