const pool = require('./src/config/database');
const bcrypt = require('bcryptjs');

(async () => {
    try {
        console.log('\n🔍 Checking employee category column...\n');
        
        const [columns] = await pool.query('SHOW COLUMNS FROM employees');
        const categoryColumn = columns.find(c => c.Field === 'category');
        
        console.log('Category column details:');
        console.log(JSON.stringify(categoryColumn, null, 2));
        
        // Get admin and project info
        const [adminResult] = await pool.query('SELECT id FROM users WHERE email = "admin@test.com"');
        const adminId = adminResult[0].id;
        
        const [projectResult] = await pool.query('SELECT id FROM projects LIMIT 1');
        const projectId = projectResult[0].id;
        
        console.log(`\n📋 Admin ID: ${adminId}`);
        console.log(`📋 Project ID: ${projectId}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
