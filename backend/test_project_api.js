const axios = require('axios');

(async () => {
    try {
        console.log('\n' + '='.repeat(70));
        console.log('🧪 TESTING PROJECT API RESPONSE');
        console.log('='.repeat(70) + '\n');

        // Login as admin
        const loginRes = await axios.post('http://localhost:9000/api/auth/login', {
            email: 'admin@test.com',
            password: '123456'
        });

        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        console.log('✅ Logged in successfully\n');

        // Get Project 1 details
        console.log('📡 Fetching Project 1 details...\n');
        const projectRes = await axios.get('http://localhost:9000/api/projects/1', { headers });

        if (projectRes.data.success) {
            const project = projectRes.data.data;
            
            console.log('Project Details from API:\n');
            console.log(`ID: ${project.id}`);
            console.log(`Name: ${project.project_name}`);
            console.log(`Code: ${project.project_code}`);
            console.log(`\nFinancial Data:`);
            console.log(`  Budget: ${project.estimated_budget}`);
            console.log(`  Total Expense: ${project.total_expense}`);
            console.log(`  Sheet Cost (Approved): ${project.total_sheet_cost}`);
            console.log(`  Sheet Cost (All): ${project.total_sheet_cost_all}`);
            console.log(`  Voucher Cost (Approved): ${project.total_voucher_cost}`);
            console.log(`  Voucher Cost (All): ${project.total_voucher_cost_all}`);
            console.log(`  Remaining Balance: ${project.remaining_balance}`);
            console.log(`  Profit/Loss: ${project.profit_loss}`);
            console.log(`\nCounts:`);
            console.log(`  Worker Count: ${project.worker_count}`);  // This is the key!
            console.log(`  Voucher Count: ${project.voucher_count}`);
            console.log(`  Sheet Count: ${project.sheet_count}`);

            console.log('\n' + '='.repeat(70));
            
            if (project.worker_count === 0 || project.worker_count === '0') {
                console.log('❌ PROBLEM: worker_count is 0 in API response!');
            } else {
                console.log(`✅ SUCCESS: worker_count is ${project.worker_count} in API response`);
            }
            
            console.log('='.repeat(70) + '\n');
        } else {
            console.log('❌ API returned error:', projectRes.data.message);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
    }
})();
