const mysql = require('mysql2/promise');
require('dotenv').config();

async function testVoucherUpdateDirect() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n' + '='.repeat(70));
        console.log('🧪 TESTING VOUCHER UPDATE (DIRECT DB)');
        console.log('='.repeat(70) + '\n');

        // Get a pending voucher
        const [vouchers] = await connection.query(
            'SELECT id, voucher_no, status, project_id, amount, created_by FROM vouchers WHERE status = "pending" LIMIT 1'
        );

        if (vouchers.length === 0) {
            console.log('⚠️  No pending vouchers found');
            return;
        }

        const voucher = vouchers[0];
        console.log('📋 Testing voucher update:');
        console.log(`   ID: ${voucher.id}`);
        console.log(`   Voucher No: ${voucher.voucher_no}`);
        console.log(`   Status: ${voucher.status}`);
        console.log(`   Project ID: ${voucher.project_id}`);
        console.log(`   Amount: ${voucher.amount}\n`);

        // Test 1: Simple status update
        console.log('🔄 Test 1: Simple status update...');
        try {
            const [result] = await connection.query(
                'UPDATE vouchers SET status = ? WHERE id = ?',
                ['approved', voucher.id]
            );
            console.log('✅ Simple update successful');
            console.log(`   Affected rows: ${result.affectedRows}\n`);
        } catch (error) {
            console.error('❌ Simple update failed:', error.message);
            console.error('   Error code:', error.code);
            console.error('   SQL State:', error.sqlState);
            console.error('   SQL:', error.sql);
            console.log('');
        }

        // Test 2: Check if stored procedure exists
        console.log('🔄 Test 2: Checking stored procedure...');
        try {
            const [procCheck] = await connection.query(
                `SELECT COUNT(*) as count FROM information_schema.ROUTINES 
                 WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = 'create_or_add_to_sheet'`,
                [process.env.DB_NAME || 'construction_db']
            );
            
            if (procCheck[0].count > 0) {
                console.log('✅ Stored procedure exists\n');
                
                // Test calling it
                console.log('🔄 Test 2a: Calling stored procedure...');
                try {
                    const [spResult] = await connection.query(
                        'CALL create_or_add_to_sheet(?, ?, ?, ?)',
                        [voucher.id, voucher.project_id, voucher.amount, voucher.created_by]
                    );
                    console.log('✅ Stored procedure executed successfully\n');
                } catch (spError) {
                    console.error('❌ Stored procedure failed:', spError.message);
                    console.error('   Error code:', spError.code);
                    console.error('   SQL State:', spError.sqlState);
                    console.log('');
                }
            } else {
                console.log('⚠️  Stored procedure does NOT exist\n');
            }
        } catch (error) {
            console.error('❌ Procedure check failed:', error.message);
            console.log('');
        }

        // Test 3: Update with transaction
        console.log('🔄 Test 3: Update with transaction...');
        try {
            await connection.beginTransaction();
            
            const [result] = await connection.query(
                'UPDATE vouchers SET status = ?, amount = ? WHERE id = ?',
                ['approved', 9999, voucher.id]
            );
            
            await connection.commit();
            console.log('✅ Transaction update successful');
            console.log(`   Affected rows: ${result.affectedRows}\n`);
        } catch (error) {
            await connection.rollback();
            console.error('❌ Transaction update failed:', error.message);
            console.error('   Error code:', error.code);
            console.log('');
        }

        // Verify final state
        console.log('📋 Verifying final state...');
        const [verifyVoucher] = await connection.query(
            'SELECT id, voucher_no, status, amount FROM vouchers WHERE id = ?',
            [voucher.id]
        );
        
        if (verifyVoucher.length > 0) {
            console.log('✅ Voucher state:');
            console.log(`   ID: ${verifyVoucher[0].id}`);
            console.log(`   Voucher No: ${verifyVoucher[0].voucher_no}`);
            console.log(`   Status: ${verifyVoucher[0].status}`);
            console.log(`   Amount: ${verifyVoucher[0].amount}\n`);
        }

        console.log('='.repeat(70));
        console.log('✅ DIRECT DB TESTING COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

testVoucherUpdateDirect();
