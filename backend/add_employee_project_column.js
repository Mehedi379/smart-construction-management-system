const pool = require('./src/config/database');

async function addEmployeeColumns() {
    try {
        console.log('Adding missing columns to employees table...\n');

        // Check and add assigned_project_id column
        try {
            await pool.query(`
                ALTER TABLE employees 
                ADD COLUMN assigned_project_id INT NULL AFTER joining_date,
                ADD FOREIGN KEY (assigned_project_id) REFERENCES projects(id) ON DELETE SET NULL,
                ADD INDEX idx_assigned_project (assigned_project_id)
            `);
            console.log('✅ Added assigned_project_id column');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  assigned_project_id column already exists');
            } else {
                throw error;
            }
        }

        // Check and add category column
        try {
            await pool.query(`
                ALTER TABLE employees 
                ADD COLUMN category VARCHAR(50) NULL AFTER designation
            `);
            console.log('✅ Added category column');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  category column already exists');
            } else {
                throw error;
            }
        }

        // Check and add department column
        try {
            await pool.query(`
                ALTER TABLE employees 
                ADD COLUMN department VARCHAR(50) NULL AFTER category
            `);
            console.log('✅ Added department column');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  department column already exists');
            } else {
                throw error;
            }
        }

        // Check and add work_role column
        try {
            await pool.query(`
                ALTER TABLE employees 
                ADD COLUMN work_role VARCHAR(50) NULL AFTER department
            `);
            console.log('✅ Added work_role column');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  work_role column already exists');
            } else {
                throw error;
            }
        }

        console.log('\n✅ All columns added successfully!');
        
        // Verify columns
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'employees'
            AND COLUMN_NAME IN ('assigned_project_id', 'category', 'department', 'work_role')
            ORDER BY ORDINAL_POSITION
        `);

        console.log('\n📊 Added columns:');
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addEmployeeColumns();
