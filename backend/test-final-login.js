const https = require('https');

console.log('🔐 Testing Login After Adding Environment Variables...\n');

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
    }
};

const req = https.request(options, (res) => {
    let response = '';
    res.on('data', chunk => response += chunk);
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        
        try {
            const parsed = JSON.parse(response);
            
            if (parsed.success) {
                console.log('\n✅ LOGIN SUCCESSFUL!');
                console.log('Message:', parsed.message);
                console.log('User:', parsed.data.user.name);
                console.log('Email:', parsed.data.user.email);
                console.log('Role:', parsed.data.user.role);
                console.log('Token:', parsed.data.token ? 'Received ✓' : 'Missing ✗');
            } else {
                console.log('\n❌ LOGIN FAILED');
                console.log('Error:', parsed.message);
            }
        } catch (e) {
            console.log('\nResponse:', response);
        }
    });
});

req.on('error', (e) => {
    console.log('❌ Request Error:', e.message);
});

req.write(data);
req.end();
