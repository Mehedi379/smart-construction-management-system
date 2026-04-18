const http = require('http');

console.log('\n🔍 BACKEND SERVER DIAGNOSTIC\n');
console.log('='.repeat(60));

// Test 1: Check if backend is running
console.log('\n📡 TEST 1: Checking Backend Server...');
console.log('-'.repeat(60));

const healthCheckOptions = {
    hostname: 'localhost',
    port: 9000,
    path: '/api/health',
    method: 'GET'
};

const healthReq = http.request(healthCheckOptions, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            if (response.status === 'OK') {
                console.log('✅ Backend server is RUNNING on port 9000\n');
                console.log('Message:', response.message);
                
                // Test 2: Try to create project
                console.log('\n\n📝 TEST 2: Testing Project Creation API...');
                console.log('-'.repeat(60));
                console.log('⚠️  This requires authentication token');
                console.log('💡 Please check browser console for exact error');
                console.log('\nCommon issues:');
                console.log('  1. Not logged in → Login as admin');
                console.log('  2. Token expired → Logout and login again');
                console.log('  3. Not admin user → Check user role');
                console.log('  4. Browser console errors → Check F12 console');
                
            } else {
                console.log('⚠️  Backend responded but status is not OK\n');
            }
        } catch (error) {
            console.log('Raw response:', data, '\n');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✨ Diagnostic completed\n');
    });
});

healthReq.on('error', (error) => {
    console.log('❌ Backend server is NOT RUNNING!\n');
    console.log('ERROR: Cannot connect to localhost:9000\n');
    console.log('💡 SOLUTION:');
    console.log('   1. Open terminal in backend folder');
    console.log('   2. Run: npm run dev');
    console.log('   3. Wait for: "Server running on port 9000"');
    console.log('   4. Keep terminal open while using the app');
    console.log('   5. Then try creating project again');
    console.log('\n' + '='.repeat(60) + '\n');
});

healthReq.end();
