// Test the signature status endpoint
const axios = require('axios');
require('dotenv').config();

async function testSignatureStatusEndpoint() {
    console.log('\n🧪 Testing Signature Status Endpoint...\n');
    
    try {
        // First, login to get token
        console.log('📝 Step 1: Logging in...');
        const loginResponse = await axios.post(`http://localhost:${process.env.PORT || 9000}/api/auth/login`, {
            email: 'admin@test.com',
            password: '123456'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful\n');
        
        // Get a sheet ID
        console.log('📝 Step 2: Getting sheets...');
        const sheetsResponse = await axios.get(`http://localhost:${process.env.PORT || 9000}/api/sheets`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const sheets = sheetsResponse.data.data;
        if (sheets.length === 0) {
            console.log('⚠️  No sheets found');
            return;
        }
        
        const sheetId = sheets[0].id;
        console.log(`✅ Found sheet ID: ${sheetId}\n`);
        
        // Test signature status endpoint
        console.log('📝 Step 3: Testing signature status endpoint...');
        try {
            const statusResponse = await axios.get(
                `http://localhost:${process.env.PORT || 9000}/api/workflow/sheets/${sheetId}/signature-status`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log('✅ Response status:', statusResponse.status);
            console.log('✅ Response data:', JSON.stringify(statusResponse.data, null, 2));
            
            if (statusResponse.data.data.status === 'no_workflow') {
                console.log('\n💡 Sheet has no workflow yet (this is normal)');
                console.log('✅ Endpoint works correctly - no error thrown!');
            } else {
                console.log('\n✅ Sheet has active workflow');
            }
            
        } catch (error) {
            if (error.response) {
                console.log('❌ Error response:', error.response.status);
                console.log('❌ Error data:', error.response.data);
            } else {
                console.log('❌ Error:', error.message);
            }
        }
        
        console.log('\n✨ Test complete!\n');
        
    } catch (error) {
        console.log('\n❌ Test failed!');
        console.log('Error:', error.message);
        console.log('\n💡 Make sure:');
        console.log('   1. Backend is running on port 9000');
        console.log('   2. Database is connected');
        console.log('   3. Test accounts exist\n');
    }
}

testSignatureStatusEndpoint();
