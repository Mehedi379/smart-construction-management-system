const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🧪 Testing Voucher Approval...\n');
        
        // Get a pending voucher
        const [vouchers] = await pool.query(
            'SELECT id, voucher_no, status, project_id, amount FROM vouchers WHERE status = "pending" LIMIT 1'
        );
        
        if (vouchers.length === 0) {
            console.log('❌ No pending vouchers found!');
            console.log('\n📋 Please create a voucher first:\n');
            console.log('   1. Login as: engineer@test.com');
            console.log('   2. Go to Vouchers');
            console.log('   3. Create a voucher');
            console.log('   4. Then try approval again\n');
            process.exit(0);
        }
        
        const voucher = vouchers[0];
        console.log(`📋 Found voucher: ${voucher.voucher_no}`);
        console.log(`   ID: ${voucher.id}`);
        console.log(`   Status: ${voucher.status}`);
        console.log(`   Amount: ৳${voucher.amount}`);
        console.log(`   Project ID: ${voucher.project_id}\n`);
        
        // Try to approve
        console.log('🔧 Attempting to approve...\n');
        
        const [result] = await pool.query(
            'UPDATE vouchers SET status = "approved" WHERE id = ?',
            [voucher.id]
        );
        
        if (result.affectedRows > 0) {
            console.log('✅ Voucher approved successfully!\n');
            
            // Verify
            const [updated] = await pool.query(
                'SELECT id, voucher_no, status FROM vouchers WHERE id = ?',
                [voucher.id]
            );
            
            console.log('📋 Updated voucher:');
            console.log(`   ID: ${updated[0].id}`);
            console.log(`   Voucher No: ${updated[0].voucher_no}`);
            console.log(`   Status: ${updated[0].status} ✅\n`);
            
            console.log('🎉 Database update works!\n');
            console.log('⚠️  If frontend still fails, the issue is:');
            console.log('   - Frontend not sending correct data');
            console.log('   - API endpoint error');
            console.log('   - Authentication issue\n');
        } else {
            console.log('❌ Failed to update voucher\n');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
})();
