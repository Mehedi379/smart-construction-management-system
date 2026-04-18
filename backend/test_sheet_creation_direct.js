const axios = require('axios');

const API_URL = 'http://localhost:9000/api';

async function testSheetCreation() {
    try {
        console.log('\n🧪 TESTING SHEET CREATION...\n');
        
        // Step 1: Login as Deputy Head Office
        console.log('📋 Step 1: Logging in as Deputy Head Office...\n');
        
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'deputy.ho@test.com',
            password: '123456'
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            process.exit(1);
        }
        
        const token = loginResponse.data.data.token;
        const user = loginResponse.data.data.user;
        
        console.log(`✅ Login successful`);
        console.log(`   User: ${user.name}`);
        console.log(`   Role: ${user.role}\n`);
        
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };
        
        // Step 2: Get available projects
        console.log('📋 Step 2: Getting available projects...\n');
        
        const projectsResponse = await axios.get(`${API_URL}/projects`, config);
        const projects = projectsResponse.data.data;
        
        console.log(`Found ${projects.length} project(s):\n`);
        projects.forEach(p => {
            console.log(`   ID: ${p.id} - ${p.project_name}`);
        });
        console.log('');
        
        if (projects.length === 0) {
            console.log('❌ No projects available! Cannot create sheet without a project.\n');
            process.exit(1);
        }
        
        // Step 3: Try to create sheet
        console.log('📋 Step 3: Creating sheet...\n');
        
        const sheetData = {
            project_id: projects[0].id,
            sheet_date: new Date().toISOString().split('T')[0],
            location: 'Test Location',
            previous_balance: 100000,
            items: [
                {
                    description: 'Test Item 1',
                    qty: 1,
                    rate: 5000,
                    amount: 5000
                },
                {
                    description: 'Test Item 2',
                    qty: 2,
                    rate: 3000,
                    amount: 6000
                }
            ],
            ocr_text: null,
            signatures: {
                receiver: { name: 'Test Receiver', signature: null, date: new Date().toISOString().split('T')[0] },
                payer: { name: 'Test Payer', signature: null, date: new Date().toISOString().split('T')[0] },
                prepared_by: { name: user.name, signature: null, date: new Date().toISOString().split('T')[0] },
                checked_by: { name: '', signature: null, date: '' },
                approved_by: { name: '', signature: null, date: '' }
            }
        };
        
        console.log('Sheet Data:');
        console.log('  Project ID:', sheetData.project_id);
        console.log('  Date:', sheetData.sheet_date);
        console.log('  Previous Balance:', sheetData.previous_balance);
        console.log('  Items:', sheetData.items.length);
        console.log('  Total Expense:', sheetData.items.reduce((sum, item) => sum + item.amount, 0));
        console.log('');
        
        try {
            const createResponse = await axios.post(
                `${API_URL}/sheets`,
                sheetData,
                config
            );
            
            if (createResponse.data.success) {
                console.log('✅ Sheet created successfully!');
                console.log('   Sheet ID:', createResponse.data.data.id);
                console.log('   Sheet No:', createResponse.data.data.sheet_no);
                console.log('   Today Expense:', createResponse.data.data.today_expense);
                console.log('   Remaining Balance:', createResponse.data.data.remaining_balance);
                console.log('   Status:', createResponse.data.data.status);
            }
        } catch (error) {
            console.log('❌ Sheet creation FAILED!');
            console.log('\n📋 Error Details:\n');
            console.log('Status:', error.response?.status);
            console.log('Message:', error.response?.data?.message);
            console.log('Error:', error.response?.data?.error);
            console.log('\nFull Response:', JSON.stringify(error.response?.data, null, 2));
        }
        
        console.log('\n✅ Test complete!\n');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        process.exit(1);
    }
}

testSheetCreation();
