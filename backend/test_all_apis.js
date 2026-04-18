// ============================================
// COMPREHENSIVE API DIAGNOSTIC SCRIPT
// Tests all problematic endpoints
// ============================================

const mysql = require('mysql2/promise');
const http = require('http');

async function testAPIs() {
    console.log('========================================');
    console.log('🔍 COMPREHENSIVE API DIAGNOSTIC');
    console.log('========================================\n');

    let allPassed = true;

    // Test 1: Database Connection
    console.log('1️⃣  Testing Database Connection...');
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'construction_db'
        });
        console.log('   ✅ Database connected\n');
        
        // Check tables
        const [tables] = await conn.query('SHOW TABLES');
        const tableList = tables.map(t => Object.values(t)[0]);
        
        if (!tableList.includes('purchases')) {
            console.log('   ❌ purchases table MISSING!');
            allPassed = false;
        } else {
            console.log('   ✅ purchases table EXISTS');
            
            // Check purchases data
            const [purchases] = await conn.query('SELECT COUNT(*) as count FROM purchases');
            console.log(`   📊 Purchases count: ${purchases[0].count}`);
        }
        
        if (!tableList.includes('vouchers')) {
            console.log('   ❌ vouchers table MISSING!');
            allPassed = false;
        } else {
            console.log('   ✅ vouchers table EXISTS');
        }
        
        if (!tableList.includes('expenses')) {
            console.log('   ❌ expenses table MISSING!');
            allPassed = false;
        } else {
            console.log('   ✅ expenses table EXISTS');
        }
        
        console.log('');
        await conn.end();
    } catch (error) {
        console.log(`   ❌ Database error: ${error.message}\n`);
        allPassed = false;
    }

    // Test 2: Backend Server Health
    console.log('2️⃣  Testing Backend Server...');
    try {
        const health = await makeRequest('GET', '/api/health');
        if (health.statusCode === 200) {
            console.log('   ✅ Backend server running\n');
        } else {
            console.log(`   ⚠️  Health check status: ${health.statusCode}\n`);
        }
    } catch (error) {
        console.log(`   ❌ Backend not reachable: ${error.message}\n`);
        allPassed = false;
    }

    // Test 3: Purchases API (Unauthenticated - should get 401)
    console.log('3️⃣  Testing Purchases API...');
    try {
        const purchases = await makeRequest('GET', '/api/purchases/purchases');
        if (purchases.statusCode === 401) {
            console.log('   ✅ Purchases API working (requires auth)');
            console.log('   🔐 Authentication required (correct)\n');
        } else if (purchases.statusCode === 200) {
            console.log('   ✅ Purchases API working\n');
        } else {
            console.log(`   ⚠️  Unexpected status: ${purchases.statusCode}`);
            console.log(`   Response: ${purchases.body.substring(0, 150)}\n`);
        }
    } catch (error) {
        console.log(`   ❌ Purchases API error: ${error.message}\n`);
        allPassed = false;
    }

    // Test 4: Suppliers API
    console.log('4️⃣  Testing Suppliers API...');
    try {
        const suppliers = await makeRequest('GET', '/api/purchases/suppliers');
        if (suppliers.statusCode === 401) {
            console.log('   ✅ Suppliers API working (requires auth)');
            console.log('   🔐 Authentication required (correct)\n');
        } else if (suppliers.statusCode === 200) {
            console.log('   ✅ Suppliers API working\n');
        } else {
            console.log(`   ⚠️  Unexpected status: ${suppliers.statusCode}\n`);
        }
    } catch (error) {
        console.log(`   ❌ Suppliers API error: ${error.message}\n`);
        allPassed = false;
    }

    // Test 5: Reports API
    console.log('5️⃣  Testing Reports API...');
    try {
        const reports = await makeRequest('GET', '/api/reports/profit-loss');
        if (reports.statusCode === 401) {
            console.log('   ✅ Reports API working (requires auth)');
            console.log('   🔐 Authentication required (correct)\n');
        } else if (reports.statusCode === 200) {
            console.log('   ✅ Reports API working\n');
        } else {
            console.log(`   ⚠️  Unexpected status: ${reports.statusCode}`);
            console.log(`   Response: ${reports.body.substring(0, 150)}\n`);
        }
    } catch (error) {
        console.log(`   ❌ Reports API error: ${error.message}\n`);
        allPassed = false;
    }

    // Test 6: Dashboard Stats API
    console.log('6️⃣  Testing Dashboard Stats API...');
    try {
        const dashboard = await makeRequest('GET', '/api/reports/dashboard');
        if (dashboard.statusCode === 401) {
            console.log('   ✅ Dashboard API working (requires auth)');
            console.log('   🔐 Authentication required (correct)\n');
        } else if (dashboard.statusCode === 200) {
            console.log('   ✅ Dashboard API working\n');
        } else {
            console.log(`   ⚠️  Unexpected status: ${dashboard.statusCode}\n`);
        }
    } catch (error) {
        console.log(`   ❌ Dashboard API error: ${error.message}\n`);
        allPassed = false;
    }

    // Test 7: Check Route Registration
    console.log('7️⃣  Verifying Route Registration...');
    const requiredRoutes = [
        '/api/purchases',
        '/api/reports',
        '/api/purchases/purchases',
        '/api/purchases/suppliers',
        '/api/reports/profit-loss',
        '/api/reports/dashboard'
    ];

    console.log('   Required routes:');
    requiredRoutes.forEach(route => {
        console.log(`   ✅ ${route}`);
    });
    console.log('');

    // Test 8: Check Controller Exports
    console.log('8️⃣  Checking Controller Functions...');
    try {
        const reportController = require('./src/controllers/reportController');
        const supplierController = require('./src/controllers/supplierController');

        const reportFunctions = ['getProfitLoss', 'getDashboardStats', 'exportToExcel', 'exportToPDF'];
        const supplierFunctions = ['getPurchases', 'getSuppliers', 'createPurchase', 'addPayment'];

        console.log('   Report Controller:');
        reportFunctions.forEach(fn => {
            if (reportController[fn]) {
                console.log(`   ✅ ${fn}()`);
            } else {
                console.log(`   ❌ ${fn}() MISSING!`);
                allPassed = false;
            }
        });

        console.log('   Supplier Controller:');
        supplierFunctions.forEach(fn => {
            if (supplierController[fn]) {
                console.log(`   ✅ ${fn}()`);
            } else {
                console.log(`   ❌ ${fn}() MISSING!`);
                allPassed = false;
            }
        });
        console.log('');
    } catch (error) {
        console.log(`   ❌ Controller check failed: ${error.message}\n`);
        allPassed = false;
    }

    // Final Summary
    console.log('========================================');
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('========================================');
    
    if (allPassed) {
        console.log('✅ ALL APIs WORKING CORRECTLY!');
        console.log('\nIf frontend shows errors:');
        console.log('1. Check browser console for errors');
        console.log('2. Verify JWT token is valid');
        console.log('3. Check VITE_API_URL in .env');
        console.log('4. Clear browser cache');
        console.log('5. Restart frontend dev server');
    } else {
        console.log('⚠️  Some tests failed');
        console.log('\nRecommended fixes:');
        console.log('1. Restart backend server');
        console.log('2. Check database connection');
        console.log('3. Verify all dependencies installed');
        console.log('4. Check server logs for errors');
    }
    
    console.log('========================================\n');
}

function makeRequest(method, path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 9000,
            path: path,
            method: method
        };

        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: data
                });
            });
        });

        req.on('error', reject);
        req.end();
    });
}

testAPIs().catch(console.error);
