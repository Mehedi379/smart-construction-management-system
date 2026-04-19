const https = require('https');

console.log('🔐 Testing Login...\n');

const data = JSON.stringify({
    email: 'admin@khazabilkis.com',
    password: 'admin123'
});

const options = {
    hostname: 'smart-construction-backend-production.up.railway.app',
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    },
    timeout: 10000
};

const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    
    let response = '';
    res.on('data', chunk => response += chunk);
    res.on('end', () => {
        console.log('\nFull Response:');
        console.log(response);
        
        try {
            const parsed = JSON.parse(response);
            if (parsed.success) {
                console.log('\n✅ SUCCESS!');
                console.log('Token:', parsed.data.token ? 'YES' : 'NO');
                console.log('User:', parsed.data.user);
            } else {
                console.log('\n❌ Failed:', parsed.message);
            }
        } catch (e) {
            console.log('\nCould not parse response');
        }
    });
});

req.on('error', (e) => {
    console.log('❌ Request Error:', e.message);
});

req.on('timeout', () => {
    console.log('❌ Request Timeout');
    req.destroy();
});

req.write(data);
req.end();
