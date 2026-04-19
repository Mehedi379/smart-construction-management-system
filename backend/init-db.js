const https = require('https');

console.log('🔧 Initializing Database...\n');

const options = {
    hostname: 'smart-construction-backend-production.up.railway.app',
    path: '/api/setup/init-database',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('\nResponse:');
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
            
            if (parsed.success) {
                console.log('\n✅ DATABASE INITIALIZED SUCCESSFULLY!');
                console.log('\n📧 Admin Credentials:');
                console.log('Email:', parsed.admin_user.email);
                console.log('Password:', parsed.admin_user.password);
                console.log('\n🎉 You can now login!');
            } else {
                console.log('\n⚠️ Response:', parsed.message);
            }
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.log('❌ Error:', e.message);
});

req.end();
