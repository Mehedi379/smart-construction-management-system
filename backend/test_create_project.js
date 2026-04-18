const http = require('http');

console.log('\n🧪 TESTING PROJECT CREATION\n');
console.log('='.repeat(60));

// Test data
const testProject = {
    project_name: 'Test Auto Detect Project',
    location: 'Test Location',
    start_date: '2026-04-14',
    estimated_budget: 1000000,
    description: 'Testing auto-detection',
    status: 'ongoing'
};

console.log('\n📝 Test Project Data:');
console.log(testProject);

const postData = JSON.stringify(testProject);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/projects/create',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`\n📡 Response Status: ${res.statusCode}\n`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('Response:');
            console.log(JSON.stringify(response, null, 2));
            
            if (response.success) {
                console.log('\n✅ SUCCESS! Project created');
                console.log('Project ID:', response.data.id);
                console.log('Project Code:', response.data.project_code);
            } else {
                console.log('\n❌ FAILED!');
                console.log('Error:', response.message);
                console.log('Details:', response.error);
            }
        } catch (error) {
            console.log('Raw Response:', data);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✨ Test completed\n');
    });
});

req.on('error', (error) => {
    console.error('\n❌ Error connecting to server:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 5000');
    console.log('   Run: npm run dev (in backend folder)');
    console.log('\n' + '='.repeat(60) + '\n');
});

req.write(postData);
req.end();
