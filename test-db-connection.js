const https = require('https');

console.log('🔍 Testing Database Connection Through Backend API...\n');

// Test a simple database query through a public endpoint
const testEndpoints = [
    {
        name: 'Get Active Projects (Public)',
        method: 'GET',
        path: '/api/projects/active',
        data: null
    },
    {
        name: 'Login (Tests users table)',
        method: 'POST',
        path: '/api/auth/login',
        data: {
            email: 'admin@khazabilkis.com',
            password: 'admin123'
        }
    }
];

async function testEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'smart-construction-backend-production.up.railway.app',
            path: endpoint.path,
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        };

        if (endpoint.data) {
            const body = JSON.stringify(endpoint.data);
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = https.request(options, (res) => {
            let response = '';
            res.on('data', chunk => response += chunk);
            res.on('end', () => {
                resolve({
                    name: endpoint.name,
                    status: res.statusCode,
                    response: response
                });
            });
        });

        req.on('error', (e) => {
            resolve({
                name: endpoint.name,
                status: 0,
                error: e.message
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                name: endpoint.name,
                status: 0,
                error: 'Request timeout'
            });
        });

        if (endpoint.data) {
            req.write(JSON.stringify(endpoint.data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('='.repeat(70));
    console.log('Testing Database-Related Endpoints');
    console.log('='.repeat(70));
    console.log('');

    for (const endpoint of testEndpoints) {
        console.log(`📋 Testing: ${endpoint.name}`);
        console.log('-'.repeat(70));
        
        const result = await testEndpoint(endpoint);
        console.log(`Status: ${result.status || 'Error'}`);
        
        if (result.error) {
            console.log(`Error: ${result.error}`);
        } else {
            console.log(`Response: ${result.response}`);
            
            // Analyze the response for common errors
            if (result.response.includes('ECONNREFUSED')) {
                console.log('\n❌ DIAGNOSIS: Database connection refused');
                console.log('   → MySQL might be running on different port/host');
                console.log('   → Check DB_HOST and DB_PORT in Railway variables');
            } else if (result.response.includes('ER_ACCESS_DENIED')) {
                console.log('\n❌ DIAGNOSIS: Database access denied');
                console.log('   → DB_USER or DB_PASSWORD is wrong');
                console.log('   → Update credentials from MySQL Variables');
            } else if (result.response.includes('ER_NO_SUCH_TABLE')) {
                console.log('\n❌ DIAGNOSIS: Database table does not exist');
                console.log('   → Need to run database/schema.sql');
            } else if (result.response.includes('ER_BAD_DB_ERROR')) {
                console.log('\n❌ DIAGNOSIS: Database does not exist');
                console.log('   → DB_NAME might be wrong');
                console.log('   → Database should be "railway" on Railway platform');
            } else if (result.response.includes('ETIMEDOUT') || result.response.includes('timeout')) {
                console.log('\n❌ DIAGNOSIS: Database connection timeout');
                console.log('   → Database might be on internal network');
                console.log('   → Use Railway\'s internal connection variables');
            } else if (result.status === 500) {
                console.log('\n⚠️  DIAGNOSIS: Internal server error');
                console.log('   → Check Railway backend logs for exact error');
            }
        }
        console.log('');
    }

    console.log('='.repeat(70));
    console.log('📝 NEXT STEPS:');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. Check Railway Backend Logs:');
    console.log('   → Railway Dashboard → Backend → Deployments → Logs');
    console.log('   → Look for database connection errors');
    console.log('');
    console.log('2. Verify Database Variables in Railway:');
    console.log('   → Backend Service → Variables tab');
    console.log('   → Check these are correct:');
    console.log('     - DB_HOST (should match MYSQLHOST)');
    console.log('     - DB_PORT (should match MYSQLPORT)');
    console.log('     - DB_USER (should match MYSQLUSER)');
    console.log('     - DB_PASSWORD (should match MYSQLPASSWORD)');
    console.log('     - DB_NAME (should match MYSQLDATABASE, usually "railway")');
    console.log('');
    console.log('3. If tables don\'t exist:');
    console.log('   → Connect to MySQL using external connection');
    console.log('   → Run: database/schema.sql');
    console.log('   → Run: database/create_admin.sql');
    console.log('');
    console.log('='.repeat(70));
}

runTests().catch(console.error);
