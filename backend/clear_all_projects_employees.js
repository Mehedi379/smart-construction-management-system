const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearAllProjectAndEmployeeData() {
    console.log('\n⚠️  CLEARING ALL PROJECT AND EMPLOYEE DATA...\n');
    console.log('🚨 WARNING: This will DELETE all projects, employees, and related data!');
    console.log('🚨 This action CANNOT be undone!\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('✅ Connected to database\n');

        // Disable foreign key checks temporarily
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Helper function to safely delete from table
        const safeDelete = async (tableName) => {
            try {
                const [result] = await connection.query(`DELETE FROM ${tableName}`);
                console.log(`   ✅ Deleted ${result.affectedRows} records from ${tableName}`);
                return result.affectedRows;
            } catch (error) {
                if (error.message.includes('doesn\'t exist')) {
                    console.log(`   ⚠️  Table ${tableName} doesn't exist, skipping`);
                } else {
                    console.log(`   ❌ Error deleting from ${tableName}: ${error.message}`);
                }
                return 0;
            }
        };

        // Delete all related data in correct order
        console.log('🗑️  Clearing all project and employee data...\n');
        
        const deleted = {};
        deleted.signatures = await safeDelete('daily_sheet_signatures');
        deleted.sheet_items = await safeDelete('daily_sheet_items');
        deleted.sheets = await safeDelete('daily_sheets');
        deleted.voucher_items = await safeDelete('voucher_items');
        deleted.vouchers = await safeDelete('vouchers');
        deleted.expenses = await safeDelete('expenses');
        deleted.ledger = await safeDelete('ledger');
        deleted.engineer_stats = await safeDelete('engineer_stats');
        deleted.employees = await safeDelete('employees');
        deleted.user_projects = await safeDelete('user_projects');
        deleted.projects = await safeDelete('projects');

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('========================================');
        console.log('✅ ALL DATA CLEARED SUCCESSFULLY');
        console.log('========================================\n');

        console.log('📋 Summary of deleted data:');
        console.log(`   - ${deleted.signatures} daily sheet signatures`);
        console.log(`   - ${deleted.sheet_items} daily sheet items`);
        console.log(`   - ${deleted.sheets} daily sheets`);
        console.log(`   - ${deleted.voucher_items} voucher items`);
        console.log(`   - ${deleted.vouchers} vouchers`);
        console.log(`   - ${deleted.expenses} expenses`);
        console.log(`   - ${deleted.ledger} ledger entries`);
        console.log(`   - ${deleted.engineer_stats} engineer stats`);
        console.log(`   - ${deleted.employees} employee records`);
        console.log(`   - ${deleted.user_projects} user project assignments`);
        console.log(`   - ${deleted.projects} projects`);
        console.log('');

        console.log('📝 What was KEPT:');
        console.log('   ✅ Users table (login accounts preserved)');
        console.log('   ✅ Admin account intact');
        console.log('   ✅ Database structure (tables, indexes)');
        console.log('');

        console.log('🚀 Next Steps:');
        console.log('   1. Login as Admin');
        console.log('   2. Create new projects manually');
        console.log('   3. Add employees to projects');
        console.log('   4. Assign users to projects');
        console.log('');

        console.log('⚠️  Note:');
        console.log('   - All user accounts are preserved');
        console.log('   - Users will need to be reassigned to new projects');
        console.log('   - You can now start fresh with clean data\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        
        // Re-enable foreign key checks on error
        if (connection) {
            await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        }
    } finally {
        if (connection) await connection.end();
    }
}

clearAllProjectAndEmployeeData();
