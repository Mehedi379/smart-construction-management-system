const axios = require('axios');

async function testDashboardAPI() {
    try {
        console.log('\n🔍 Testing Dashboard API...\n');
        
        // First login
        console.log('1. Logging in...');
        const loginResponse = await axios.post('http://localhost:9000/api/auth/login', {
            email: 'accounts.head1@khazabilkis.com',
            password: 'headofficeaccounts1123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('   ✅ Login successful\n');
        console.log(`   User: ${loginResponse.data.data.user.name}`);
        console.log(`   Role: ${loginResponse.data.data.user.role}`);
        console.log(`   Is Registered: ${loginResponse.data.data.user.is_registered}\n`);
        
        // Test dashboard API
        console.log('2. Testing Dashboard API...');
        const dashboardResponse = await axios.get('http://localhost:9000/api/reports/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('   ✅ Dashboard API successful!\n');
        console.log('   Response:');
        console.log(JSON.stringify(dashboardResponse.data, null, 2));
        
    } catch (error) {
        console.error('\n❌ Error:\n');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        } else {
            console.error('   Message:', error.message);
        }
    }
}

testDashboardAPI();
