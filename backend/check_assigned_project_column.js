const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumn() {
    console.log('\n🔍 Checking employees.assigned_project_id column...\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        const [columns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'construction_db'
            AND TABLE_NAME = 'employees'
            AND COLUMN_NAME = 'assigned_project_id'
        `);

        if (columns.length > 0) {
            console.log('✅ assigned_project_id column EXISTS\n');
            console.log('Details:');
            console.log(`  - Type: ${columns[0].DATA_TYPE}`);
            console.log(`  - Nullable: ${columns[0].IS_NULLABLE}\n`);
        } else {
            console.log('❌ assigned_project_id column MISSING\n');
            console.log('Adding column...\n');
            
            await connection.query(`
                ALTER TABLE employees
                ADD COLUMN assigned_project_id INT NULL AFTER joining_date,
                ADD FOREIGN KEY (assigned_project_id) REFERENCES projects(id) ON DELETE SET NULL,
                ADD INDEX idx_assigned_project (assigned_project_id)
            `);
            
            console.log('✅ Column added successfully!\n');
        }

        // Check employee_projects table
        const [epExists] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'employee_projects'
        `);

        if (epExists[0].count > 0) {
            console.log('ℹ️  employee_projects table also EXISTS (good for many-to-many)\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkColumn();
