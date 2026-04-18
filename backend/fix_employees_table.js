const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    try {
        // Add missing columns to employees table
        const columns = [
            { name: 'assigned_project_id', sql: 'ALTER TABLE employees ADD COLUMN assigned_project_id INT AFTER status' },
            { name: 'category', sql: 'ALTER TABLE employees ADD COLUMN category VARCHAR(50) AFTER designation' },
            { name: 'department', sql: 'ALTER TABLE employees ADD COLUMN department VARCHAR(50) AFTER category' },
            { name: 'created_by', sql: 'ALTER TABLE employees ADD COLUMN created_by INT AFTER updated_at' }
        ];

        for (const col of columns) {
            try {
                await conn.query(col.sql);
                console.log(`✅ Added column: ${col.name}`);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`✓ Column already exists: ${col.name}`);
                } else {
                    console.log(`❌ Error adding ${col.name}:`, error.message);
                }
            }
        }

        console.log('\n✅ All missing employee columns added successfully!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await conn.end();
    }
})();
