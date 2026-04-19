const https = require('https');

console.log('🔐 Testing Login to Railway Backend...\n');

const testData = [
    { email: 'admin@khazabilkis.com', password: 'admin123', name: 'Admin Account' }
];

testData.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.name}`);
    console.log(`Email: ${test.email}`);
    
    const data = JSON.stringify({
        email: test.email,
        password: test.password
    });
    
    const options = {
        hostname: 'smart-construction-backend-production.up.railway.app',
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };
    
    const req = https.request(options, (res) => {
        let response = '';
        res.on('data', chunk => response += chunk);
        res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            try {
                const parsed = JSON.parse(response);
                console.log('Response:', JSON.stringify(parsed, null, 2));
                
                if (parsed.success) {
                    console.log('✅ LOGIN SUCCESSFUL!');
                    console.log('Token:', parsed.data.token ? 'Received ✓' : 'Missing ✗');
                    console.log('User:', parsed.data.user?.name || 'N/A');
                    console.log('Role:', parsed.data.user?.role || 'N/A');
                } else {
                    console.log('❌ LOGIN FAILED:', parsed.message);
                }
            } catch (e) {
                console.log('Response:', response);
            }
            console.log('\n' + '='.repeat(60) + '\n');
        });
    });
    
    req.on('error', (e) => {
        console.log('❌ Error:', e.message);
        console.log('\n' + '='.repeat(60) + '\n');
    });
    
    req.write(data);
    req.end();
});
