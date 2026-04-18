const pool = require('./src/config/database');

async function checkSignatureRequests() {
    try {
        const [tables] = await pool.query('SHOW TABLES LIKE "signature_requests"');
        
        if (tables.length === 0) {
            console.log('❌ signature_requests table does not exist');
            console.log('\n✅ Creating signature_requests table...\n');
            
            await pool.query(`
                CREATE TABLE signature_requests (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sheet_id INT NOT NULL,
                    role_code VARCHAR(50) NOT NULL,
                    role_name VARCHAR(100) NOT NULL,
                    requested_by INT NOT NULL,
                    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status ENUM('not_requested', 'requested', 'signed', 'rejected') DEFAULT 'not_requested',
                    signed_by INT NULL,
                    signed_at TIMESTAMP NULL,
                    signature_data TEXT,
                    comments TEXT,
                    FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
                    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE RESTRICT,
                    FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE RESTRICT,
                    UNIQUE KEY unique_sheet_role (sheet_id, role_code),
                    INDEX idx_sheet_id (sheet_id),
                    INDEX idx_role_code (role_code),
                    INDEX idx_status (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            `);
            
            console.log('✅ Created signature_requests table');
        } else {
            console.log('✅ signature_requests table already exists');
        }

        console.log('\n✨ Done!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSignatureRequests();
