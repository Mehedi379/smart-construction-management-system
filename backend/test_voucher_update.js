// Test voucher update directly
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testVoucherUpdate() {
    console.log('\n🧪 Testing Voucher Update...\n');

    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'construction_db'
    });

    try {
        // Get current voucher
        const [voucher] = await conn.query('SELECT * FROM vouchers WHERE id = 1');
        
        if (voucher.length === 0) {
            console.log('❌ No voucher found with ID 1');
            await conn.end();
            return;
        }

        console.log('📋 Current Voucher:');
        console.log('   ID:', voucher[0].id);
        console.log('   Status:', voucher[0].status);
        console.log('   Amount:', voucher[0].amount);
        console.log('   Created By:', voucher[0].created_by);
        console.log('   Project ID:', voucher[0].project_id);

        // Try to update it
        console.log('\n📝 Attempting to update status to "approved"...');
        
        const [result] = await conn.query(
            'UPDATE vouchers SET status = ?, updated_at = NOW() WHERE id = ?',
            ['approved', 1]
        );

        console.log('✅ Update result:', result.affectedRows, 'rows affected');

        // Verify the update
        const [updated] = await conn.query('SELECT * FROM vouchers WHERE id = 1');
        console.log('\n✅ Updated Voucher:');
        console.log('   Status:', updated[0].status);

        console.log('\n✅ Direct database update SUCCESSFUL!');
        console.log('\nThis means the issue is in the application layer, not the database.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('   Code:', error.code);
        console.error('   SQL State:', error.sqlState);
    } finally {
        await conn.end();
    }
}

testVoucherUpdate().catch(console.error);
