// ============================================
// DATABASE MIGRATION VERIFICATION SCRIPT
// Smart Construction Management System
// ============================================

const pool = require('./src/config/database');

async function verifyMigrations() {
    console.log('\n========================================');
    console.log('🔍 DATABASE MIGRATION VERIFICATION');
    console.log('========================================\n');

    const results = {
        passed: [],
        failed: [],
        warnings: []
    };

    try {
        // 1. Check employees.assigned_project_id column
        console.log('1️⃣  Checking employees.assigned_project_id column...');
        const [empColumns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'employees' 
            AND COLUMN_NAME = 'assigned_project_id'
        `);
        
        if (empColumns.length > 0) {
            console.log('   ✅ employees.assigned_project_id EXISTS\n');
            results.passed.push('employees.assigned_project_id');
        } else {
            console.log('   ❌ employees.assigned_project_id MISSING\n');
            results.failed.push('employees.assigned_project_id');
        }

        // 2. Check employees.category column
        console.log('2️⃣  Checking employees.category column...');
        const [empCategory] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'employees' 
            AND COLUMN_NAME = 'category'
        `);
        
        if (empCategory.length > 0) {
            console.log('   ✅ employees.category EXISTS\n');
            results.passed.push('employees.category');
        } else {
            console.log('   ❌ employees.category MISSING\n');
            results.failed.push('employees.category');
        }

        // 3. Check employees.department column
        console.log('3️⃣  Checking employees.department column...');
        const [empDept] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'employees' 
            AND COLUMN_NAME = 'department'
        `);
        
        if (empDept.length > 0) {
            console.log('   ✅ employees.department EXISTS\n');
            results.passed.push('employees.department');
        } else {
            console.log('   ❌ employees.department MISSING\n');
            results.failed.push('employees.department');
        }

        // 4. Check employees.created_by column
        console.log('4️⃣  Checking employees.created_by column...');
        const [empCreatedBy] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'employees' 
            AND COLUMN_NAME = 'created_by'
        `);
        
        if (empCreatedBy.length > 0) {
            console.log('   ✅ employees.created_by EXISTS\n');
            results.passed.push('employees.created_by');
        } else {
            console.log('   ❌ employees.created_by MISSING\n');
            results.failed.push('employees.created_by');
        }

        // 5. Check projects.created_by column
        console.log('5️⃣  Checking projects.created_by column...');
        const [projCreatedBy] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'projects' 
            AND COLUMN_NAME = 'created_by'
        `);
        
        if (projCreatedBy.length > 0) {
            console.log('   ✅ projects.created_by EXISTS\n');
            results.passed.push('projects.created_by');
        } else {
            console.log('   ❌ projects.created_by MISSING\n');
            results.failed.push('projects.created_by');
        }

        // 6. Check stored procedure: create_or_add_to_sheet
        console.log('6️⃣  Checking stored procedure: create_or_add_to_sheet...');
        const [proc1] = await pool.query(`
            SELECT ROUTINE_NAME 
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_SCHEMA = 'construction_db' 
            AND ROUTINE_TYPE = 'PROCEDURE' 
            AND ROUTINE_NAME = 'create_or_add_to_sheet'
        `);
        
        if (proc1.length > 0) {
            console.log('   ✅ Stored procedure create_or_add_to_sheet EXISTS\n');
            results.passed.push('create_or_add_to_sheet');
        } else {
            console.log('   ❌ Stored procedure create_or_add_to_sheet MISSING\n');
            results.failed.push('create_or_add_to_sheet');
        }

        // 7. Check stored procedure: add_signature_to_sheet
        console.log('7️⃣  Checking stored procedure: add_signature_to_sheet...');
        const [proc2] = await pool.query(`
            SELECT ROUTINE_NAME 
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_SCHEMA = 'construction_db' 
            AND ROUTINE_TYPE = 'PROCEDURE' 
            AND ROUTINE_NAME = 'add_signature_to_sheet'
        `);
        
        if (proc2.length > 0) {
            console.log('   ✅ Stored procedure add_signature_to_sheet EXISTS\n');
            results.passed.push('add_signature_to_sheet');
        } else {
            console.log('   ⚠️  Stored procedure add_signature_to_sheet MISSING (optional)\n');
            results.warnings.push('add_signature_to_sheet');
        }

        // 8. Check daily_sheets table
        console.log('8️⃣  Checking daily_sheets table...');
        const [sheetsTable] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'daily_sheets'
        `);
        
        if (sheetsTable.length > 0) {
            console.log('   ✅ daily_sheets table EXISTS\n');
            results.passed.push('daily_sheets');
        } else {
            console.log('   ❌ daily_sheets table MISSING\n');
            results.failed.push('daily_sheets');
        }

        // 9. Check daily_sheet_signatures table
        console.log('9️⃣  Checking daily_sheet_signatures table...');
        const [sigTable1] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'daily_sheet_signatures'
        `);
        
        if (sigTable1.length > 0) {
            console.log('   ✅ daily_sheet_signatures table EXISTS\n');
            results.passed.push('daily_sheet_signatures');
        } else {
            console.log('   ⚠️  daily_sheet_signatures table MISSING\n');
            results.warnings.push('daily_sheet_signatures');
        }

        // 10. Check sheet_signatures table
        console.log('🔟  Checking sheet_signatures table...');
        const [sigTable2] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'sheet_signatures'
        `);
        
        if (sigTable2.length > 0) {
            console.log('   ✅ sheet_signatures table EXISTS\n');
            results.passed.push('sheet_signatures');
        } else {
            console.log('   ⚠️  sheet_signatures table MISSING\n');
            results.warnings.push('sheet_signatures');
        }

        // 11. Check audit_logs table
        console.log('1️⃣1️⃣  Checking audit_logs table...');
        const [auditTable] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'audit_logs'
        `);
        
        if (auditTable.length > 0) {
            console.log('   ✅ audit_logs table EXISTS\n');
            results.passed.push('audit_logs');
        } else {
            console.log('   ⚠️  audit_logs table MISSING\n');
            results.warnings.push('audit_logs');
        }

        // 12. Check notifications table
        console.log('1️⃣2️⃣  Checking notifications table...');
        const [notifTable] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'notifications'
        `);
        
        if (notifTable.length > 0) {
            console.log('   ✅ notifications table EXISTS\n');
            results.passed.push('notifications');
        } else {
            console.log('   ⚠️  notifications table MISSING\n');
            results.warnings.push('notifications');
        }

        // Print summary
        console.log('\n========================================');
        console.log('📊 VERIFICATION SUMMARY');
        console.log('========================================');
        console.log(`✅ Passed: ${results.passed.length}`);
        console.log(`❌ Failed: ${results.failed.length}`);
        console.log(`⚠️  Warnings: ${results.warnings.length}`);
        console.log('========================================\n');

        if (results.failed.length > 0) {
            console.log('❌ CRITICAL ISSUES FOUND:');
            results.failed.forEach(item => {
                console.log(`   - ${item}`);
            });
            console.log('\n🔧 ACTION REQUIRED: Run migration scripts before using the system!');
            console.log('   Run: database\\schema_production_upgrade.sql');
            console.log('   Run: database\\PRODUCTION_erp_automation.sql\n');
        }

        if (results.warnings.length > 0) {
            console.log('⚠️  WARNINGS:');
            results.warnings.forEach(item => {
                console.log(`   - ${item}`);
            });
            console.log('\nThese features may not work properly.\n');
        }

        if (results.failed.length === 0 && results.warnings.length === 0) {
            console.log('🎉 ALL CHECKS PASSED! Database is ready for production.\n');
        }

        return results;

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    } finally {
        pool.end();
    }
}

// Run verification
verifyMigrations();
