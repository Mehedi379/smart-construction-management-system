// Add missing columns to users table
const mysql = require('mysql2/promise');

async function addMissingColumns() {
    console.log('🔧 Adding missing columns to users table...\n');

    const config = {
        host: process.env.DB_HOST || 'mysql.railway.internal',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'railway'
    };

    let connection;

    try {
        connection = await mysql.createConnection(config);
        console.log('✅ Connected to database\n');

        // Check and add missing columns one by one
        const columnsToAdd = [
            {
                name: 'last_login',
                sql: 'ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL AFTER updated_at'
            },
            {
                name: 'status',
                sql: "ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'inactive' AFTER is_approved"
            },
            {
                name: 'approved_by',
                sql: 'ALTER TABLE users ADD COLUMN approved_by INT NULL AFTER status'
            },
            {
                name: 'approved_at',
                sql: 'ALTER TABLE users ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by'
            }
        ];

        for (const column of columnsToAdd) {
            try {
                // Check if column exists
                const [columns] = await connection.query(
                    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
                    [config.database, 'users', column.name]
                );

                if (columns.length === 0) {
                    // Column doesn't exist, add it
                    await connection.query(column.sql);
                    console.log(`✅ Added column: ${column.name}`);
                } else {
                    console.log(`✓ Column already exists: ${column.name}`);
                }
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`✓ Column already exists: ${column.name}`);
                } else {
                    console.error(`❌ Error adding ${column.name}:`, error.message);
                }
            }
        }

        // Verify the table structure
        const [columns] = await connection.query(
            'SHOW COLUMNS FROM users'
        );

        console.log('\n📊 Users table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

        console.log('\n✅ Database schema updated successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addMissingColumns();
