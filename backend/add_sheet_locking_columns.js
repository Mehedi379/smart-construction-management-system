const mysql = require('mysql2/promise');
require('dotenv').config();

async function addLockColumns() {
    console.log('\n🔒 Adding sheet locking columns...\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        // Check if columns already exist
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'construction_db'
            AND TABLE_NAME = 'daily_sheets'
            AND COLUMN_NAME IN ('is_locked', 'locked_at')
        `);

        const existingCols = columns.map(c => c.COLUMN_NAME);

        if (!existingCols.includes('is_locked')) {
            console.log('➕ Adding is_locked column...');
            await connection.query(`
                ALTER TABLE daily_sheets
                ADD COLUMN is_locked BOOLEAN DEFAULT FALSE AFTER status
            `);
            console.log('✅ is_locked column added\n');
        } else {
            console.log('✅ is_locked column already exists\n');
        }

        if (!existingCols.includes('locked_at')) {
            console.log('➕ Adding locked_at column...');
            await connection.query(`
                ALTER TABLE daily_sheets
                ADD COLUMN locked_at TIMESTAMP NULL AFTER is_locked
            `);
            console.log('✅ locked_at column added\n');
        } else {
            console.log('✅ locked_at column already exists\n');
        }

        console.log('========================================');
        console.log('✅ SHEET LOCKING COLUMNS ADDED');
        console.log('========================================\n');

        console.log('📋 How it works:');
        console.log('   1. User adds signatures to sheet');
        console.log('   2. When all 5 signatures are complete');
        console.log('   3. Sheet auto-locks (is_locked = TRUE)');
        console.log('   4. Status changes to "approved"');
        console.log('   5. locked_at timestamp is recorded');
        console.log('   6. Sheet CANNOT be edited anymore!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

addLockColumns();
