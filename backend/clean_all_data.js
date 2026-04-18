// ============================================
// CLEAN ALL OLD EMPLOYEES AND PROJECTS
// Smart Construction Management System
// ============================================

const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n=== CLEANING ALL OLD EMPLOYEES AND PROJECTS ===\n');
        
        // 1. Count current data
        const [projectCount] = await pool.query('SELECT COUNT(*) as count FROM projects');
        const [employeeCount] = await pool.query('SELECT COUNT(*) as count FROM employees');
        
        console.log(`📊 Current Data:`);
        console.log(`   Projects: ${projectCount[0].count}`);
        console.log(`   Employees: ${employeeCount[0].count}`);
        
        if (projectCount[0].count === 0 && employeeCount[0].count === 0) {
            console.log('\n✅ Database is already clean!');
            process.exit(0);
        }
        
        console.log('\n⚠️  WARNING: This will delete all projects and employees!');
        console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const conn = await pool.getConnection();
        await conn.beginTransaction();
        
        try {
            // 2. Delete all dependent records first (foreign key constraints)
            console.log('🗑️  Deleting dependent records...\n');
            
            // Delete expenses
            const [expensesResult] = await conn.query('DELETE FROM expenses');
            console.log(`   ✅ Deleted ${expensesResult.affectedRows} expenses`);
            
            // Delete vouchers
            const [vouchersResult] = await conn.query('DELETE FROM vouchers');
            console.log(`   ✅ Deleted ${vouchersResult.affectedRows} vouchers`);
            
            // Delete daily sheets
            const [sheetsResult] = await conn.query('DELETE FROM daily_sheets');
            console.log(`   ✅ Deleted ${sheetsResult.affectedRows} daily sheets`);
            
            // Delete purchases
            const [purchasesResult] = await conn.query('DELETE FROM purchases');
            console.log(`   ✅ Deleted ${purchasesResult.affectedRows} purchases`);
            
            // Delete signature requests
            const [signaturesResult] = await conn.query('DELETE FROM signature_requests');
            console.log(`   ✅ Deleted ${signaturesResult.affectedRows} signature requests`);
            
            // Delete workflow steps
            const [workflowsResult] = await conn.query('DELETE FROM workflow_steps');
            console.log(`   ✅ Deleted ${workflowsResult.affectedRows} workflow steps`);
            
            // Delete audit logs
            const [auditResult] = await conn.query('DELETE FROM audit_logs');
            console.log(`   ✅ Deleted ${auditResult.affectedRows} audit logs`);
            
            // 3. Delete all employees
            console.log('\n🗑️  Deleting all employees...');
            const [deleteEmployees] = await conn.query('DELETE FROM employees');
            console.log(`   ✅ Deleted ${deleteEmployees.affectedRows} employees`);
            
            // 4. Delete all projects
            console.log('\n🗑️  Deleting all projects...');
            const [deleteProjects] = await conn.query('DELETE FROM projects');
            console.log(`   ✅ Deleted ${deleteProjects.affectedRows} projects`);
            
            // 5. Reset auto-increment
            console.log('\n🔄 Resetting auto-increment counters...');
            await conn.query('ALTER TABLE employees AUTO_INCREMENT = 1');
            console.log(`   ✅ Employees table reset`);
            
            await conn.query('ALTER TABLE projects AUTO_INCREMENT = 1');
            console.log(`   ✅ Projects table reset`);
            
            await conn.query('ALTER TABLE expenses AUTO_INCREMENT = 1');
            console.log(`   ✅ Expenses table reset`);
            
            await conn.query('ALTER TABLE vouchers AUTO_INCREMENT = 1');
            console.log(`   ✅ Vouchers table reset`);
            
            await conn.query('ALTER TABLE daily_sheets AUTO_INCREMENT = 1');
            console.log(`   ✅ Daily sheets table reset`);
            
            await conn.query('ALTER TABLE purchases AUTO_INCREMENT = 1');
            console.log(`   ✅ Purchases table reset`);
            
            // Commit transaction
            await conn.commit();
            
            // 6. Final verification
            console.log('\n\n' + '='.repeat(60));
            console.log('✅ CLEANUP COMPLETE!');
            console.log('='.repeat(60));
            
            const [newProjectCount] = await pool.query('SELECT COUNT(*) as count FROM projects');
            const [newEmployeeCount] = await pool.query('SELECT COUNT(*) as count FROM employees');
            
            console.log(`\n📊 Final Status:`);
            console.log(`   Projects: ${newProjectCount[0].count} ✅`);
            console.log(`   Employees: ${newEmployeeCount[0].count} ✅`);
            console.log(`\n🎉 Database is now clean! You can create fresh data.`);
            console.log('='.repeat(60) + '\n');
            
        } catch (error) {
            await conn.rollback();
            console.error('\n❌ Error during cleanup, transaction rolled back:', error.message);
            throw error;
        } finally {
            conn.release();
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();
