const mysql = require('mysql2/promise');

async function fixDatabase() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'construction_db'
        });
        
        console.log('Fixing database...\n');
        
        // Check if user_id column exists
        const [columns] = await conn.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'employees' 
            AND COLUMN_NAME = 'user_id'
        `);
        
        if (columns.length === 0) {
            console.log('Adding user_id column to employees table...');
            await conn.query(`
                ALTER TABLE employees 
                ADD COLUMN user_id INT AFTER id,
                ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                ADD INDEX idx_user_id (user_id)
            `);
            console.log('✓ user_id column added!\n');
        } else {
            console.log('✓ user_id column already exists\n');
        }
        
        // Verify the fix
        const [result] = await conn.query('DESCRIBE employees');
        console.log('Employees table structure:');
        console.table(result);
        
        await conn.end();
        console.log('\n✅ Database fixed successfully!');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    }
}

fixDatabase();
