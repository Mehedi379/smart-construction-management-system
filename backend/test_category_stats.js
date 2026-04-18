const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    console.log('\n' + '='.repeat(70));
    console.log('📊 TESTING CATEGORY STATS API QUERY');
    console.log('='.repeat(70) + '\n');

    const projectId = 1;

    // Test the query from projectController
    const [categories] = await conn.query(`
        SELECT category, COUNT(*) as count
        FROM employees
        WHERE assigned_project_id = ? AND status = 'active'
        GROUP BY category
    `, [projectId]);

    console.log('Query Result:\n');
    
    const categoryStats = {};
    categories.forEach(row => {
        categoryStats[row.category] = row.count;
        categoryStats[row.category.toLowerCase()] = row.count;
        console.log(`${row.category}: ${row.count}`);
    });

    console.log('\n\nCategory Stats Object:');
    console.log(JSON.stringify(categoryStats, null, 2));

    console.log('\n' + '='.repeat(70) + '\n');

    await conn.end();
})();
