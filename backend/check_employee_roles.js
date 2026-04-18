const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n=== CHECKING EMPLOYEE ROLES/CATEGORIES ===\n');
        
        const [employees] = await pool.query(`
            SELECT 
                e.id,
                e.employee_id,
                e.name,
                e.category,
                e.work_role,
                e.designation,
                e.assigned_project_id,
                p.project_name
            FROM employees e
            LEFT JOIN projects p ON e.assigned_project_id = p.id
            WHERE e.status = 'active'
        `);

        console.log('Total Active Employees:', employees.length);
        console.log('\nEmployee Details:');
        employees.forEach(emp => {
            console.log(`\n- ${emp.name} (${emp.employee_id})`);
            console.log(`  Category: ${emp.category}`);
            console.log(`  Work Role: ${emp.work_role || 'N/A'}`);
            console.log(`  Designation: ${emp.designation || 'N/A'}`);
            console.log(`  Project: ${emp.project_name || 'N/A'}`);
        });

        // Get unique categories
        const [categories] = await pool.query(`
            SELECT DISTINCT category, COUNT(*) as count
            FROM employees
            WHERE status = 'active'
            GROUP BY category
        `);
        
        console.log('\n\n📊 Category Breakdown:');
        categories.forEach(cat => {
            console.log(`  ${cat.category}: ${cat.count} employees`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
