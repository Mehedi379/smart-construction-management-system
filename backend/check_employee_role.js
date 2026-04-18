const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔍 CHECKING "TOTAL EMPLOYEE" COUNT...\n');
        
        // Find all employees with role = 'employee'
        const [employees] = await pool.query(
            `SELECT 
                e.id,
                e.employee_id,
                e.name,
                e.category,
                e.designation,
                e.assigned_project_id,
                u.role,
                u.email,
                p.project_name,
                p.project_code
             FROM employees e
             LEFT JOIN users u ON e.user_id = u.id
             LEFT JOIN projects p ON e.assigned_project_id = p.id
             WHERE u.role = 'employee' OR u.role IS NULL
             AND e.status = 'active'
             ORDER BY e.id`
        );
        
        console.log(`Found ${employees.length} employees with role 'employee':\n`);
        
        employees.forEach((emp, index) => {
            console.log(`${index + 1}. ${emp.name}`);
            console.log(`   Employee ID: ${emp.employee_id}`);
            console.log(`   Email: ${emp.email || 'N/A'}`);
            console.log(`   Role: ${emp.role || 'NULL'}`);
            console.log(`   Category: ${emp.category}`);
            console.log(`   Designation: ${emp.designation || 'N/A'}`);
            console.log(`   Project: ${emp.project_name || 'No Project'} (${emp.project_code || 'N/A'})`);
            console.log('');
        });
        
        // Also check by category
        console.log('\n📊 Employees by Category (where role = employee):\n');
        
        const [categoryBreakdown] = await pool.query(
            `SELECT 
                e.category,
                COUNT(*) as count
             FROM employees e
             LEFT JOIN users u ON e.user_id = u.id
             WHERE u.role = 'employee'
             AND e.status = 'active'
             GROUP BY e.category`
        );
        
        categoryBreakdown.forEach(cat => {
            console.log(`   ${cat.category}: ${cat.count}`);
        });
        
        console.log('\n✅ Check complete!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
