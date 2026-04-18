const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    try {
        // Create daily_sheets table
        await conn.query(`
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
        console.log('✅ daily_sheets table created');

        // Create daily_sheet_items table
        await conn.query(`
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
        console.log('✅ daily_sheet_items table created');

        // Create daily_sheet_signatures table
        await conn.query(`
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
        console.log('✅ daily_sheet_signatures table created');

        // Verify tables were created
        const [tables] = await conn.query('SHOW TABLES LIKE "daily_sheet%"');
        console.log('\n✅ All daily sheet tables created successfully!');
        console.log('\nCreated tables:');
        tables.forEach(t => console.log('  - ' + Object.values(t)[0]));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await conn.end();
    }
})();
