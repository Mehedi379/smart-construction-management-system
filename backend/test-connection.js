const https = require('https');

console.log('🔍 Testing Database Connection via Backend...\n');

// Try to get environment info
const options = {
    hostname: 'smart-construction-backend-production.up.railway.app',
    path: '/api/health',
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Health Check:', res.statusCode);
        console.log(data);
    });
});

req.on('error', (e) => {
    console.log('Error:', e.message);
});

req.end();

// Now test with a direct SQL query through a test endpoint
console.log('\n⏳ Waiting 2 seconds...');
setTimeout(() => {
    const testData = JSON.stringify({});
    
    const testOptions = {
        hostname: 'smart-construction-backend-production.up.railway.app',
        path: '/api/setup/test-connection',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(testData)
        }
    };
    
    const testReq = https.request(testOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('\nTest Connection Status:', res.statusCode);
            console.log(data);
        });
    });
    
    testReq.on('error', (e) => {
        console.log('Test Error:', e.message);
    });
    
    testReq.write(testData);
    testReq.end();
}, 2000);
