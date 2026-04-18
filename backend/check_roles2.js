const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    console.log('\n' + '='.repeat(70));
    console.log('📊 ROLES TABLE STRUCTURE');
    console.log('='.repeat(70) + '\n');

    // Get table structure
    const [columns] = await conn.query('DESCRIBE roles');
    console.log('Table Columns:');
    columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Get all roles
    const [roles] = await conn.query('SELECT * FROM roles');
    
    console.log('\n\nAll Roles:\n');
    roles.forEach(role => {
        console.log(JSON.stringify(role));
    });

    console.log('\n' + '='.repeat(70) + '\n');

    await conn.end();
})();
