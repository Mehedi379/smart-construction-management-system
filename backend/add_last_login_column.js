const mysql = require('mysql2/promise');

(async () => {
    console.log('🔧 Adding missing columns to users table...\n');

    let connection;

    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'construction_db'
        });

        // Get existing columns
        const [columns] = await connection.query(
            'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
            ['construction_db', 'users']
        );

        const colNames = columns.map(c => c.COLUMN_NAME);

        // Add last_login column
        if (!colNames.includes('last_login')) {
            console.log('➕ Adding last_login column...');
            await connection.query(`
                ALTER TABLE users
                ADD COLUMN last_login DATETIME NULL
                AFTER status
            `);
            console.log('✅ last_login column added\n');
        } else {
            console.log('✅ last_login column already exists\n');
        }

        console.log('✅ All required columns present!\n');

        // Verify
        const [verify] = await connection.query(
            'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
            ['construction_db', 'users']
        );

        console.log('📋 Current users table columns:');
        verify.forEach(c => console.log(`  - ${c.COLUMN_NAME}`));

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
})();
