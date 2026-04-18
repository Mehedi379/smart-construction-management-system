const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🔧 Running database migration...\n');

    let connection;

    try {
        // Load environment variables
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
        }

        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db',
            multipleStatements: true
        });

        console.log('✅ Connected to database\n');

        // Check if column exists
        const [columns] = await connection.query(`
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'employees'
            AND COLUMN_NAME = 'created_by'
        `, [process.env.DB_NAME || 'construction_db']);

        if (columns[0].count > 0) {
            console.log('✅ employees.created_by column already exists\n');
        } else {
            console.log('➕ Adding employees.created_by column...\n');

            // Add column
            await connection.query(`
                ALTER TABLE employees
                ADD COLUMN created_by INT AFTER updated_at,
                ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                ADD INDEX idx_created_by (created_by)
            `);

            console.log('✅ Column added successfully\n');
        }

        // Verify
        const [verify] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'employees'
            AND COLUMN_NAME = 'created_by'
        `, [process.env.DB_NAME || 'construction_db']);

        if (verify.length > 0) {
            console.log('📊 Verification:');
            console.log(`   Column: ${verify[0].COLUMN_NAME}`);
            console.log(`   Type: ${verify[0].DATA_TYPE}`);
            console.log(`   Nullable: ${verify[0].IS_NULLABLE}\n`);
        }

        console.log('🎉 Migration completed successfully!');
        console.log('✅ employees.created_by column is now available\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
