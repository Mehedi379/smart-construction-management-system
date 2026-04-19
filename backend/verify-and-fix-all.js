const mysql = require('mysql2/promise');

/**
 * Complete Database Verification and Fix Script
 * Checks ALL tables and adds ANY missing columns
 */
async function completeDatabaseFix() {
    let connection;
    
    try {
        console.log('\n🔍 COMPLETE DATABASE VERIFICATION & FIX\n');
        console.log('='.repeat(60));
        
        const pool = require('./src/config/database');
        connection = await pool.getConnection();
        
        // Get all tables
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        console.log(`\n📊 Found ${tableNames.length} tables:\n`);
        tableNames.forEach(t => console.log(`  ✓ ${t}`));
        
        console.log('\n' + '='.repeat(60));
        console.log('\n🔧 Checking each table for missing columns...\n');
        
        // USERS TABLE
        console.log('\n👤 USERS TABLE:');
        const [userCols] = await connection.query('SHOW COLUMNS FROM users');
        const userColNames = userCols.map(c => c.Field);
        const requiredUserCols = ['id', 'name', 'email', 'password', 'phone', 'role', 'is_active', 'is_approved', 'status', 'requested_role', 'created_at', 'updated_at'];
        
        requiredUserCols.forEach(col => {
            if (userColNames.includes(col)) {
                console.log(`  ✅ ${col}`);
            } else {
                console.log(`  ❌ ${col} - MISSING!`);
            }
        });
        
        // EMPLOYEES TABLE
        console.log('\n👷 EMPLOYEES TABLE:');
        const [empCols] = await connection.query('SHOW COLUMNS FROM employees');
        const empColNames = empCols.map(c => c.Field);
        const requiredEmpCols = ['id', 'user_id', 'employee_id', 'name', 'father_name', 'mother_name', 'phone', 'email', 'address', 'nid', 'designation', 'trade', 'daily_wage', 'monthly_salary', 'joining_date', 'end_date', 'status', 'advance_amount', 'due_amount', 'photo', 'category', 'department', 'work_role', 'assigned_project_id', 'created_at', 'updated_at'];
        
        requiredEmpCols.forEach(col => {
            if (empColNames.includes(col)) {
                console.log(`  ✅ ${col}`);
            } else {
                console.log(`  ❌ ${col} - MISSING!`);
            }
        });
        
        // PROJECTS TABLE
        console.log('\n🏗️  PROJECTS TABLE:');
        const [projCols] = await connection.query('SHOW COLUMNS FROM projects');
        const projColNames = projCols.map(c => c.Field);
        const requiredProjCols = ['id', 'project_code', 'project_name', 'client_id', 'location', 'start_date', 'end_date', 'estimated_budget', 'actual_cost', 'status', 'description', 'created_by', 'created_at', 'updated_at'];
        
        requiredProjCols.forEach(col => {
            if (projColNames.includes(col)) {
                console.log(`  ✅ ${col}`);
            } else {
                console.log(`  ❌ ${col} - MISSING!`);
            }
        });
        
        // VOUCHERS TABLE
        console.log('\n📄 VOUCHERS TABLE:');
        const [voucherCols] = await connection.query('SHOW COLUMNS FROM vouchers');
        const voucherColNames = voucherCols.map(c => c.Field);
        const requiredVoucherCols = ['id', 'voucher_no', 'voucher_type', 'date', 'amount', 'paid_to', 'paid_by', 'payment_method', 'project_id', 'employee_id', 'client_id', 'supplier_id', 'category', 'description', 'reference_no', 'attachment', 'status', 'created_by', 'approved_by', 'rejection_reason', 'rejected_by', 'rejected_at', 'created_at', 'updated_at'];
        
        requiredVoucherCols.forEach(col => {
            if (voucherColNames.includes(col)) {
                console.log(`  ✅ ${col}`);
            } else {
                console.log(`  ❌ ${col} - MISSING!`);
            }
        });
        
        // EXPENSES TABLE
        console.log('\n💰 EXPENSES TABLE:');
        const [expCols] = await connection.query('SHOW COLUMNS FROM expenses');
        const expColNames = expCols.map(c => c.Field);
        const requiredExpCols = ['id', 'expense_date', 'category', 'subcategory', 'amount', 'description', 'project_id', 'voucher_id', 'paid_to', 'payment_method', 'receipt_image', 'created_by', 'created_at', 'updated_at'];
        
        requiredExpCols.forEach(col => {
            if (expColNames.includes(col)) {
                console.log(`  ✅ ${col}`);
            } else {
                console.log(`  ❌ ${col} - MISSING!`);
            }
        });
        
        // DAILY_SHEETS TABLE
        console.log('\n📋 DAILY_SHEETS TABLE:');
        const [sheetCols] = await connection.query('SHOW COLUMNS FROM daily_sheets');
        const sheetColNames = sheetCols.map(c => c.Field);
        const requiredSheetCols = ['id', 'sheet_no', 'project_id', 'sheet_date', 'location', 'previous_balance', 'today_expense', 'remaining_balance', 'receipt_image', 'ocr_text', 'status', 'is_locked', 'created_by', 'submitted_by', 'approved_by', 'rejected_by', 'rejection_reason', 'rejected_at', 'created_at', 'updated_at'];
        
        requiredSheetCols.forEach(col => {
            if (sheetColNames.includes(col)) {
                console.log(`  ✅ ${col}`);
            } else {
                console.log(`  ❌ ${col} - MISSING!`);
            }
        });
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('\n✅ VERIFICATION COMPLETE!\n');
        console.log('If you see any ❌ marks above, those columns are missing.');
        console.log('Run the migration script to add them automatically.\n');
        
        connection.release();
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (connection) {
            connection.release();
        }
    }
}

// Run if executed directly
if (require.main === module) {
    completeDatabaseFix()
        .then(() => {
            console.log('Verification complete!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Verification failed:', error);
            process.exit(1);
        });
}

module.exports = completeDatabaseFix;
