const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeAllEmployeeAccounts() {
    console.log('\n🗑️  REMOVING ALL EMPLOYEE ROLE ACCOUNTS...\n');
    console.log('='.repeat(60));
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        // Step 1: Show current users before cleanup
        console.log('\n📋 CURRENT USERS IN DATABASE:');
        console.log('-'.repeat(60));
        const [allUsers] = await connection.query(
            `SELECT id, name, email, role, is_approved, is_active, created_at 
             FROM users 
             ORDER BY role, id ASC`
        );
        console.table(allUsers);

        // Step 2: Count users by role
        const [roleCounts] = await connection.query(
            `SELECT role, COUNT(*) as count 
             FROM users 
             GROUP BY role`
        );
        console.log('\n📊 USER COUNT BY ROLE:');
        console.table(roleCounts);

        // Step 3: Confirm deletion with user
        console.log('\n⚠️  WARNING: This will delete ALL non-admin accounts!');
        console.log('   - All employee, accountant, and engineer accounts will be removed');
        console.log('   - Related employee records will also be deleted');
        console.log('   - Only admin accounts will be preserved');
        console.log('   - This action CANNOT be undone!');
        console.log('\n   You will need to create new accounts from Admin Panel after this.');
        
        const confirmDelete = true; // Auto-confirm for script execution

        if (!confirmDelete) {
            console.log('\n❌ Operation cancelled by user');
            return;
        }

        console.log('\n🔄 Starting cleanup process...\n');

        // Step 4: Delete related records first (foreign key constraints)
        
        // Delete attendance records for non-admin employees
        console.log('🗑️  Cleaning up attendance records...');
        const [attendanceResult] = await connection.query(`
            DELETE a FROM attendance a
            INNER JOIN employees e ON a.employee_id = e.id
            INNER JOIN users u ON e.user_id = u.id
            WHERE u.role != 'admin'
        `);
        console.log(`   ✅ Deleted ${attendanceResult.affectedRows} attendance records`);

        // Delete ledger entries created by non-admin users
        console.log('🗑️  Cleaning up ledger entries...');
        const [ledgerEntriesResult] = await connection.query(`
            DELETE FROM ledger_entries WHERE created_by IN (
                SELECT id FROM users WHERE role != 'admin'
            )
        `);
        console.log(`   ✅ Deleted ${ledgerEntriesResult.affectedRows} ledger entries`);

        // Delete expenses created by non-admin users
        console.log('🗑️  Cleaning up expenses...');
        const [expensesResult] = await connection.query(`
            DELETE FROM expenses WHERE created_by IN (
                SELECT id FROM users WHERE role != 'admin'
            )
        `);
        console.log(`   ✅ Deleted ${expensesResult.affectedRows} expenses`);

        // Delete vouchers created/approved by non-admin users
        console.log('🗑️  Cleaning up vouchers...');
        const [vouchersResult] = await connection.query(`
            UPDATE vouchers 
            SET created_by = NULL, approved_by = NULL 
            WHERE created_by IN (SELECT id FROM users WHERE role != 'admin')
            OR approved_by IN (SELECT id FROM users WHERE role != 'admin')
        `);
        console.log(`   ✅ Cleaned up ${vouchersResult.affectedRows} vouchers`);

        // Delete employee records linked to non-admin users
        console.log('🗑️  Cleaning up employee records...');
        const [employeesResult] = await connection.query(`
            DELETE FROM employees WHERE user_id IN (
                SELECT id FROM users WHERE role != 'admin'
            )
        `);
        console.log(`   ✅ Deleted ${employeesResult.affectedRows} employee records`);

        // Step 5: Delete non-admin user accounts
        console.log('🗑️  Deleting non-admin user accounts...');
        const [usersResult] = await connection.query(`
            DELETE FROM users WHERE role != 'admin'
        `);
        console.log(`   ✅ Deleted ${usersResult.affectedRows} user accounts`);

        // Step 6: Verify cleanup
        console.log('\n' + '='.repeat(60));
        console.log('✅ CLEANUP COMPLETED SUCCESSFULLY');
        console.log('='.repeat(60));

        console.log('\n📋 REMAINING USERS IN DATABASE:');
        console.log('-'.repeat(60));
        const [remainingUsers] = await connection.query(
            `SELECT id, name, email, role, is_approved, is_active 
             FROM users 
             ORDER BY id ASC`
        );
        
        if (remainingUsers.length === 0) {
            console.log('   ⚠️  No users found in database');
            console.log('   💡 You may need to create an admin account first');
        } else {
            console.table(remainingUsers);
        }

        // Step 7: Show summary
        console.log('\n📊 CLEANUP SUMMARY:');
        console.log('   ✅ Attendance records cleaned');
        console.log('   ✅ Ledger entries cleaned');
        console.log('   ✅ Expenses cleaned');
        console.log('   ✅ Vouchers cleaned (set to NULL)');
        console.log('   ✅ Employee records deleted');
        console.log('   ✅ Non-admin user accounts deleted');

        console.log('\n🚀 NEXT STEPS:');
        console.log('   1. Login with admin account');
        console.log('   2. Go to Admin Panel');
        console.log('   3. Create new employee accounts as needed');
        console.log('   4. Users can also register and wait for your approval');

        console.log('\n📝 Admin Login (if exists):');
        console.log('   Email: admin@khazabilkis.com');
        console.log('   Password: admin123');

        console.log('\n✨ System is now ready for fresh start!\n');

    } catch (error) {
        console.error('\n❌ Error during cleanup:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) await connection.end();
    }
}

// Run the cleanup
removeAllEmployeeAccounts();
