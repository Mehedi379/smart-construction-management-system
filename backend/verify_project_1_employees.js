// ============================================
// VERIFY EMPLOYEES ASSIGNED TO PROJECT ID 1
// Smart Construction Management System
// ============================================

const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n=== VERIFYING EMPLOYEES FOR PROJECT ID: 1 ===\n');
        
        // 1. Get project details
        const [project] = await pool.query(`
            SELECT id, project_code, project_name, status, created_by, created_at
            FROM projects 
            WHERE id = 1
        `);
        
        if (project.length === 0) {
            console.log('❌ Project ID 1 not found!');
            process.exit(1);
        }
        
        console.log('📁 PROJECT DETAILS:');
        console.log(`   ID: ${project[0].id}`);
        console.log(`   Code: ${project[0].project_code}`);
        console.log(`   Name: ${project[0].project_name}`);
        console.log(`   Status: ${project[0].status}`);
        console.log(`   Created By: ${project[0].created_by}`);
        console.log(`   Created At: ${project[0].created_at}`);
        
        // 2. Get all employees assigned to this project
        const [employees] = await pool.query(`
            SELECT 
                e.id,
                e.employee_id,
                e.user_id,
                e.name,
                e.father_name,
                e.designation,
                e.category,
                e.work_role,
                e.department,
                e.assigned_project_id,
                e.status,
                e.joining_date,
                u.email,
                u.role as user_role,
                u.is_approved,
                u.is_active
            FROM employees e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.assigned_project_id = 1
            ORDER BY e.id
        `);
        
        console.log(`\n👥 EMPLOYEES ASSIGNED TO PROJECT ID 1: ${employees.length}\n`);
        
        if (employees.length === 0) {
            console.log('⚠️  No employees found for this project!');
        } else {
            employees.forEach((emp, index) => {
                console.log(`${'─'.repeat(60)}`);
                console.log(`👤 Employee #${index + 1}:`);
                console.log(`   Employee ID: ${emp.employee_id}`);
                console.log(`   Name: ${emp.name}`);
                console.log(`   Father Name: ${emp.father_name || 'N/A'}`);
                console.log(`   Designation: ${emp.designation || 'N/A'}`);
                console.log(`   Category: ${emp.category}`);
                console.log(`   Work Role: ${emp.work_role || 'N/A'}`);
                console.log(`   Department: ${emp.department || 'N/A'}`);
                console.log(`   Assigned Project ID: ${emp.assigned_project_id}`);
                console.log(`   Status: ${emp.status}`);
                console.log(`   Joining Date: ${emp.joining_date || 'N/A'}`);
                console.log(`   User ID: ${emp.user_id || 'N/A'}`);
                console.log(`   User Email: ${emp.email || 'N/A'}`);
                console.log(`   User Role: ${emp.user_role || 'N/A'}`);
                console.log(`   User Approved: ${emp.is_approved === 1 ? '✅ Yes' : '❌ No'}`);
                console.log(`   User Active: ${emp.is_active === 1 ? '✅ Yes' : '❌ No'}`);
            });
        }
        
        // 3. Verify project assignment integrity
        console.log(`\n\n${'='.repeat(60)}`);
        console.log('🔍 INTEGRITY CHECKS:');
        console.log(`${'='.repeat(60)}\n`);
        
        // Check 1: All employees point to valid project
        const [invalidAssignments] = await pool.query(`
            SELECT COUNT(*) as count
            FROM employees e
            LEFT JOIN projects p ON e.assigned_project_id = p.id
            WHERE e.assigned_project_id = 1 AND p.id IS NULL
        `);
        
        if (invalidAssignments[0].count > 0) {
            console.log(`❌ FAIL: ${invalidAssignments[0].count} employees assigned to non-existent project!`);
        } else {
            console.log(`✅ PASS: All employees assigned to valid project ID 1`);
        }
        
        // Check 2: No duplicate employee IDs
        const [duplicateIDs] = await pool.query(`
            SELECT employee_id, COUNT(*) as count
            FROM employees
            WHERE assigned_project_id = 1
            GROUP BY employee_id
            HAVING count > 1
        `);
        
        if (duplicateIDs.length > 0) {
            console.log(`❌ FAIL: ${duplicateIDs.length} duplicate employee IDs found!`);
        } else {
            console.log(`✅ PASS: No duplicate employee IDs`);
        }
        
        // Check 3: All employees have active status
        const [inactiveEmployees] = await pool.query(`
            SELECT COUNT(*) as count
            FROM employees
            WHERE assigned_project_id = 1 AND status != 'active'
        `);
        
        if (inactiveEmployees[0].count > 0) {
            console.log(`⚠️  WARNING: ${inactiveEmployees[0].count} inactive employees found`);
        } else {
            console.log(`✅ PASS: All ${employees.length} employees are active`);
        }
        
        // Check 4: Category distribution
        const [categoryStats] = await pool.query(`
            SELECT category, COUNT(*) as count
            FROM employees
            WHERE assigned_project_id = 1 AND status = 'active'
            GROUP BY category
            ORDER BY count DESC
        `);
        
        console.log(`\n📊 Category Distribution:`);
        categoryStats.forEach(cat => {
            console.log(`   - ${cat.category}: ${cat.count}`);
        });
        
        // Check 5: Role distribution (if users exist)
        const [roleStats] = await pool.query(`
            SELECT COALESCE(u.role, 'No User Account') as role, COUNT(*) as count
            FROM employees e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.assigned_project_id = 1 AND e.status = 'active'
            GROUP BY u.role
            ORDER BY count DESC
        `);
        
        console.log(`\n👥 Role Distribution:`);
        roleStats.forEach(role => {
            console.log(`   - ${role.role}: ${role.count}`);
        });
        
        // Final Summary
        console.log(`\n\n${'='.repeat(60)}`);
        console.log('✅ VERIFICATION SUMMARY:');
        console.log(`${'='.repeat(60)}`);
        console.log(`\nProject ID: 1 (${project[0].project_code})`);
        console.log(`Project Name: ${project[0].project_name}`);
        console.log(`Total Employees Assigned: ${employees.length}`);
        console.log(`Active Employees: ${employees.filter(e => e.status === 'active').length}`);
        console.log(`Inactive Employees: ${employees.filter(e => e.status !== 'active').length}`);
        console.log(`Employees with User Accounts: ${employees.filter(e => e.user_id).length}`);
        console.log(`Employees without User Accounts: ${employees.filter(e => !e.user_id).length}`);
        console.log(`\n✅ All checks passed - Data integrity verified!`);
        console.log(`${'='.repeat(60)}\n`);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();
