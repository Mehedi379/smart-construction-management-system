const axios = require('axios');
const bcrypt = require('bcryptjs');

async function createAdminViaAPI() {
    console.log('========================================');
    console.log('Creating Admin User via API');
    console.log('========================================\n');

    const backendURL = 'https://smart-construction-backend-production.up.railway.app';
    
    const adminData = {
        name: 'Admin User',
        email: 'admin@khazabilkis.com',
        password: 'admin123',
        role: 'admin',
        phone: '01700000000'
    };

    try {
        console.log('Attempting to register admin user...');
        console.log(`URL: ${backendURL}/api/auth/register\n`);

        const response = await axios.post(`${backendURL}/api/auth/register`, adminData);

        if (response.data.success) {
            console.log('✅ SUCCESS! Admin user created!\n');
            console.log('========================================');
            console.log('ADMIN CREDENTIALS');
            console.log('========================================');
            console.log('Email:', adminData.email);
            console.log('Password:', adminData.password);
            console.log('========================================\n');
            console.log('Note: Since you are the first admin, you may need to:');
            console.log('1. Login with these credentials');
            console.log('2. Or ask another admin to approve your account\n');
        } else {
            console.log('⚠️  Response:', response.data.message);
            console.log('\nIf it says "email already exists", that\'s good!');
            console.log('The admin user already exists in the database.\n');
        }

    } catch (error) {
        if (error.response) {
            const msg = error.response.data?.message || error.response.data?.error || '';
            
            if (msg.includes('already exists') || msg.includes('duplicate')) {
                console.log('✅ Admin user already exists in database!\n');
                console.log('========================================');
                console.log('ADMIN CREDENTIALS');
                console.log('========================================');
                console.log('Email:', adminData.email);
                console.log('Password:', adminData.password);
                console.log('========================================\n');
                console.log('You can now login with these credentials!\n');
            } else if (msg.includes('approval') || msg.includes('approve')) {
                console.log('⚠️  User created but needs admin approval\n');
                console.log('This is expected for the first user.');
                console.log('You need to manually approve it in the database.\n');
                console.log('Alternative: Use Railway Shell to run setup_admin.js directly\n');
            } else {
                console.log('❌ Error:', error.response.data);
                console.log('\nTrying alternative approach...');
                console.log('Please use Railway Shell to create admin user:\n');
                console.log('1. Go to Railway dashboard');
                console.log('2. Click on your service');
                console.log('3. Click "Shell" tab');
                console.log('4. Run: npm install');
                console.log('5. Run: node setup_admin.js\n');
            }
        } else {
            console.log('❌ Network error:', error.message);
            console.log('\nPlease try this alternative:\n');
            console.log('1. Go to Railway dashboard');
            console.log('2. Click on your service');
            console.log('3. Click "Shell" tab');
            console.log('4. Run: npm install');
            console.log('5. Run: node setup_admin.js\n');
        }
    }
}

createAdminViaAPI();
