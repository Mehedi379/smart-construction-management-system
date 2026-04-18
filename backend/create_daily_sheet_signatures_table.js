const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔧 CREATING daily_sheet_signatures TABLE...\n');
        
        // Check if table exists
        const [tables] = await pool.query(
            `SELECT TABLE_NAME 
             FROM INFORMATION_SCHEMA.TABLES 
             WHERE TABLE_SCHEMA = 'construction_db' 
             AND TABLE_NAME = 'daily_sheet_signatures'`
        );
        
        if (tables.length > 0) {
            console.log('✅ Table already exists!\n');
            process.exit(0);
        }
        
        console.log('📋 Creating table...\n');
        
        await pool.query(`
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
                INDEX idx_sheet (sheet_id),
                UNIQUE KEY unique_sheet (sheet_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ Table created successfully!\n');
        
        // Verify
        const [verify] = await pool.query(
            `SELECT COLUMN_NAME, DATA_TYPE 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = 'construction_db' 
             AND TABLE_NAME = 'daily_sheet_signatures'
             ORDER BY ORDINAL_POSITION`
        );
        
        console.log('📋 Table columns:\n');
        verify.forEach(col => {
            console.log(`   ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });
        
        console.log('\n✅ Done!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
