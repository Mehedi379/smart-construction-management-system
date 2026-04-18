// Test Dashboard Data
const axios = require('axios');

const API_URL = 'http://localhost:9000/api';
const ADMIN_EMAIL = 'admin@khazabilkis.com';
const ADMIN_PASSWORD = 'admin123';

async function testDashboard() {
    try {
        console.log('\n=== TESTING DASHBOARD DATA ===\n');

        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Get Dashboard Stats
        console.log('1️⃣  Fetching Dashboard Stats...');
        const statsRes = await axios.get(`${API_URL}/reports/dashboard`, { headers });
        
        console.log('\nStats Response:');
        console.log('Success:', statsRes.data.success);
        console.log('Data:', JSON.stringify(statsRes.data.data, null, 2).substring(0, 500) + '...');
        console.log('\nKey Fields:');
        console.log('- total_projects:', statsRes.data.data?.total_projects);
        console.log('- total_employees:', statsRes.data.data?.total_employees);
        console.log('- all_projects_budget:', statsRes.data.data?.all_projects_budget);
        console.log('- all_projects_expense:', statsRes.data.data?.all_projects_expense);
        console.log('- project_breakdown count:', statsRes.data.data?.project_breakdown?.length);

        // Get Projects
        console.log('\n2️⃣  Fetching Projects...');
        const projectsRes = await axios.get(`${API_URL}/projects`, { headers });
        
        console.log('\nProjects Response:');
        console.log('Success:', projectsRes.data.success);
        console.log('Data type:', typeof projectsRes.data.data);
        console.log('Is array:', Array.isArray(projectsRes.data.data));
        console.log('Projects count:', projectsRes.data.data?.length || 0);
        
        if (Array.isArray(projectsRes.data.data)) {
            console.log('\nProjects:');
            projectsRes.data.data.forEach((proj, idx) => {
                console.log(`  ${idx + 1}. ${proj.project_name} (${proj.project_code})`);
            });
        }

        console.log('\n✅ TEST COMPLETE\n');

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
    }
}

testDashboard();
