const https = require('https');

console.log('🔍 Testing Backend Health...\n');

// Test 1: Check if backend is responding
console.log('Test 1: Checking backend health endpoint...');
const healthOptions = {
    hostname: 'smart-construction-backend-production.up.railway.app',
    path: '/api/health',
    method: 'GET',
    timeout: 10000
};

const healthReq = https.request(healthOptions, (res) => {
    let response = '';
    res.on('data', chunk => response += chunk);
    res.on('end', () => {
        console.log(`Health Status: ${res.statusCode}`);
        console.log('Response:', response);
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 2: Try login
        console.log('Test 2: Testing login endpoint...');
        const loginData = JSON.stringify({
            email: 'admin@khazabilkis.com',
            password: 'admin123'
        });
        
        const loginOptions = {
            hostname: 'smart-construction-backend-production.up.railway.app',
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            },
            timeout: 10000
        };
        
        const loginReq = https.request(loginOptions, (res2) => {
            let response2 = '';
            res2.on('data', chunk => response2 += chunk);
            res2.on('end', () => {
                console.log(`Login Status: ${res2.statusCode}`);
                console.log('Response:', response2);
                console.log('\n' + '='.repeat(60) + '\n');
                
                // Test 3: Try with wrong password to see if error handling works
                console.log('Test 3: Testing with wrong password...');
                const wrongData = JSON.stringify({
                    email: 'admin@khazabilkis.com',
                    password: 'wrongpassword'
                });
                
                const wrongOptions = {
                    hostname: 'smart-construction-backend-production.up.railway.app',
                    path: '/api/auth/login',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(wrongData)
                    },
                    timeout: 10000
                };
                
                const wrongReq = https.request(wrongOptions, (res3) => {
                    let response3 = '';
                    res3.on('data', chunk => response3 += chunk);
                    res3.on('end', () => {
                        console.log(`Wrong Password Status: ${res3.statusCode}`);
                        console.log('Response:', response3);
                    });
                });
                
                wrongReq.on('error', (e) => {
                    console.log('❌ Wrong password test error:', e.message);
                });
                
                wrongReq.write(wrongData);
                wrongReq.end();
            });
        });
        
        loginReq.on('error', (e) => {
            console.log('❌ Login test error:', e.message);
        });
        
        loginReq.write(loginData);
        loginReq.end();
    });
});

healthReq.on('error', (e) => {
    console.log('❌ Health check error:', e.message);
});

healthReq.end();
