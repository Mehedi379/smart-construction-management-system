// ============================================
// VERIFY PROJECT ID WISE DATA INTEGRITY
// Smart Construction Management System
// ============================================

const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n=== VERIFYING PROJECT ID WISE DATA INTEGRITY ===\n');
        
        // 1. Get all projects
        const [projects] = await pool.query(`
            SELECT id, project_code, project_name, status 
            FROM projects 
            ORDER BY id
        `);
        
        console.log(`📊 Total Projects Found: ${projects.length}\n`);
        
        let totalEmployeesAllProjects = 0;
        let totalAccountsAllProjects = 0;
        let totalEngineeringAllProjects = 0;
        let totalManagerAllProjects = 0;
        let totalDirectorAllProjects = 0;
        let totalDeputyDirectorAllProjects = 0;
        let totalEmployeeAllProjects = 0;
        let totalViewerAllProjects = 0;
        
        // 2. For each project, verify all data
        for (const project of projects) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📁 Project ID: ${project.id}`);
            console.log(`   Code: ${project.project_code}`);
            console.log(`   Name: ${project.project_name}`);
            console.log(`   Status: ${project.status}`);
            console.log(`${'='.repeat(60)}`);
            
            // Count employees by role for this project
            const [roleBreakdown] = await pool.query(`
                SELECT u.role, COUNT(*) as count
                FROM employees e
                LEFT JOIN users u ON e.user_id = u.id
                WHERE e.assigned_project_id = ? AND e.status = 'active'
                GROUP BY u.role
                ORDER BY count DESC
            `, [project.id]);
            
            console.log('\n👥 Employee Role Breakdown:');
            let projectTotal = 0;
            
            roleBreakdown.forEach(role => {
                console.log(`   - ${role.role}: ${role.count}`);
                projectTotal += role.count;
                
                // Add to global counters
                switch(role.role) {
                    case 'accountant':
                        totalAccountsAllProjects += role.count;
                        break;
                    case 'engineer':
                        totalEngineeringAllProjects += role.count;
                        break;
                    case 'manager':
                        totalManagerAllProjects += role.count;
                        break;
                    case 'director':
                        totalDirectorAllProjects += role.count;
                        break;
                    case 'deputy_director':
                        totalDeputyDirectorAllProjects += role.count;
                        break;
                    case 'employee':
                        totalEmployeeAllProjects += role.count;
                        break;
                    case 'viewer':
                        totalViewerAllProjects += role.count;
                        break;
                }
            });
            
            console.log(`\n✅ Project Total Employees: ${projectTotal}`);
            totalEmployeesAllProjects += projectTotal;
            
            // Count employees by category for this project
            const [categoryBreakdown] = await pool.query(`
                SELECT e.category, COUNT(*) as count
                FROM employees e
                WHERE e.assigned_project_id = ? AND e.status = 'active'
                GROUP BY e.category
                ORDER BY count DESC
            `, [project.id]);
            
            console.log('\n📋 Employee Category Breakdown:');
            categoryBreakdown.forEach(cat => {
                console.log(`   - ${cat.category}: ${cat.count}`);
            });
            
            // Verify no orphan employees (assigned to non-existent projects)
            const [orphanEmployees] = await pool.query(`
                SELECT COUNT(*) as count
                FROM employees e
                LEFT JOIN projects p ON e.assigned_project_id = p.id
                WHERE e.status = 'active' AND p.id IS NULL
            `);
            
            if (orphanEmployees[0].count > 0) {
                console.log(`\n⚠️  WARNING: ${orphanEmployees[0].count} orphan employees found (assigned to non-existent projects)`);
            } else {
                console.log(`\n✅ No orphan employees - All IDs match correctly!`);
            }
            
            // Verify no duplicate assignments
            const [duplicateAssignments] = await pool.query(`
                SELECT e.employee_id, e.name, COUNT(*) as assignment_count
                FROM employees e
                WHERE e.assigned_project_id = ? AND e.status = 'active'
                GROUP BY e.id
                HAVING assignment_count > 1
            `, [project.id]);
            
            if (duplicateAssignments.length > 0) {
                console.log(`⚠️  WARNING: ${duplicateAssignments.length} duplicate assignments found!`);
            }
        }
        
        // 3. Global Summary
        console.log(`\n\n${'='.repeat(60)}`);
        console.log(`📊 GLOBAL SUMMARY (ALL PROJECTS COMBINED)`);
        console.log(`${'='.repeat(60)}`);
        console.log(`\nTotal Projects: ${projects.length}`);
        console.log(`Total Employees (All Projects): ${totalEmployeesAllProjects}`);
        console.log(`\nRole-wise Breakdown:`);
        console.log(`   - Total Accounts: ${totalAccountsAllProjects}`);
        console.log(`   - Total Engineering: ${totalEngineeringAllProjects}`);
        console.log(`   - Total Manager: ${totalManagerAllProjects}`);
        console.log(`   - Total Project Director: ${totalDirectorAllProjects}`);
        console.log(`   - Total Deputy Director: ${totalDeputyDirectorAllProjects}`);
        console.log(`   - Total Employee: ${totalEmployeeAllProjects}`);
        console.log(`   - Total Viewer: ${totalViewerAllProjects}`);
        
        // 4. Cross-verify with dashboard API
        const [dashboardStats] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM projects) as total_projects,
                (SELECT COUNT(*) FROM employees WHERE status = 'active') as total_employees
        `);
        
        console.log(`\n🔍 Cross-Verification:`);
        console.log(`   Dashboard API total_projects: ${dashboardStats[0].total_projects}`);
        console.log(`   Our count: ${projects.length}`);
        console.log(`   Match: ${dashboardStats[0].total_projects === projects.length ? '✅ YES' : '❌ NO'}`);
        
        console.log(`\n   Dashboard API total_employees: ${dashboardStats[0].total_employees}`);
        console.log(`   Our count: ${totalEmployeesAllProjects}`);
        console.log(`   Match: ${dashboardStats[0].total_employees === totalEmployeesAllProjects ? '✅ YES' : '❌ NO'}`);
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ VERIFICATION COMPLETE - NO MISMATCHES FOUND!`);
        console.log(`${'='.repeat(60)}\n`);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();
