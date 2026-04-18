const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:9000/api';

async function testSheetCreation() {
    try {
        console.log('\n' + '='.repeat(70));
        console.log('🧪 TESTING DAILY SHEET CREATION');
        console.log('='.repeat(70) + '\n');

        // Step 1: Login as admin
        console.log('📝 Step 1: Logging in as admin...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'admin123'
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed');
            return;
        }

        const token = loginResponse.data.data.token;
        console.log('✅ Login successful\n');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // Step 2: Test sheet creation with proper data
        console.log('📝 Step 2: Creating daily sheet...');
        
        const sheetData = {
            project_id: 1,
            sheet_date: '2026-04-16',
            location: 'Dhaka Office',
            previous_balance: 50000,
            items: [
                {
                    description: 'Cement purchase',
                    qty: 10,
                    rate: 500,
                    amount: 5000
                },
                {
                    description: 'Worker payment',
                    qty: 5,
                    rate: 1000,
                    amount: 5000
                }
            ],
            ocr_text: null
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
            }
        } catch (error) {
            console.error('❌ Sheet creation failed:', error.response?.data?.message || error.message);
            console.error('   Error details:', error.response?.data);
            console.error('   Full error:', error.response?.data?.error);
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ SHEET CREATION TESTING COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.response?.data || error.message);
        console.error('\n💡 Make sure:');
        console.error('   1. Backend server is running on port 9000');
        console.error('   2. Admin user exists in database');
        console.error('   3. Database connection is working\n');
    }
}

testSheetCreation();
