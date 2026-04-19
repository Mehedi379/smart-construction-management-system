const https = require('https');

console.log('🔍 Checking Backend Database Status...\n');

// Test health endpoint first
const healthOptions = {
    hostname: 'smart-construction-backend-production.up.railway.app',
    path: '/api/health',
    method: 'GET'
};

const healthReq = https.request(healthOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Health Check Status:', res.statusCode);
        console.log('Response:', data);
        console.log('\n' + '='.repeat(60));
    });
});

healthReq.on('error', (e) => {
    console.log('❌ Health Check Error:', e.message);
});

healthReq.end();

// Try to register a test user to see if database is working
const registerData = JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'test123456'
});

const registerOptions = {
    hostname: 'smart-construction-backend-production.up.railway.app',
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registerData)
    }
};

console.log('\nTesting Registration (to check if DB tables exist)...');

const registerReq = https.request(registerOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Registration Status:', res.statusCode);
        console.log('Response:', data);
        
        try {
            const parsed = JSON.parse(data);
            if (parsed.success) {
                console.log('\n✅ Database is working! Tables exist.');
            } else {
                console.log('\n❌ Registration failed:', parsed.message);
                if (data.includes('ER_NO_SUCH_TABLE') || data.includes('Table')) {
                    console.log('\n⚠️  Database tables do not exist!');
                    console.log('Need to run database schema migration.');
                }
            }
        } catch (e) {
            console.log('Response:', data);
        }
    });
});

registerReq.on('error', (e) => {
    console.log('❌ Registration Error:', e.message);
});

registerReq.write(registerData);
registerReq.end();
