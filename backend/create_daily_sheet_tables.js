const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDailySheetTables() {
    console.log('\n========================================');
    console.log('📋 Creating Daily Sheet System Tables');
    console.log('========================================\n');

    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });
        
        console.log('✅ Connected to database\n');

        // Create daily_sheets table
        console.log('🔧 Creating daily_sheets table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS daily_sheets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sheet_no VARCHAR(30) UNIQUE NOT NULL,
                project_id INT,
                sheet_date DATE NOT NULL,
                location VARCHAR(200),
                previous_balance DECIMAL(15, 2) DEFAULT 0.00,
                today_expense DECIMAL(15, 2) DEFAULT 0.00,
                remaining_balance DECIMAL(15, 2) DEFAULT 0.00,
                receipt_image VARCHAR(255),
                ocr_text TEXT,
                status ENUM('draft', 'completed', 'approved') DEFAULT 'draft',
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_sheet_no (sheet_no),
                INDEX idx_sheet_date (sheet_date),
                INDEX idx_project (project_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ daily_sheets table created\n');

        // Create daily_sheet_items table
        console.log('🔧 Creating daily_sheet_items table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS daily_sheet_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sheet_id INT NOT NULL,
                item_no INT NOT NULL,
                description TEXT NOT NULL,
                qty DECIMAL(10, 2) DEFAULT 0.00,
                rate DECIMAL(10, 2) DEFAULT 0.00,
                amount DECIMAL(15, 2) NOT NULL,
                source VARCHAR(50),
                source_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
                INDEX idx_sheet (sheet_id),
                INDEX idx_source (source, source_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ daily_sheet_items table created\n');

        // Create daily_sheet_signatures table
        console.log('🔧 Creating daily_sheet_signatures table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS daily_sheet_signatures (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sheet_id INT NOT NULL,
                receiver_signature TEXT,
                receiver_name VARCHAR(100),
                receiver_date DATE,
                payer_signature TEXT,
                payer_name VARCHAR(100),
                payer_date DATE,
                prepared_by_signature TEXT,
                prepared_by_name VARCHAR(100),
                prepared_by_date DATE,
                checked_by_signature TEXT,
                checked_by_name VARCHAR(100),
                checked_by_date DATE,
                approved_by_signature TEXT,
                approved_by_name VARCHAR(100),
                approved_by_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
                UNIQUE KEY unique_sheet (sheet_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ daily_sheet_signatures table created\n');

        // Verify tables
        console.log('🔍 Verifying tables...');
        const [tables] = await connection.query(`
            SHOW TABLES LIKE 'daily_sheet%'
        `);
        
        console.log(`✅ Created ${tables.length} tables:`);
        tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
        });

        console.log('\n========================================');
        console.log('✅ Daily Sheet System Tables Created Successfully!');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ Failed to create tables:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createDailySheetTables();
