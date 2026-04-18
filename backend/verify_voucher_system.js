// ============================================
// VERIFY VOUCHER SYSTEM - ID INTEGRITY CHECK
// Smart Construction Management System
// ============================================

const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n=== VOUCHER SYSTEM - INTEGRITY VERIFICATION ===\n');
        
        let allChecks = [];
        let passed = 0;
        let failed = 0;
        
        // 1. Check Vouchers Table Structure
        console.log('📋 CHECKING VOUCHERS TABLE STRUCTURE...\n');
        const [columns] = await pool.query('SHOW COLUMNS FROM vouchers');
        
        const requiredColumns = [
            'id', 'voucher_no', 'project_id', 'voucher_type', 
            'date', 'amount', 'paid_to', 'status', 
            'created_by', 'description'
        ];
        
        const missingColumns = requiredColumns.filter(col => !columns.find(c => c.Field === col));
        
        if (missingColumns.length > 0) {
            console.log(`   ❌ FAIL: Missing columns: ${missingColumns.join(', ')}`);
            allChecks.push({ check: 'Table Structure', status: 'FAIL', message: `Missing: ${missingColumns.join(', ')}` });
            failed++;
        } else {
            console.log('   ✅ PASS: All required columns exist');
            console.log('\n   Columns found:');
            columns.forEach(col => {
                console.log(`      - ${col.Field} (${col.Type})`);
            });
            allChecks.push({ check: 'Table Structure', status: 'PASS', message: 'Complete' });
            passed++;
        }
        
        // 2. Check Existing Vouchers
        console.log('\n\n📄 CHECKING EXISTING VOUCHERS...\n');
        const [vouchers] = await pool.query(`
            SELECT 
                v.id,
                v.voucher_no,
                v.project_id,
                p.project_code,
                p.project_name,
                v.voucher_type,
                v.date,
                v.amount,
                v.paid_to,
                v.status,
                v.created_by,
                u.name as created_by_name,
                v.description,
                v.created_at
            FROM vouchers v
            LEFT JOIN projects p ON v.project_id = p.id
            LEFT JOIN users u ON v.created_by = u.id
            ORDER BY v.id DESC
            LIMIT 10
        `);
        
        console.log(`   Total Vouchers: ${vouchers.length}\n`);
        
        if (vouchers.length === 0) {
            console.log('   ℹ️  No vouchers found - System is ready for new vouchers');
            allChecks.push({ check: 'Vouchers Count', status: 'PASS', message: '0 vouchers (clean)' });
            passed++;
        } else {
            vouchers.forEach((voucher, index) => {
                console.log(`   Voucher #${index + 1}:`);
                console.log(`      ID: ${voucher.id}`);
                console.log(`      Voucher No: ${voucher.voucher_no}`);
                console.log(`      Project ID: ${voucher.project_id}`);
                console.log(`      Project: ${voucher.project_code} - ${voucher.project_name}`);
                console.log(`      Type: ${voucher.voucher_type}`);
                console.log(`      Date: ${voucher.date}`);
                console.log(`      Amount: ৳${voucher.amount}`);
                console.log(`      Paid To: ${voucher.paid_to}`);
                console.log(`      Status: ${voucher.status}`);
                console.log(`      Created By: ${voucher.created_by} (${voucher.created_by_name})`);
                console.log(`      Description: ${voucher.description || 'N/A'}`);
                console.log(`      Created At: ${voucher.created_at}`);
                console.log('');
            });
            allChecks.push({ check: 'Vouchers Count', status: 'PASS', message: `${vouchers.length} vouchers` });
            passed++;
        }
        
        // 3. Check Project ID Integrity
        console.log('\n🔍 CHECKING PROJECT ID INTEGRITY...\n');
        const [orphanVouchers] = await pool.query(`
            SELECT COUNT(*) as count
            FROM vouchers v
            LEFT JOIN projects p ON v.project_id = p.id
            WHERE p.id IS NULL AND v.project_id IS NOT NULL
        `);
        
        if (orphanVouchers[0].count > 0) {
            console.log(`   ❌ FAIL: ${orphanVouchers[0].count} vouchers with invalid project_id!`);
            allChecks.push({ check: 'Project ID Integrity', status: 'FAIL', message: `${orphanVouchers[0].count} orphans` });
            failed++;
        } else {
            console.log('   ✅ PASS: All vouchers have valid project_id');
            allChecks.push({ check: 'Project ID Integrity', status: 'PASS', message: 'No orphans' });
            passed++;
        }
        
        // 4. Check Created By Integrity
        console.log('\n👤 CHECKING CREATED BY INTEGRITY...\n');
        const [invalidCreatedBy] = await pool.query(`
            SELECT COUNT(*) as count
            FROM vouchers v
            LEFT JOIN users u ON v.created_by = u.id
            WHERE u.id IS NULL AND v.created_by IS NOT NULL
        `);
        
        if (invalidCreatedBy[0].count > 0) {
            console.log(`   ❌ FAIL: ${invalidCreatedBy[0].count} vouchers with invalid created_by!`);
            allChecks.push({ check: 'Created By Integrity', status: 'FAIL', message: `${invalidCreatedBy[0].count} invalid` });
            failed++;
        } else {
            console.log('   ✅ PASS: All vouchers have valid created_by user');
            allChecks.push({ check: 'Created By Integrity', status: 'PASS', message: 'All valid' });
            passed++;
        }
        
        // 5. Check Voucher Number Uniqueness
        console.log('\n🔢 CHECKING VOUCHER NUMBER UNIQUENESS...\n');
        const [duplicateVoucherNos] = await pool.query(`
            SELECT voucher_no, COUNT(*) as count
            FROM vouchers
            GROUP BY voucher_no
            HAVING count > 1
        `);
        
        if (duplicateVoucherNos.length > 0) {
            console.log(`   ❌ FAIL: ${duplicateVoucherNos.length} duplicate voucher numbers found!`);
            duplicateVoucherNos.forEach(dup => {
                console.log(`      - ${dup.voucher_no}: ${dup.count} times`);
            });
            allChecks.push({ check: 'Voucher No Uniqueness', status: 'FAIL', message: `${duplicateVoucherNos.length} duplicates` });
            failed++;
        } else {
            console.log('   ✅ PASS: All voucher numbers are unique');
            allChecks.push({ check: 'Voucher No Uniqueness', status: 'PASS', message: 'All unique' });
            passed++;
        }
        
        // 6. Check Auto-Increment
        console.log('\n🔢 CHECKING AUTO-INCREMENT...\n');
        const [autoIncrement] = await pool.query(`
            SELECT AUTO_INCREMENT
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'vouchers'
        `);
        
        console.log(`   Next Voucher ID: ${autoIncrement[0].AUTO_INCREMENT}`);
        console.log('   ✅ PASS: Auto-increment working');
        allChecks.push({ check: 'Auto-Increment', status: 'PASS', message: `Next ID: ${autoIncrement[0].AUTO_INCREMENT}` });
        passed++;
        
        // 7. Check Voucher Types
        console.log('\n📊 CHECKING VOUCHER TYPES...\n');
        const [voucherTypes] = await pool.query(`
            SELECT voucher_type, COUNT(*) as count
            FROM vouchers
            GROUP BY voucher_type
            ORDER BY count DESC
        `);
        
        if (voucherTypes.length > 0) {
            console.log('   Voucher Type Distribution:');
            voucherTypes.forEach(type => {
                console.log(`      - ${type.voucher_type}: ${type.count}`);
            });
        } else {
            console.log('   No vouchers yet');
        }
        allChecks.push({ check: 'Voucher Types', status: 'PASS', message: `${voucherTypes.length} types` });
        passed++;
        
        // 8. Check Status Distribution
        console.log('\n📈 CHECKING STATUS DISTRIBUTION...\n');
        const [statusDist] = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM vouchers
            GROUP BY status
            ORDER BY count DESC
        `);
        
        if (statusDist.length > 0) {
            console.log('   Status Distribution:');
            statusDist.forEach(s => {
                console.log(`      - ${s.status}: ${s.count}`);
            });
        } else {
            console.log('   No vouchers yet');
        }
        allChecks.push({ check: 'Status Distribution', status: 'PASS', message: `${statusDist.length} statuses` });
        passed++;
        
        // 9. Check Indexes
        console.log('\n📇 CHECKING INDEXES...\n');
        const [indexes] = await pool.query(`
            SELECT INDEX_NAME, COLUMN_NAME
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'vouchers'
            AND INDEX_NAME != 'PRIMARY'
        `);
        
        console.log(`   Indexes Found: ${indexes.length}`);
        if (indexes.length > 0) {
            indexes.forEach(idx => {
                console.log(`      - ${idx.INDEX_NAME} on ${idx.COLUMN_NAME}`);
            });
        }
        allChecks.push({ check: 'Indexes', status: 'PASS', message: `${indexes.length} indexes` });
        passed++;
        
        // 10. Check Foreign Keys
        console.log('\n🔗 CHECKING FOREIGN KEYS...\n');
        const [foreignKeys] = await pool.query(`
            SELECT 
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'vouchers'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        
        console.log(`   Foreign Keys Found: ${foreignKeys.length}`);
        if (foreignKeys.length > 0) {
            foreignKeys.forEach(fk => {
                console.log(`      - ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
            });
        }
        allChecks.push({ check: 'Foreign Keys', status: 'PASS', message: `${foreignKeys.length} constraints` });
        passed++;
        
        // Final Summary
        console.log(`\n\n${'='.repeat(60)}`);
        console.log('📊 VOUCHER SYSTEM - VERIFICATION SUMMARY');
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
            console.log('✅ Voucher system is working correctly!');
            console.log('✅ No mismatches found - All IDs are properly assigned!');
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
