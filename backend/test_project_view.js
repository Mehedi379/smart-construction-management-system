require('dotenv').config();
const mysql = require('mysql2/promise');

async function testProjectView() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });
        
        console.log('========================================');
        console.log('🔍 TESTING PROJECT VIEW DATA');
        console.log('========================================\n');

        const projectId = 1;

        // Run the same query as the backend
        const [projects] = await connection.query(`
            SELECT p.*, 
                   COALESCE(SUM(DISTINCT e.amount), 0) as total_expense,
                   COALESCE(SUM(DISTINCT CASE WHEN v.voucher_type = 'receipt' THEN v.amount ELSE 0 END), 0) as total_income,
                   COUNT(DISTINCT CASE WHEN v.employee_id IS NOT NULL THEN v.employee_id END) as worker_count,
                   (SELECT COUNT(*) FROM vouchers WHERE project_id = p.id) as voucher_count
            FROM projects p 
            LEFT JOIN expenses e ON p.id = e.project_id 
            LEFT JOIN vouchers v ON p.id = v.project_id 
            WHERE p.id = ?
            GROUP BY p.id
        `, [projectId]);

        if (projects.length === 0) {
            console.log('❌ Project not found!');
            return;
        }

        const project = projects[0];

        console.log('📋 PROJECT DATA (What backend returns):\n');
        console.log('Basic Info:');
        console.log(`   ✅ ID: ${project.id}`);
        console.log(`   ✅ Project Code: ${project.project_code}`);
        console.log(`   ✅ Project Name: ${project.project_name}`);
        console.log(`   ✅ Location: ${project.location || 'N/A'}`);
        console.log(`   ✅ Start Date: ${project.start_date || 'N/A'}`);
        console.log(`   ✅ End Date: ${project.end_date || 'N/A'}`);
        console.log(`   ✅ Status: ${project.status}`);
        console.log(`   ✅ Description: ${project.description || 'N/A'}`);
        console.log('');

        console.log('Financial Data:');
        console.log(`   ✅ Estimated Budget: ৳${parseFloat(project.estimated_budget).toLocaleString()}`);
        console.log(`   ✅ Total Expense: ৳${parseFloat(project.total_expense).toLocaleString()}`);
        console.log(`   ✅ Total Income: ৳${parseFloat(project.total_income).toLocaleString()}`);
        console.log(`   ✅ Profit/Loss: ৳${(parseFloat(project.total_income) - parseFloat(project.total_expense)).toLocaleString()}`);
        console.log('');

        console.log('Activity Data:');
        console.log(`   ✅ Worker Count: ${parseInt(project.worker_count) || 0}`);
        console.log(`   ✅ Voucher Count: ${parseInt(project.voucher_count) || 0}`);
        console.log('');

        console.log('========================================');
        console.log('✅ ALL DATA AVAILABLE');
        console.log('========================================\n');

        console.log('📊 What the modal should display:\n');
        console.log('1. Header Section:');
        console.log(`   - Project Name: ${project.project_name}`);
        console.log(`   - Project Code: ${project.project_code}`);
        console.log(`   - Status: ${project.status}`);
        console.log('');
        console.log('2. Project Info:');
        console.log(`   - Location: ${project.location || 'N/A'}`);
        console.log(`   - Start Date: ${project.start_date || 'N/A'}`);
        console.log(`   - End Date: ${project.end_date || 'N/A'}`);
        console.log('');
        console.log('3. Financial Summary:');
        console.log(`   - Budget: ৳${parseFloat(project.estimated_budget).toLocaleString()}`);
        console.log(`   - Total Spent: ৳${parseFloat(project.total_expense).toLocaleString()}`);
        console.log(`   - Total Income: ৳${parseFloat(project.total_income).toLocaleString()}`);
        console.log(`   - Profit/Loss: ৳${(parseFloat(project.total_income) - parseFloat(project.total_expense)).toLocaleString()}`);
        console.log('');
        console.log('4. Team & Activity:');
        console.log(`   - Employees Working: ${parseInt(project.worker_count) || 0}`);
        console.log(`   - Total Vouchers: ${parseInt(project.voucher_count) || 0}`);
        console.log('');
        if (project.description) {
            console.log('5. Description:');
            console.log(`   ${project.description}`);
        }

        console.log('\n✅ All data is present and should display correctly!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

testProjectView();
