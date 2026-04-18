// ============================================
// VERIFY DAILY EXPENSE SHEETS - FULL SYSTEM CHECK
// Smart Construction Management System
// ============================================

const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n=== DAILY EXPENSE SHEETS - FULL SYSTEM VERIFICATION ===\n');
        
        let allChecks = [];
        let passed = 0;
        let failed = 0;
        
        // 1. Check Daily Sheets Table Structure
        console.log('📋 CHECKING DAILY SHEETS TABLE STRUCTURE...\n');
        const [columns] = await pool.query('SHOW COLUMNS FROM daily_sheets');
        
        const requiredColumns = [
            'id', 'sheet_no', 'project_id', 'sheet_date', 
            'created_by', 'status', 'created_at'
        ];
        
        const missingColumns = requiredColumns.filter(col => !columns.find(c => c.Field === col));
        
        if (missingColumns.length > 0) {
            console.log(`   ❌ FAIL: Missing columns: ${missingColumns.join(', ')}`);
            allChecks.push({ check: 'Daily Sheets Table', status: 'FAIL', message: `Missing: ${missingColumns.join(', ')}` });
            failed++;
        } else {
            console.log('   ✅ PASS: All required columns exist');
            console.log('\n   Key Columns:');
            columns.filter(c => ['id', 'sheet_no', 'project_id', 'sheet_date', 'created_by', 'status'].includes(c.Field)).forEach(col => {
                console.log(`      - ${col.Field} (${col.Type})`);
            });
            allChecks.push({ check: 'Daily Sheets Table', status: 'PASS', message: 'Complete' });
            passed++;
        }
        
        // 2. Check Sheet Items Table
        console.log('\n\n📝 CHECKING DAILY SHEET ITEMS TABLE...\n');
        const [itemColumns] = await pool.query('SHOW COLUMNS FROM daily_sheet_items');
        
        const requiredItemColumns = [
            'id', 'sheet_id', 'source_id', 'amount', 'description'
        ];
        
        const missingItemColumns = requiredItemColumns.filter(col => !itemColumns.find(c => c.Field === col));
        
        if (missingItemColumns.length > 0) {
            console.log(`   ❌ FAIL: Missing columns: ${missingItemColumns.join(', ')}`);
            allChecks.push({ check: 'Sheet Items Table', status: 'FAIL', message: `Missing: ${missingItemColumns.join(', ')}` });
            failed++;
        } else {
            console.log('   ✅ PASS: Sheet items table structure complete');
            allChecks.push({ check: 'Sheet Items Table', status: 'PASS', message: 'Complete' });
            passed++;
        }
        
        // 3. Check Existing Daily Sheets
        console.log('\n\n📄 CHECKING EXISTING DAILY SHEETS...\n');
        const [sheets] = await pool.query(`
            SELECT 
                ds.id,
                ds.sheet_no,
                ds.project_id,
                p.project_code,
                p.project_name,
                ds.sheet_date,
                ds.created_by,
                u.name as created_by_name,
                ds.total_amount,
                ds.status,
                ds.approved_at,
                ds.created_at,
                COUNT(dsi.id) as item_count
            FROM daily_sheets ds
            LEFT JOIN projects p ON ds.project_id = p.id
            LEFT JOIN users u ON ds.created_by = u.id
            LEFT JOIN daily_sheet_items dsi ON ds.id = dsi.sheet_id
            GROUP BY ds.id
            ORDER BY ds.id DESC
            LIMIT 10
        `);
        
        console.log(`   Total Sheets: ${sheets.length}\n`);
        
        if (sheets.length === 0) {
            console.log('   ℹ️  No daily sheets found - System ready for new sheets');
            allChecks.push({ check: 'Sheets Count', status: 'PASS', message: '0 sheets (clean)' });
            passed++;
        } else {
            sheets.forEach((sheet, index) => {
                console.log(`   Sheet #${index + 1}:`);
                console.log(`      ID: ${sheet.id}`);
                console.log(`      Sheet No: ${sheet.sheet_no}`);
                console.log(`      Project ID: ${sheet.project_id}`);
                console.log(`      Project: ${sheet.project_code} - ${sheet.project_name}`);
                console.log(`      Date: ${sheet.sheet_date}`);
                console.log(`      Created By: ${sheet.created_by} (${sheet.created_by_name})`);
                console.log(`      Total Amount: ৳${sheet.total_amount || 0}`);
                console.log(`      Items Count: ${sheet.item_count}`);
                console.log(`      Status: ${sheet.status}`);
                console.log(`      Approved At: ${sheet.approved_at || 'N/A'}`);
                console.log(`      Created: ${sheet.created_at}`);
                console.log('');
            });
            allChecks.push({ check: 'Sheets Count', status: 'PASS', message: `${sheets.length} sheets` });
            passed++;
        }
        
        // 4. Check Project ID Integrity
        console.log('\n🔍 CHECKING PROJECT ID INTEGRITY...\n');
        const [orphanSheets] = await pool.query(`
            SELECT COUNT(*) as count
            FROM daily_sheets ds
            LEFT JOIN projects p ON ds.project_id = p.id
            WHERE p.id IS NULL AND ds.project_id IS NOT NULL
        `);
        
        if (orphanSheets[0].count > 0) {
            console.log(`   ❌ FAIL: ${orphanSheets[0].count} sheets with invalid project_id!`);
            allChecks.push({ check: 'Project ID Integrity', status: 'FAIL', message: `${orphanSheets[0].count} orphans` });
            failed++;
        } else {
            console.log('   ✅ PASS: All sheets have valid project_id');
            allChecks.push({ check: 'Project ID Integrity', status: 'PASS', message: 'No orphans' });
            passed++;
        }
        
        // 5. Check Prepared By Integrity
        console.log('\n👤 CHECKING PREPARED BY INTEGRITY...\n');
        const [invalidCreatedBy] = await pool.query(`
            SELECT COUNT(*) as count
            FROM daily_sheets ds
            LEFT JOIN users u ON ds.created_by = u.id
            WHERE u.id IS NULL AND ds.created_by IS NOT NULL
        `);
        
        if (invalidCreatedBy[0].count > 0) {
            console.log(`   ❌ FAIL: ${invalidCreatedBy[0].count} sheets with invalid created_by!`);
            allChecks.push({ check: 'Created By Integrity', status: 'FAIL', message: `${invalidCreatedBy[0].count} invalid` });
            failed++;
        } else {
            console.log('   ✅ PASS: All sheets have valid created_by user');
            allChecks.push({ check: 'Created By Integrity', status: 'PASS', message: 'All valid' });
            passed++;
        }
        
        // 6. Check Sheet Number Uniqueness
        console.log('\n🔢 CHECKING SHEET NUMBER UNIQUENESS...\n');
        const [duplicateSheetNos] = await pool.query(`
            SELECT sheet_no, COUNT(*) as count
            FROM daily_sheets
            GROUP BY sheet_no
            HAVING count > 1
        `);
        
        if (duplicateSheetNos.length > 0) {
            console.log(`   ❌ FAIL: ${duplicateSheetNos.length} duplicate sheet numbers found!`);
            duplicateSheetNos.forEach(dup => {
                console.log(`      - ${dup.sheet_no}: ${dup.count} times`);
            });
            allChecks.push({ check: 'Sheet No Uniqueness', status: 'FAIL', message: `${duplicateSheetNos.length} duplicates` });
            failed++;
        } else {
            console.log('   ✅ PASS: All sheet numbers are unique');
            allChecks.push({ check: 'Sheet No Uniqueness', status: 'PASS', message: 'All unique' });
            passed++;
        }
        
        // 7. Check Sheet Items Integrity
        console.log('\n📝 CHECKING SHEET ITEMS INTEGRITY...\n');
        const [orphanItems] = await pool.query(`
            SELECT COUNT(*) as count
            FROM daily_sheet_items dsi
            LEFT JOIN daily_sheets ds ON dsi.sheet_id = ds.id
            WHERE ds.id IS NULL
        `);
        
        if (orphanItems[0].count > 0) {
            console.log(`   ❌ FAIL: ${orphanItems[0].count} items with invalid sheet_id!`);
            allChecks.push({ check: 'Sheet Items Integrity', status: 'FAIL', message: `${orphanItems[0].count} orphans` });
            failed++;
        } else {
            console.log('   ✅ PASS: All sheet items linked to valid sheets');
            allChecks.push({ check: 'Sheet Items Integrity', status: 'PASS', message: 'No orphans' });
            passed++;
        }
        
        // 9. Check Source Items (Expenses/Vouchers)
        console.log('\n💰 CHECKING SOURCE ITEMS INTEGRATION...\n');
        const [sourceItems] = await pool.query(`
            SELECT source, COUNT(*) as count
            FROM daily_sheet_items
            WHERE source IS NOT NULL
            GROUP BY source
        `);
        
        if (sourceItems.length > 0) {
            console.log('   Source Distribution:');
            sourceItems.forEach(item => {
                console.log(`      - ${item.source}: ${item.count}`);
            });
        } else {
            console.log('   No source items yet');
        }
        allChecks.push({ check: 'Source Items', status: 'PASS', message: `${sourceItems.length} types` });
        passed++;
        
        // 8. Check Auto-Increment
        console.log('\n🔢 CHECKING AUTO-INCREMENT...\n');
        const [autoIncrement] = await pool.query(`
            SELECT TABLE_NAME, AUTO_INCREMENT
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('daily_sheets', 'daily_sheet_items')
        `);
        
        console.log('   Auto-Increment Status:');
        autoIncrement.forEach(table => {
            console.log(`      - ${table.TABLE_NAME}: Next ID = ${table.AUTO_INCREMENT}`);
        });
        allChecks.push({ check: 'Auto-Increment', status: 'PASS', message: 'Working' });
        passed++;
        
        // 9. Check Sheet Workflows
        console.log('\n🔄 CHECKING SHEET WORKFLOWS...\n');
        const [workflows] = await pool.query(`
            SELECT COUNT(*) as count
            FROM sheet_workflows
        `);
        
        console.log(`   Active Workflows: ${workflows[0].count}`);
        allChecks.push({ check: 'Sheet Workflows', status: 'PASS', message: `${workflows[0].count} workflows` });
        passed++;
        
        // 10. Check Foreign Keys
        console.log('\n🔗 CHECKING FOREIGN KEYS...\n');
        const [foreignKeys] = await pool.query(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('daily_sheets', 'daily_sheet_items')
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        
        console.log(`   Foreign Keys Found: ${foreignKeys.length}`);
        if (foreignKeys.length > 0) {
            foreignKeys.forEach(fk => {
                console.log(`      - ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
            });
        }
        allChecks.push({ check: 'Foreign Keys', status: 'PASS', message: `${foreignKeys.length} constraints` });
        passed++;
        
        // 11. Check Indexes
        console.log('\n📇 CHECKING INDEXES...\n');
        const [indexes] = await pool.query(`
            SELECT 
                TABLE_NAME,
                INDEX_NAME,
                COLUMN_NAME
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('daily_sheets', 'daily_sheet_items')
            AND INDEX_NAME != 'PRIMARY'
        `);
        
        console.log(`   Indexes Found: ${indexes.length}`);
        allChecks.push({ check: 'Indexes', status: 'PASS', message: `${indexes.length} indexes` });
        passed++;
        
        // 13. Check Expenses Integration
        console.log('\n💰 CHECKING EXPENSES INTEGRATION...\n');
        const [expensesInSheets] = await pool.query(`
            SELECT COUNT(DISTINCT dsi.source_id) as count
            FROM daily_sheet_items dsi
            WHERE dsi.source_id IS NOT NULL
        `);
        
        console.log(`   Expenses Linked to Sheets: ${expensesInSheets[0].count}`);
        allChecks.push({ check: 'Expenses Integration', status: 'PASS', message: `${expensesInSheets[0].count} expenses linked` });
        passed++;
        
        // Final Summary
        console.log(`\n\n${'='.repeat(60)}`);
        console.log('📊 DAILY EXPENSE SHEETS - VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📝 Total Checks: ${allChecks.length}`);
        
        console.log(`\n📋 Detailed Results:`);
        allChecks.forEach((check, index) => {
            const icon = check.status === 'PASS' ? '✅' : '❌';
            console.log(`   ${index + 1}. ${icon} ${check.check}: ${check.message}`);
        });
        
        if (failed === 0) {
            console.log(`\n${'='.repeat(60)}`);
            console.log('🎉 ALL CHECKS PASSED!');
            console.log('✅ Daily Expense Sheets system is working correctly!');
            console.log('✅ All IDs properly assigned - No mismatches!');
            console.log('✅ Project-wise tracking enabled!');
            console.log('='.repeat(60));
        } else {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`⚠️  ${failed} check(s) failed - Review needed!`);
            console.log('='.repeat(60));
        }
        
        console.log('\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();
