// Test API endpoint directly
const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:9000/api';
const JWT_SECRET = 'smart_construction_secret_key_2026_change_in_production';

async function testApproval() {
    try {
        console.log('\n🧪 Testing Voucher Approval via API...\n');
        
        // Create a test token for admin
        const token = jwt.sign(
            { id: 1, email: 'admin@test.com', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Get a pending voucher
        console.log('📋 Fetching pending vouchers...');
        const vouchersRes = await axios.get(`${API_URL}/vouchers`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const vouchers = vouchersRes.data.data;
        const pendingVoucher = vouchers.find(v => v.status === 'pending');
        
        if (!pendingVoucher) {
            console.log('❌ No pending vouchers found!');
            console.log('Create a voucher first, then try again.\n');
            process.exit(0);
        }
        
        console.log(`✅ Found pending voucher: ${pendingVoucher.voucher_no}`);
        console.log(`   ID: ${pendingVoucher.id}`);
        console.log(`   Status: ${pendingVoucher.status}\n`);
        
        // Try to approve
        console.log('🔧 Approving voucher via API...\n');
        const approveRes = await axios.put(
            `${API_URL}/vouchers/${pendingVoucher.id}`,
            { status: 'approved' },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Approval successful!');
        console.log('Response:', approveRes.data);
        console.log('\n🎉 API works perfectly!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ API Error:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.message);
        console.error('Data:', error.response?.data);
        console.error('\nFull error:', error.message);
        process.exit(1);
    }
}

testApproval();
