async function setupDatabase() {
    console.log('🔧 Setting up database schema...\n');
    
    const mysql = require('mysql2/promise');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'mysql.railway.internal',
        port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway'
    });
    
    console.log('✅ Connected to database\n');
    
    try {
        // Create Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'accountant', 'engineer', 'site_manager', 'site_engineer', 'site_director', 'project_director', 'deputy_director', 'head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office', 'worker', 'employee') DEFAULT 'employee',
                phone VARCHAR(20),
                is_active BOOLEAN DEFAULT FALSE,
                is_approved BOOLEAN DEFAULT FALSE,
                requested_role VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created users table');
        
        // Create Employees Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                employee_id VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                father_name VARCHAR(100),
                mother_name VARCHAR(100),
                phone VARCHAR(20),
                email VARCHAR(100),
                address TEXT,
                nid VARCHAR(20),
                designation VARCHAR(50),
                trade VARCHAR(50),
                daily_wage DECIMAL(10, 2) DEFAULT 0.00,
                monthly_salary DECIMAL(10, 2) DEFAULT 0.00,
                joining_date DATE,
                end_date DATE,
                status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
                advance_amount DECIMAL(10, 2) DEFAULT 0.00,
                due_amount DECIMAL(10, 2) DEFAULT 0.00,
                photo VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_employee_id (employee_id),
                INDEX idx_status (status)
            )
        `);
        console.log('✅ Created employees table');
        
        // Create Projects Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id VARCHAR(20) UNIQUE NOT NULL,
                project_name VARCHAR(200) NOT NULL,
                client_name VARCHAR(150),
                location VARCHAR(255),
                start_date DATE,
                end_date DATE,
                estimated_budget DECIMAL(12, 2) DEFAULT 0.00,
                actual_cost DECIMAL(12, 2) DEFAULT 0.00,
                status ENUM('planning', 'ongoing', 'completed', 'on_hold', 'cancelled') DEFAULT 'planning',
                description TEXT,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_project_id (project_id),
                INDEX idx_status (status)
            )
        `);
        console.log('✅ Created projects table');
        
        // Create Vouchers Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS vouchers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                voucher_no VARCHAR(30) UNIQUE NOT NULL,
                voucher_type ENUM('payment', 'receipt', 'journal', 'contra') NOT NULL,
                project_id INT,
                amount DECIMAL(12, 2) NOT NULL,
                date DATE NOT NULL,
                paid_to VARCHAR(150),
                description TEXT,
                payment_method ENUM('cash', 'bank', 'mobile_banking') DEFAULT 'cash',
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                approved_by INT,
                approved_at TIMESTAMP NULL,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
                FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_voucher_no (voucher_no),
                INDEX idx_status (status),
                INDEX idx_date (date)
            )
        `);
        console.log('✅ Created vouchers table');
        
        // Create Expenses Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                expense_id VARCHAR(30) UNIQUE NOT NULL,
                project_id INT,
                category VARCHAR(100) NOT NULL,
                sub_category VARCHAR(100),
                amount DECIMAL(12, 2) NOT NULL,
                date DATE NOT NULL,
                description TEXT,
                bill_no VARCHAR(50),
                vendor_name VARCHAR(150),
                payment_method ENUM('cash', 'bank', 'mobile_banking', 'credit') DEFAULT 'cash',
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                approved_by INT,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
                FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_expense_id (expense_id),
                INDEX idx_category (category),
                INDEX idx_date (date)
            )
        `);
        console.log('✅ Created expenses table');
        
        // Create Ledger Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ledger (
                id INT AUTO_INCREMENT PRIMARY KEY,
                entry_id VARCHAR(30) UNIQUE NOT NULL,
                account_name VARCHAR(150) NOT NULL,
                account_type ENUM('asset', 'liability', 'equity', 'income', 'expense') NOT NULL,
                debit DECIMAL(12, 2) DEFAULT 0.00,
                credit DECIMAL(12, 2) DEFAULT 0.00,
                balance DECIMAL(12, 2) DEFAULT 0.00,
                date DATE NOT NULL,
                description TEXT,
                reference_no VARCHAR(50),
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_entry_id (entry_id),
                INDEX idx_account_name (account_name),
                INDEX idx_date (date)
            )
        `);
        console.log('✅ Created ledger table');
        
        // Create Purchases Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS purchases (
                id INT AUTO_INCREMENT PRIMARY KEY,
                purchase_id VARCHAR(30) UNIQUE NOT NULL,
                project_id INT,
                supplier_name VARCHAR(150) NOT NULL,
                item_name VARCHAR(200) NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_amount DECIMAL(12, 2) NOT NULL,
                date DATE NOT NULL,
                invoice_no VARCHAR(50),
                payment_status ENUM('paid', 'unpaid', 'partial') DEFAULT 'unpaid',
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                approved_by INT,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
                FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_purchase_id (purchase_id),
                INDEX idx_date (date)
            )
        `);
        console.log('✅ Created purchases table');
        
        // Create Daily Sheets Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS daily_sheets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sheet_id VARCHAR(30) UNIQUE NOT NULL,
                project_id INT,
                date DATE NOT NULL,
                work_description TEXT,
                weather VARCHAR(50),
                total_workers INT DEFAULT 0,
                total_hours DECIMAL(10, 2) DEFAULT 0.00,
                status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
                submitted_by INT,
                approved_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
                FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_sheet_id (sheet_id),
                INDEX idx_date (date)
            )
        `);
        console.log('✅ Created daily_sheets table');
        
        // Create Daily Sheet Workers Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS daily_sheet_workers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sheet_id INT NOT NULL,
                employee_id INT NOT NULL,
                hours_worked DECIMAL(5, 2) DEFAULT 0.00,
                work_type VARCHAR(100),
                FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                INDEX idx_sheet (sheet_id)
            )
        `);
        console.log('✅ Created daily_sheet_workers table');
        
        // Create Workflow Approvals Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS workflow_approvals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INT NOT NULL,
                step_number INT NOT NULL,
                step_name VARCHAR(100) NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                approved_by INT,
                approved_at TIMESTAMP NULL,
                comments TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_entity (entity_type, entity_id),
                INDEX idx_status (status)
            )
        `);
        console.log('✅ Created workflow_approvals table');
        
        // Create Audit Logs Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(100) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INT,
                old_values JSON,
                new_values JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_user (user_id),
                INDEX idx_entity (entity_type, entity_id),
                INDEX idx_created_at (created_at)
            )
        `);
        console.log('✅ Created audit_logs table');
        
        // Create Admin User
        await connection.query(`
            INSERT IGNORE INTO users (name, email, password, role, phone, is_active, is_approved) 
            VALUES ('Admin User', 'admin@khazabilkis.com', '$2a$10$X7Vwqz8qK5zQp6rJ9mYHFO6KjN3qL9vM2bP8wR5tY1cD4eF6gH7iJ', 'admin', '01700000000', true, true)
        `);
        console.log('✅ Created admin user');
        
        // Show all tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('\n📊 Database Tables Created:');
        console.log(tables);
        
        console.log('\n✅ Database setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error setting up database:', error.message);
    } finally {
        await connection.end();
    }
}

module.exports = setupDatabase;

// Run if called directly
if (require.main === module) {
    setupDatabase().catch(console.error);
}
