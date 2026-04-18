// Test script to check admin panel APIs
const http = require('http');

const API_BASE = 'http://localhost:9000/api';

function makeRequest(method, path, data, token) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const options = {
            hostname: url.hostname,
            port: url.port || 9000,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testAPIs() {
    console.log('Testing Admin Panel APIs...\n');
    
    try {
        // Step 1: Login as admin
        console.log('1. Testing Login...');
        const loginRes = await makeRequest('POST', '/api/auth/login', {
            email: 'admin@construction.com',
            password: 'Admin@123'
        });
        
        if (!loginRes.data.success) {
            console.error('❌ Login failed:', loginRes.data.message);
            return;
        }
        
        const token = loginRes.data.data.token;
        console.log('✅ Login successful\n');
        
        // Step 2: Test Dashboard Stats
        console.log('2. Testing Dashboard Stats...');
        try {
            const statsRes = await makeRequest('GET', '/api/reports/dashboard-stats', null, token);
            console.log('✅ Dashboard Stats:', JSON.stringify(statsRes.data.data, null, 2));
        } catch (err) {
            console.error('❌ Dashboard Stats failed:', err.message);
        }
        
        // Step 3: Test Get Employees
        console.log('\n3. Testing Get Employees...');
        try {
            const empRes = await makeRequest('GET', '/api/employees', null, token);
            console.log('✅ Employees:', empRes.data.data?.length || 0, 'employees');
        } catch (err) {
            console.error('❌ Get Employees failed:', err.message);
        }
        
        // Step 4: Test Get Vouchers
        console.log('\n4. Testing Get Vouchers...');
        try {
            const voucherRes = await makeRequest('GET', '/api/vouchers', null, token);
            console.log('✅ Vouchers:', voucherRes.data.data?.length || 0, 'vouchers');
        } catch (err) {
            console.error('❌ Get Vouchers failed:', err.message);
        }
        
        // Step 5: Test Pending Approvals
        console.log('\n5. Testing Pending Approvals...');
        try {
            const pendingRes = await makeRequest('GET', '/api/auth/pending-approvals', null, token);
            console.log('✅ Pending Approvals:', pendingRes.data.data?.length || 0, 'pending');
        } catch (err) {
            console.error('❌ Pending Approvals failed:', err.message);
        }
        
        // Step 6: Test All User Stats
        console.log('\n6. Testing All User Stats...');
        try {
            const statsRes = await makeRequest('GET', '/api/auth/all-user-stats', null, token);
            console.log('✅ All User Stats:', JSON.stringify(statsRes.data.data, null, 2));
        } catch (err) {
            console.error('❌ All User Stats failed:', err.message);
        }
        
        // Step 7: Test Get Projects
        console.log('\n7. Testing Get Projects...');
        try {
            const projRes = await makeRequest('GET', '/api/projects', null, token);
            console.log('✅ Projects:', projRes.data.data?.length || 0, 'projects');
        } catch (err) {
            console.error('❌ Get Projects failed:', err.message);
        }
        
        console.log('\n✅ All tests completed!');
        
    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

testAPIs();
