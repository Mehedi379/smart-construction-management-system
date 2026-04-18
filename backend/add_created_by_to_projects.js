const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCreatedByColumn() {
    console.log('\n🔧 ADDING created_by COLUMN TO projects TABLE...\n');
    console.log('='.repeat(60));
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        // Check if column already exists
        console.log('📋 Checking if created_by column exists...');
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM projects LIKE 'created_by'
        `);

        if (columns.length > 0) {
            console.log('✅ created_by column already exists!');
            console.table(columns);
        } else {
            console.log('❌ created_by column not found. Adding it now...');
            
            // Add the created_by column
            await connection.query(`
                ALTER TABLE projects 
                ADD COLUMN created_by INT AFTER description,
                ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            `);
            
            console.log('✅ created_by column added successfully!');
        }

        // Verify the column exists
        console.log('\n📋 Updated projects table structure:');
        console.log('-'.repeat(60));
        const [updatedColumns] = await connection.query(`
            DESCRIBE projects
        `);
        console.table(updatedColumns);

        console.log('\n' + '='.repeat(60));
        console.log('✅ DATABASE UPDATE COMPLETED');
        console.log('='.repeat(60));
        console.log('\n✨ You can now create projects successfully!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) await connection.end();
    }
}

addCreatedByColumn();
