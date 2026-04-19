const https = require('https');

console.log('🔍 Testing Backend CORS Configuration...\n');

// Test if Vercel domain is allowed
const options = {
    hostname: 'smart-construction-backend-production.up.railway.app',
    path: '/api/health',
    method: 'GET',
    headers: {
        'Origin': 'https://smart-construction-management-syste.vercel.app'
    }
};

const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('\nResponse Headers:');
    console.log('Access-Control-Allow-Origin:', res.headers['access-control-allow-origin'] || 'NOT SET');
    console.log('Vary:', res.headers['vary'] || 'NOT SET');
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('\n✅ Health Check Response:', data);
    });
});

req.on('error', (e) => {
    console.log('❌ Error:', e.message);
});

req.end();
