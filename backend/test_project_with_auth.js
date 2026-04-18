const http = require('http');

console.log('\n🔍 SIMULATING PROJECT CREATION WITH AUTH\n');
console.log('='.repeat(60));

// First, we need to login to get a token
console.log('\n📡 Step 1: Logging in as admin...\n');

const loginData = JSON.stringify({
    email: 'admin@khazabilkis.com',
    password: 'admin123'
});

const loginOptions = {
    hostname: 'localhost',
    port: 9000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
    }
};

const loginReq = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const loginResponse = JSON.parse(data);
            
            if (!loginResponse.success) {
                console.log('❌ Login failed!');
                console.log('Error:', loginResponse.message);
                console.log('\n💡 Solution:');
                console.log('   1. Check if admin account exists');
                console.log('   2. Verify password is correct');
                console.log('   3. Try resetting admin password');
                return;
            }
            
            const token = loginResponse.data.token;
            const user = loginResponse.data.user;
            
            console.log('✅ Login successful!');
            console.log('   User:', user.name);
            console.log('   Email:', user.email);
            console.log('   Role:', user.role);
            console.log('   Token received:', token ? 'YES' : 'NO');
            
            if (user.role !== 'admin') {
                console.log('\n❌ ERROR: User is not admin!');
                console.log('   Your role:', user.role);
                console.log('   Required role: admin');
                console.log('\n💡 Solution: Login with admin account');
                return;
            }
            
            // Now try to create a project
            console.log('\n\n📝 Step 2: Creating project...\n');
            
            const projectData = JSON.stringify({
                project_name: 'Diagnostic Test Project',
                location: 'Test Location',
                start_date: '2026-04-14',
                estimated_budget: 1000000,
                description: 'Testing project creation with authentication',
                status: 'ongoing'
            });
            
            const projectOptions = {
                hostname: 'localhost',
                port: 9000,
                path: '/api/projects/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(projectData),
                    'Authorization': `Bearer ${token}`
                }
            };
            
            const projectReq = http.request(projectOptions, (res2) => {
                console.log(`Response Status: ${res2.statusCode}\n`);
                
                let data2 = '';
                res2.on('data', (chunk) => {
                    data2 += chunk;
                });
                
                res2.on('end', () => {
                    try {
                        const projectResponse = JSON.parse(data2);
                        console.log('Full Response:');
                        console.log(JSON.stringify(projectResponse, null, 2));
                        
                        if (projectResponse.success) {
                            console.log('\n✅ SUCCESS! Project created');
                            console.log('   Project ID:', projectResponse.data.id);
                            console.log('   Project Code:', projectResponse.data.project_code);
                            console.log('\n✨ Project creation is working correctly!');
                            console.log('💡 If it fails in browser, check:');
                            console.log('   1. Browser console (F12) for errors');
                            console.log('   2. Network tab for failed requests');
                            console.log('   3. Clear browser cache and try again');
                        } else {
                            console.log('\n❌ FAILED! Project creation error');
                            console.log('   Message:', projectResponse.message);
                            console.log('   Error:', projectResponse.error);
                            
                            if (res2.statusCode === 401) {
                                console.log('\n💡 Authentication error:');
                                console.log('   - Token might be invalid');
                                console.log('   - Try logout and login again');
                            } else if (res2.statusCode === 403) {
                                console.log('\n💡 Permission error:');
                                console.log('   - User is not admin');
                                console.log('   - Check user role in database');
                            } else if (res2.statusCode === 500) {
                                console.log('\n💡 Server error:');
                                console.log('   - Check backend terminal for details');
                                console.log('   - Database might have an issue');
                            }
                        }
                    } catch (error) {
                        console.log('Raw Response:', data2);
                    }
                    
                    console.log('\n' + '='.repeat(60));
                    console.log('✨ Diagnostic completed\n');
                });
            });
            
            projectReq.on('error', (error) => {
                console.error('❌ Request error:', error.message);
            });
            
            projectReq.write(projectData);
            projectReq.end();
            
        } catch (error) {
            console.log('Raw Response:', data);
        }
    });
});

loginReq.on('error', (error) => {
    console.error('❌ Login request error:', error.message);
    console.log('\n💡 Make sure backend server is running on port 9000');
});

loginReq.write(loginData);
loginReq.end();
