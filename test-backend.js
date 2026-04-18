console.log('🔍 Testing Backend Connection...\n');

const BACKEND_URL = 'https://roundhouse.proxy.rlwy.net:17140';

async function testBackend() {
    try {
        console.log(`Testing: ${BACKEND_URL}/api/health\n`);
        
        const response = await fetch(`${BACKEND_URL}/api/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend is RUNNING!');
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ Backend returned error');
            const text = await response.text();
            console.log('Response:', text);
        }
    } catch (error) {
        console.log('❌ Backend is NOT accessible!');
        console.log('Error:', error.message);
        console.log('\nPossible issues:');
        console.log('1. Backend is not deployed on Railway');
        console.log('2. Wrong URL or port');
        console.log('3. Railway service is down');
        console.log('4. CORS not configured properly');
    }
}

testBackend();
