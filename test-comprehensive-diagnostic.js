const https = require('https');

console.log('='.repeat(70));
console.log('🔍 COMPREHENSIVE BACKEND DIAGNOSTIC TOOL');
console.log('='.repeat(70));
console.log('');

const BACKEND_URL = 'smart-construction-backend-production.up.railway.app';

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BACKEND_URL,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000
        };

        if (data) {
            const body = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(body);
            
            const req = https.request(options, (res) => {
                let response = '';
                res.on('data', chunk => response += chunk);
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: response
                    });
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            req.write(body);
            req.end();
        } else {
            const req = https.request(options, (res) => {
                let response = '';
                res.on('data', chunk => response += chunk);
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: response
                    });
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            req.end();
        }
    });
}

async function runDiagnostics() {
    const results = {};

    // Test 1: Health Check
    console.log('📋 Test 1: Backend Health Check');
    console.log('-'.repeat(70));
    try {
        const health = await makeRequest('GET', '/api/health');
        console.log(`Status: ${health.status} ${health.status === 200 ? '✅' : '❌'}`);
        console.log(`Response: ${health.body}`);
        results.health = health.status === 200;
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.health = false;
    }
    console.log('');

    // Test 2: Login with correct credentials
    console.log('📋 Test 2: Login with Admin Credentials');
    console.log('-'.repeat(70));
    try {
        const login = await makeRequest('POST', '/api/auth/login', {
            email: 'admin@khazabilkis.com',
            password: 'admin123'
        });
        console.log(`Status: ${login.status} ${login.status === 200 ? '✅' : '❌'}`);
        console.log(`Response: ${login.body}`);
        results.loginCorrect = login.status === 200;
        
        if (login.status === 500 && login.body.includes('ECONNREFUSED')) {
            console.log('\n⚠️  DIAGNOSIS: Database connection refused');
            console.log('   → Database service might be stopped on Railway');
            console.log('   → Database credentials might be wrong');
        } else if (login.status === 500 && login.body.includes('ER_NO_SUCH_TABLE')) {
            console.log('\n⚠️  DIAGNOSIS: Database tables do not exist');
            console.log('   → Need to run database schema migration');
        } else if (login.status === 500) {
            console.log('\n⚠️  DIAGNOSIS: Database connection error (500)');
            console.log('   → Check Railway logs for exact error');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.loginCorrect = false;
    }
    console.log('');

    // Test 3: Login with wrong password
    console.log('📋 Test 3: Login with Wrong Password (Should return 401)');
    console.log('-'.repeat(70));
    try {
        const loginWrong = await makeRequest('POST', '/api/auth/login', {
            email: 'admin@khazabilkis.com',
            password: 'wrongpassword'
        });
        console.log(`Status: ${loginWrong.status} ${loginWrong.status === 401 ? '✅' : '❌'}`);
        console.log(`Response: ${loginWrong.body}`);
        results.loginWrong = loginWrong.status === 401;
        
        if (loginWrong.status === 500) {
            console.log('\n⚠️  IMPORTANT: Even wrong password returns 500');
            console.log('   → This confirms database connection is failing');
            console.log('   → The query cannot execute at all');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.loginWrong = false;
    }
    console.log('');

    // Test 4: Try to register a new user
    console.log('📋 Test 4: Register New User (Tests if DB tables exist)');
    console.log('-'.repeat(70));
    try {
        const register = await makeRequest('POST', '/api/auth/register', {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: 'test123456'
        });
        console.log(`Status: ${register.status}`);
        console.log(`Response: ${register.body}`);
        results.register = register.status === 200 || register.status === 201;
        
        if (register.body.includes('ER_NO_SUCH_TABLE')) {
            console.log('\n❌ CRITICAL: Database tables do not exist!');
            console.log('   → You MUST run the database schema migration');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.register = false;
    }
    console.log('');

    // Summary
    console.log('='.repeat(70));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('='.repeat(70));
    console.log(`Backend Health:        ${results.health ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Login (Correct):       ${results.loginCorrect ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Login (Wrong Pwd):     ${results.loginWrong ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Registration:          ${results.register ? '✅ WORKING' : '❌ FAILED'}`);
    console.log('');

    if (!results.loginCorrect) {
        console.log('🔧 RECOMMENDED FIXES:');
        console.log('-'.repeat(70));
        console.log('');
        console.log('1️⃣  Check Railway MySQL Service:');
        console.log('   → Go to https://railway.app/dashboard');
        console.log('   → Find your MySQL service');
        console.log('   → Make sure it\'s RUNNING (green status)');
        console.log('   → If stopped, START it');
        console.log('');
        console.log('2️⃣  Update Database Credentials:');
        console.log('   → In Railway dashboard, click MySQL service');
        console.log('   → Go to Variables tab');
        console.log('   → Copy: MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE');
        console.log('   → Go to Backend service → Variables tab');
        console.log('   → Update: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
        console.log('   → Railway will auto-redeploy');
        console.log('');
        console.log('3️⃣  Run Database Migration (if tables don\'t exist):');
        console.log('   → Connect to Railway MySQL using external connection');
        console.log('   → Run: database/schema.sql');
        console.log('   → Run: database/create_admin.sql');
        console.log('');
        console.log('4️⃣  Check Railway Backend Logs:');
        console.log('   → Go to Railway dashboard → Backend service');
        console.log('   → Click Deployments → Latest deployment → Logs');
        console.log('   → Look for database connection errors');
        console.log('');
        console.log('📖 For detailed instructions, see: LOGIN_FIX_GUIDE.md');
    } else {
        console.log('✅ ALL TESTS PASSED! Login should be working.');
    }
    console.log('');
    console.log('='.repeat(70));
}

runDiagnostics().catch(console.error);
