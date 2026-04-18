const http = require('http');

console.log('\n🧪 TESTING /api/projects/active ENDPOINT\n');
console.log('='.repeat(60));

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/projects/active',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}\n`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('Response:');
            console.log(JSON.stringify(response, null, 2));
            
            if (response.success && response.data && response.data.length > 0) {
                console.log('\n✅ SUCCESS! Found', response.data.length, 'project(s)');
                console.table(response.data);
            } else {
                console.log('\n⚠️  No projects found or error occurred');
            }
        } catch (error) {
            console.log('Raw Response:', data);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✨ Test completed\n');
    });
});

req.on('error', (error) => {
    console.error('❌ Error connecting to server:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 5000');
    console.log('   Run: npm run dev (in backend folder)');
    console.log('\n' + '='.repeat(60) + '\n');
});

req.end();
