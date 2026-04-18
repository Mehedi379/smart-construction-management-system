const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    try {
        // Add missing columns one by one
        const columns = [
            { name: 'last_login', sql: 'ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL AFTER updated_at' },
            { name: 'approved_by', sql: 'ALTER TABLE users ADD COLUMN approved_by INT AFTER is_approved' },
            { name: 'approved_at', sql: 'ALTER TABLE users ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by' },
            { name: 'status', sql: 'ALTER TABLE users ADD COLUMN status ENUM("active", "inactive", "rejected", "suspended") DEFAULT "inactive" AFTER role' }
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

        console.log('\n✅ All missing columns added successfully!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await conn.end();
    }
})();
