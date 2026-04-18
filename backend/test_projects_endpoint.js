const axios = require('axios');

async function testProjectsEndpoint() {
    console.log('\n========================================');
    console.log('🧪 Testing Public Projects Endpoint');
    console.log('========================================\n');

    try {
        // Test the public endpoint (no auth required)
        console.log('1️⃣  Testing GET /api/projects/active...');
        const response = await axios.get('http://localhost:9000/api/projects/active');
        
        if (response.data.success) {
            console.log('✅ Endpoint works!\n');
            console.log(`📊 Found ${response.data.data.length} active projects:\n`);
            
            response.data.data.forEach((project, index) => {
                console.log(`${index + 1}. ${project.project_name}`);
                console.log(`   Code: ${project.project_code}`);
                console.log(`   Location: ${project.location || 'N/A'}`);
                console.log(`   Status: ${project.status}\n`);
            });
        } else {
            console.log('❌ Response not successful\n');
        }

        console.log('========================================');
        console.log('✅ Test Complete');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ Test failed!');
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('No response received. Is backend running?');
            console.error('Run: cd backend && npm start');
        } else {
            console.error('Error:', error.message);
        }
        console.log('');
    }
}

testProjectsEndpoint();
