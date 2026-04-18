const pool = require('./src/config/database');

(async () => {
    try {
        console.log('🔧 Creating Purchases Tables...\n');
        
        // Create purchases table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchases (
                id INT AUTO_INCREMENT PRIMARY KEY,
                purchase_no VARCHAR(30) UNIQUE NOT NULL,
                purchase_date DATE NOT NULL,
                supplier_id INT,
                project_id INT,
                category VARCHAR(50) NOT NULL,
                subtotal DECIMAL(15, 2) NOT NULL,
                discount DECIMAL(15, 2) DEFAULT 0.00,
                total_amount DECIMAL(15, 2) NOT NULL,
                paid_amount DECIMAL(15, 2) DEFAULT 0.00,
                due_amount DECIMAL(15, 2) DEFAULT 0.00,
                payment_method ENUM('cash', 'bkash', 'nagad', 'rocket', 'bank', 'cheque') DEFAULT 'cash',
                payment_status ENUM('paid', 'partial', 'due') DEFAULT 'paid',
                slip_image VARCHAR(255),
                notes TEXT,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_purchase_no (purchase_no),
                INDEX idx_purchase_date (purchase_date),
                INDEX idx_category (category),
                INDEX idx_payment_status (payment_status)
            )
        `);
        console.log('✅ Created purchases table');
        
        // Create purchase_items table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                purchase_id INT NOT NULL,
                item_name VARCHAR(200) NOT NULL,
                description TEXT,
                quantity DECIMAL(10, 2) DEFAULT 1.00,
                unit VARCHAR(20),
                unit_price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(15, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_purchase_id (purchase_id)
            )
        `);
        console.log('✅ Created purchase_items table');
        
        // Verify tables exist
        const [tables] = await pool.query(`
            SHOW TABLES LIKE 'purch%'
        `);
        
        console.log('\n📋 Purchases Tables Created:');
        tables.forEach(t => {
            console.log('  ✓', Object.values(t)[0]);
        });
        
        console.log('\n✅ All purchases tables created successfully!\n');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
