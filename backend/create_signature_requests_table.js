const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    try {
        // Create signature_requests table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS signature_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sheet_id INT NOT NULL,
                role_code VARCHAR(50) NOT NULL,
                role_name VARCHAR(100),
                status ENUM('requested', 'signed', 'rejected', 'skipped') DEFAULT 'requested',
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                signed_at TIMESTAMP NULL,
                signed_by INT NULL,
                comments TEXT,
                signature_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
                FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_sheet (sheet_id),
                INDEX idx_role (role_code),
                INDEX idx_status (status),
                UNIQUE KEY unique_sheet_role (sheet_id, role_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ signature_requests table created');

        // Verify table was created
        const [tables] = await conn.query('SHOW TABLES LIKE "signature_requests"');
        if (tables.length > 0) {
            console.log('\n✅ signature_requests table created successfully!');
            
            // Show table structure
            const [columns] = await conn.query('DESCRIBE signature_requests');
            console.log('\nTable structure:');
            columns.forEach(col => console.log('  - ' + col.Field + ': ' + col.Type));
        } else {
            console.log('❌ Table creation failed');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await conn.end();
    }
})();
