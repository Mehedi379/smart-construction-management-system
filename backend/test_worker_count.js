const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    console.log('\n' + '='.repeat(70));
    console.log('🧪 TESTING WORKER COUNT QUERY');
    console.log('='.repeat(70) + '\n');

    const projectId = 1;

    // Test the exact query from projectModel
    const [result] = await conn.query(`
        SELECT p.*, 
               (SELECT COUNT(DISTINCT e.id) FROM employees e WHERE e.assigned_project_id = p.id AND e.status = 'active') as worker_count,
               (SELECT COUNT(*) FROM vouchers WHERE project_id = p.id) as voucher_count,
               (SELECT COUNT(*) FROM daily_sheets WHERE project_id = p.id) as sheet_count
        FROM projects p 
        WHERE p.id = ?
    `, [projectId]);

    console.log('Query Result:\n');
    console.log(`Project ID: ${result[0].id}`);
    console.log(`Project Name: ${result[0].project_name}`);
    console.log(`Worker Count: ${result[0].worker_count}`);
    console.log(`Voucher Count: ${result[0].voucher_count}`);
    console.log(`Sheet Count: ${result[0].sheet_count}`);

    console.log('\n\n🔍 Direct Employee Count Test:\n');

    // Test direct count
    const [countResult] = await conn.query(`
        SELECT COUNT(DISTINCT e.id) as count
        FROM employees e 
        WHERE e.assigned_project_id = ? AND e.status = 'active'
    `, [projectId]);

    console.log(`Direct Count Query Result: ${countResult[0].count}`);

    console.log('\n\n🔍 Employee Status Check:\n');

    const [empStatus] = await conn.query(`
        SELECT id, name, assigned_project_id, status
        FROM employees
        WHERE assigned_project_id = ?
        LIMIT 5
    `, [projectId]);

    empStatus.forEach(emp => {
        console.log(`ID: ${emp.id} | Name: ${emp.name} | Project: ${emp.assigned_project_id} | Status: ${emp.status}`);
    });

    console.log('\n' + '='.repeat(70) + '\n');

    await conn.end();
})();
