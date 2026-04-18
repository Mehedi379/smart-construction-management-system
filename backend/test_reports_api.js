const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:9000/api';

async function testReportsAPI() {
    try {
        console.log('\n' + '='.repeat(70));
        console.log('🧪 TESTING REPORTS API');
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

        // Step 2: Test Profit/Loss Report
        console.log('📊 Step 2: Testing Profit/Loss Report...');
        try {
            const profitLossResponse = await axios.get(
                `${API_URL}/reports/profit-loss`,
                {
                    ...config,
                    params: {
                        from_date: '2026-04-01',
                        to_date: '2026-04-16'
                    }
                }
            );

            if (profitLossResponse.data.success) {
                console.log('✅ Profit/Loss Report loaded successfully');
                console.log('   📈 Total Income: ৳' + profitLossResponse.data.data.total_income.toLocaleString());
                console.log('   📉 Total Expenses: ৳' + profitLossResponse.data.data.total_expense.toLocaleString());
                console.log('   💰 Profit/Loss: ৳' + profitLossResponse.data.data.profit_loss.toLocaleString());
                console.log('   📊 Status: ' + (profitLossResponse.data.data.is_profit ? 'PROFIT' : 'LOSS'));
            } else {
                console.log('⚠️  Profit/Loss Report returned error');
            }
        } catch (error) {
            console.error('❌ Profit/Loss Report failed:', error.response?.data?.message || error.message);
        }

        // Step 3: Test Dashboard Stats
        console.log('\n📊 Step 3: Testing Dashboard Stats...');
        try {
            const dashboardResponse = await axios.get(
                `${API_URL}/reports/dashboard`,
                config
            );

            if (dashboardResponse.data.success) {
                console.log('✅ Dashboard Stats loaded successfully');
                const stats = dashboardResponse.data.data;
                console.log('   💰 Monthly Income: ৳' + stats.monthly_income.toLocaleString());
                console.log('   💸 Monthly Expenses: ৳' + stats.monthly_expenses.toLocaleString());
                console.log('   📊 Monthly Profit: ৳' + stats.monthly_profit.toLocaleString());
                console.log('   🏗️  Total Projects: ' + stats.total_projects);
                console.log('   👥 Total Employees: ' + stats.total_employees);
                console.log('   ⏳ Pending Vouchers: ' + stats.pending_vouchers);
            } else {
                console.log('⚠️  Dashboard Stats returned error');
            }
        } catch (error) {
            console.error('❌ Dashboard Stats failed:', error.response?.data?.message || error.message);
        }

        // Step 4: Test Daily Report
        console.log('\n📊 Step 4: Testing Daily Report...');
        try {
            const dailyResponse = await axios.get(
                `${API_URL}/reports/daily`,
                {
                    ...config,
                    params: { date: '2026-04-15' }
                }
            );

            if (dailyResponse.data.success) {
                console.log('✅ Daily Report loaded successfully');
            } else {
                console.log('⚠️  Daily Report returned error');
            }
        } catch (error) {
            console.error('❌ Daily Report failed:', error.response?.data?.message || error.message);
        }

        // Step 5: Test Monthly Report
        console.log('\n📊 Step 5: Testing Monthly Report...');
        try {
            const monthlyResponse = await axios.get(
                `${API_URL}/reports/monthly`,
                {
                    ...config,
                    params: { year: 2026, month: 4 }
                }
            );

            if (monthlyResponse.data.success) {
                console.log('✅ Monthly Report loaded successfully');
            } else {
                console.log('⚠️  Monthly Report returned error');
            }
        } catch (error) {
            console.error('❌ Monthly Report failed:', error.response?.data?.message || error.message);
        }

        // Step 6: Test Excel Export
        console.log('\n📊 Step 6: Testing Excel Export (Expenses)...');
        try {
            const excelResponse = await axios.get(
                `${API_URL}/reports/export/excel`,
                {
                    ...config,
                    params: {
                        type: 'expenses',
                        from_date: '2026-04-01',
                        to_date: '2026-04-16'
                    },
                    responseType: 'arraybuffer'
                }
            );

            if (excelResponse.status === 200) {
                console.log('✅ Excel Export successful');
                console.log('   📄 File size: ' + (excelResponse.data.byteLength / 1024).toFixed(2) + ' KB');
            } else {
                console.log('⚠️  Excel Export returned error');
            }
        } catch (error) {
            console.error('❌ Excel Export failed:', error.response?.data?.message || error.message);
        }

        // Step 7: Test PDF Export
        console.log('\n📊 Step 7: Testing PDF Export (Expenses)...');
        try {
            const pdfResponse = await axios.get(
                `${API_URL}/reports/export/pdf`,
                {
                    ...config,
                    params: {
                        type: 'expenses',
                        from_date: '2026-04-01',
                        to_date: '2026-04-16'
                    },
                    responseType: 'arraybuffer'
                }
            );

            if (pdfResponse.status === 200) {
                console.log('✅ PDF Export successful');
                console.log('   📄 File size: ' + (pdfResponse.data.byteLength / 1024).toFixed(2) + ' KB');
            } else {
                console.log('⚠️  PDF Export returned error');
            }
        } catch (error) {
            console.error('❌ PDF Export failed:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ REPORTS API TESTING COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.response?.data || error.message);
        console.error('\n💡 Make sure:');
        console.error('   1. Backend server is running on port 9000');
        console.error('   2. Admin user exists in database');
        console.error('   3. Database connection is working\n');
    }
}

testReportsAPI();
