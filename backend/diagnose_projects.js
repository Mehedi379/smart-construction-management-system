const http = require('http');

console.log('\n🔍 PROJECT DETECTION DIAGNOSTIC\n');
console.log('='.repeat(60));

// Step 1: Check Database
console.log('\n📊 STEP 1: Checking Database...');
console.log('-'.repeat(60));

const pool = require('./src/config/database');

pool.query('SELECT id, project_code, project_name, status FROM projects')
    .then(([projects]) => {
        console.log(`Found ${projects.length} project(s) in database:\n`);
        if (projects.length > 0) {
            console.table(projects);
        } else {
            console.log('⚠️  No projects found in database!');
            console.log('💡 Login as admin and create a project first.\n');
        }

        // Step 2: Test API Endpoint
        console.log('\n🌐 STEP 2: Testing API Endpoint...');
        console.log('-'.repeat(60));

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
                    
                    if (response.success) {
                        console.log('✅ API Response: SUCCESS');
                        console.log(`Projects returned: ${response.data.length}\n`);
                        
                        if (response.data.length > 0) {
                            console.table(response.data);
                            console.log('\n' + '='.repeat(60));
                            console.log('✅ DIAGNOSTIC RESULT: EVERYTHING IS WORKING!');
                            console.log('='.repeat(60));
                            console.log('\n✨ Projects should appear in registration form');
                            console.log('💡 If not, refresh the page or click "Refresh" button\n');
                        } else {
                            console.log('⚠️  API returned 0 projects');
                            console.log('💡 Check database - projects might have wrong status\n');
                        }
                    } else {
                        console.log('❌ API Response: FAILED');
                        console.log('Message:', response.message, '\n');
                    }
                } catch (error) {
                    console.log('Raw Response:', data, '\n');
                }
                
                pool.end();
            });
        });

        req.on('error', (error) => {
            console.log('❌ Cannot connect to backend server!');
            console.log('\n💡 SOLUTION:');
            console.log('   1. Open terminal in backend folder');
            console.log('   2. Run: npm run dev');
            console.log('   3. Wait for "Server running on port 5000"');
            console.log('   4. Then test again\n');
            console.log('='.repeat(60) + '\n');
            pool.end();
        });

        req.end();

    })
    .catch(err => {
        console.error('❌ Database error:', err.message);
        console.log('\n💡 Check your .env file and MySQL connection\n');
        pool.end();
    });
