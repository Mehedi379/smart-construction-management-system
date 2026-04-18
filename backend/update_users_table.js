const mysql = require('mysql2/promise');

async function updateUsers() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'construction_db'
        });
        
        console.log('Updating users table...\n');
        
        // Check if is_approved column exists
        const [columns] = await conn.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'is_approved'
        `);
        
        if (columns.length === 0) {
            console.log('Adding is_approved column...');
            await conn.query(`
                ALTER TABLE users 
                ADD COLUMN is_approved BOOLEAN DEFAULT FALSE AFTER is_active,
                ADD COLUMN requested_role VARCHAR(50) AFTER is_approved
            `);
            console.log('✓ Columns added!\n');
        } else {
            console.log('✓ Columns already exist\n');
        }
        
        // Update existing active users to be approved
        console.log('Updating existing users...');
        const [result] = await conn.query(`
            UPDATE users 
            SET is_approved = TRUE, is_active = TRUE 
            WHERE is_approved = FALSE
        `);
        console.log(`✓ Updated ${result.affectedRows} users\n`);
        
        // Show all users
        const [users] = await conn.query('SELECT id, name, email, role, is_active, is_approved FROM users');
        console.log('Current users:');
        console.table(users);
        
        await conn.end();
        console.log('\n✅ Users table updated successfully!');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    }
}

updateUsers();
