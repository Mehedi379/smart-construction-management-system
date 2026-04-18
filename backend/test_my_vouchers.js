const axios = require('axios');

const API_URL = 'http://localhost:9000/api';

async function testMyVouchers() {
    try {
        console.log('\n' + '='.repeat(70));
        console.log('🧪 TESTING ID-WISE VOUCHER DETECTION');
        console.log('='.repeat(70) + '\n');

        // Test with site_engineer account
        const testUser = {
            email: 'hassanmehedi13344444@gmail.com',
            password: '123456'
        };

        console.log('👤 Testing with user:', testUser.email);
        console.log('🔑 Role: site_engineer\n');

        // Login
        console.log('1️⃣  Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, testUser);
        
        if (!loginRes.data.success) {
            console.log('❌ Login failed:', loginRes.data.message);
            return;
        }

        const token = loginRes.data.data.token;
        const user = loginRes.data.data.user;
        
        console.log('✅ Login successful!');
        console.log('   User ID:', user.id);
        console.log('   Name:', user.name);
        console.log('   Role:', user.role);
        console.log('   Assigned Project ID:', user.assigned_project_id);
        console.log('');

        // Get employee details
        const headers = { Authorization: `Bearer ${token}` };
        console.log('2️⃣  Fetching employee record...');
        
        const employeesRes = await axios.get(`${API_URL}/employees`, { 
            headers,
            params: { user_id: user.id }
        });

        if (employeesRes.data.data && employeesRes.data.data.length > 0) {
            const emp = employeesRes.data.data[0];
            console.log('✅ Employee record found:');
            console.log('   Employee ID:', emp.employee_id);
            console.log('   Assigned Project:', emp.assigned_project_id);
            console.log('');
        }

        // Get dashboard stats
        console.log('3️⃣  Fetching dashboard stats...');
        const statsRes = await axios.get(`${API_URL}/reports/dashboard`, { headers });
        
        if (statsRes.data.success) {
            const stats = statsRes.data.data;
            console.log('✅ Dashboard stats loaded!\n');
            
            console.log('📊 VOUCHER STATISTICS:');
            console.log('   My Vouchers:', stats.my_vouchers || 0);
            console.log('   My Pending:', stats.my_pending || 0);
            console.log('   Today\'s Expenses:', stats.today_expenses || 0);
            console.log('   Total Projects:', stats.total_projects || 0);
            console.log('   Total Employees:', stats.total_employees || 0);
            console.log('');

            if (stats.my_vouchers === 0) {
                console.log('⚠️  No vouchers found for this user');
                console.log('💡 This is normal if no vouchers have been created yet');
                console.log('');
                console.log('📝 To test:');
                console.log('   1. Create a voucher with employee_id = your employee_id');
                console.log('   2. Refresh dashboard');
                console.log('   3. "My Vouchers" should show the count');
            } else {
                console.log('✅ Vouchers detected correctly!');
            }
        } else {
            console.log('❌ Failed to load dashboard stats');
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ TEST COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        console.log('\n💡 Make sure:');
        console.log('   1. Backend is running on port 9000');
        console.log('   2. You have an employee record');
        console.log('   3. Database connection is working\n');
    }
}

testMyVouchers();
