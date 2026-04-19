const mysql = require('mysql2/promise');

/**
 * Auto-migration script to fix Railway database schema
 * This ensures the database matches the backend code requirements
 */
async function fixRailwaySchema() {
    let connection;
    
    try {
        console.log('\n🔧 Checking database schema compatibility...');
        
        // Create connection pool
        const pool = require('../config/database');
        connection = await pool.getConnection();
        
        // Check and fix expenses table
        console.log('\n📋 Checking expenses table...');
        const [expenseColumns] = await connection.query(
            "SHOW COLUMNS FROM expenses LIKE 'expense_date'"
        );
        
        if (expenseColumns.length === 0) {
            console.log('⚠️  Adding expense_date column to expenses table...');
            
            // Add expense_date column
            await connection.query(
                "ALTER TABLE expenses ADD COLUMN expense_date DATE AFTER id"
            );
            
            // Copy data from date to expense_date
            await connection.query(
                "UPDATE expenses SET expense_date = date WHERE expense_date IS NULL AND date IS NOT NULL"
            );
            
            // Make it NOT NULL
            await connection.query(
                "ALTER TABLE expenses MODIFY COLUMN expense_date DATE NOT NULL"
            );
            
            // Add index
            try {
                await connection.query(
                    "ALTER TABLE expenses ADD INDEX idx_expense_date (expense_date)"
                );
            } catch (err) {
                // Index might already exist, ignore
            }
            
            console.log('✅ expense_date column added successfully');
        } else {
            console.log('✅ expense_date column already exists');
        }
        
        // Check and fix vouchers table
        console.log('\n📋 Checking vouchers table...');
        const [voucherColumns] = await connection.query(
            "SHOW COLUMNS FROM vouchers"
        );
        
        const columnNames = voucherColumns.map(col => col.Field);
        const missingColumns = [];
        
        // Check for missing columns
        if (!columnNames.includes('employee_id')) missingColumns.push('employee_id INT AFTER project_id');
        if (!columnNames.includes('client_id')) missingColumns.push('client_id INT AFTER employee_id');
        if (!columnNames.includes('supplier_id')) missingColumns.push('supplier_id INT AFTER client_id');
        if (!columnNames.includes('category')) missingColumns.push('category VARCHAR(100) AFTER supplier_id');
        if (!columnNames.includes('reference_no')) missingColumns.push('reference_no VARCHAR(50) AFTER description');
        if (!columnNames.includes('attachment')) missingColumns.push('attachment VARCHAR(255) AFTER reference_no');
        if (!columnNames.includes('paid_by')) missingColumns.push('paid_by VARCHAR(150) AFTER paid_to');
        if (!columnNames.includes('rejection_reason')) missingColumns.push('rejection_reason TEXT AFTER status');
        if (!columnNames.includes('rejected_by')) missingColumns.push('rejected_by INT AFTER rejection_reason');
        if (!columnNames.includes('rejected_at')) missingColumns.push('rejected_at TIMESTAMP NULL AFTER rejected_by');
        
        if (missingColumns.length > 0) {
            console.log(`⚠️  Adding ${missingColumns.length} missing column(s) to vouchers table...`);
            
            for (const columnDef of missingColumns) {
                const columnName = columnDef.split(' ')[0];
                console.log(`   - Adding ${columnName}...`);
                await connection.query(
                    `ALTER TABLE vouchers ADD COLUMN ${columnDef}`
                );
            }
            
            console.log('✅ Missing columns added successfully');
        } else {
            console.log('✅ All required columns exist in vouchers table');
        }
        
        // Check if clients table exists
        console.log('\n📋 Checking clients table...');
        const [tables] = await connection.query("SHOW TABLES LIKE 'clients'");
        
        if (tables.length === 0) {
            console.log('⚠️  Creating clients table...');
            await connection.query(`
                CREATE TABLE clients (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    client_code VARCHAR(20) UNIQUE NOT NULL,
                    name VARCHAR(150) NOT NULL,
                    contact_person VARCHAR(100),
                    phone VARCHAR(20),
                    email VARCHAR(100),
                    address TEXT,
                    total_receivable DECIMAL(15, 2) DEFAULT 0.00,
                    total_paid DECIMAL(15, 2) DEFAULT 0.00,
                    balance DECIMAL(15, 2) DEFAULT 0.00,
                    status ENUM('active', 'inactive') DEFAULT 'active',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_client_code (client_code)
                )
            `);
            console.log('✅ clients table created');
        } else {
            console.log('✅ clients table already exists');
        }
        
        // Check if ledger_accounts table exists
        console.log('\n📋 Checking ledger_accounts table...');
        const [ledgerTables] = await connection.query("SHOW TABLES LIKE 'ledger_accounts'");
        
        if (ledgerTables.length === 0) {
            console.log('⚠️  Creating ledger_accounts table...');
            await connection.query(`
                CREATE TABLE ledger_accounts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    account_code VARCHAR(20) UNIQUE NOT NULL,
                    account_name VARCHAR(150) NOT NULL,
                    account_type ENUM('employee', 'client', 'supplier', 'project', 'bank', 'cash', 'expense', 'income') NOT NULL,
                    reference_id INT,
                    opening_balance DECIMAL(15, 2) DEFAULT 0.00,
                    current_balance DECIMAL(15, 2) DEFAULT 0.00,
                    status ENUM('active', 'inactive') DEFAULT 'active',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_account_code (account_code),
                    INDEX idx_account_type (account_type)
                )
            `);
            console.log('✅ ledger_accounts table created');
        } else {
            console.log('✅ ledger_accounts table already exists');
        }
        
        // Check if ledger_entries table exists
        console.log('\n📋 Checking ledger_entries table...');
        const [entryTables] = await connection.query("SHOW TABLES LIKE 'ledger_entries'");
        
        if (entryTables.length === 0) {
            console.log('⚠️  Creating ledger_entries table...');
            await connection.query(`
                CREATE TABLE ledger_entries (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    account_id INT NOT NULL,
                    entry_date DATE NOT NULL,
                    voucher_id INT,
                    expense_id INT,
                    description TEXT,
                    debit_amount DECIMAL(15, 2) DEFAULT 0.00,
                    credit_amount DECIMAL(15, 2) DEFAULT 0.00,
                    balance DECIMAL(15, 2) DEFAULT 0.00,
                    entry_type ENUM('debit', 'credit') NOT NULL,
                    reference_no VARCHAR(50),
                    created_by INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (account_id) REFERENCES ledger_accounts(id) ON DELETE CASCADE,
                    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL,
                    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_account (account_id),
                    INDEX idx_entry_date (entry_date),
                    INDEX idx_voucher (voucher_id)
                )
            `);
            console.log('✅ ledger_entries table created');
        } else {
            console.log('✅ ledger_entries table already exists');
        }
        
        // Check if transactions table exists
        console.log('\n📋 Checking transactions table...');
        const [transactionTables] = await connection.query("SHOW TABLES LIKE 'transactions'");
        
        if (transactionTables.length === 0) {
            console.log('⚠️  Creating transactions table...');
            await connection.query(`
                CREATE TABLE transactions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    transaction_date DATE NOT NULL,
                    transaction_type ENUM('income', 'expense', 'transfer', 'advance', 'salary', 'payment') NOT NULL,
                    amount DECIMAL(15, 2) NOT NULL,
                    account_from INT,
                    account_to INT,
                    voucher_id INT,
                    description TEXT,
                    created_by INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (account_from) REFERENCES ledger_accounts(id) ON DELETE SET NULL,
                    FOREIGN KEY (account_to) REFERENCES ledger_accounts(id) ON DELETE SET NULL,
                    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL,
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_transaction_date (transaction_date),
                    INDEX idx_transaction_type (transaction_type)
                )
            `);
            console.log('✅ transactions table created');
        } else {
            console.log('✅ transactions table already exists');
        }
        
        // Fix 7: Add missing columns to employees table
        console.log('\n📋 Checking employees table...');
        const [employeeColumns] = await connection.query("SHOW COLUMNS FROM employees");
        const employeeColumnNames = employeeColumns.map(col => col.Field);
        const missingEmployeeColumns = [];
        
        if (!employeeColumnNames.includes('category')) missingEmployeeColumns.push('category VARCHAR(50) AFTER designation');
        if (!employeeColumnNames.includes('department')) missingEmployeeColumns.push('department VARCHAR(50) AFTER category');
        if (!employeeColumnNames.includes('work_role')) missingEmployeeColumns.push('work_role VARCHAR(50) AFTER department');
        if (!employeeColumnNames.includes('assigned_project_id')) missingEmployeeColumns.push('assigned_project_id INT AFTER work_role');
        
        if (missingEmployeeColumns.length > 0) {
            console.log(`⚠️  Adding ${missingEmployeeColumns.length} missing column(s) to employees table...`);
            
            for (const columnDef of missingEmployeeColumns) {
                const columnName = columnDef.split(' ')[0];
                console.log(`   - Adding ${columnName}...`);
                await connection.query(
                    `ALTER TABLE employees ADD COLUMN ${columnDef}`
                );
            }
            
            // Add foreign key for assigned_project_id
            try {
                await connection.query(
                    "ALTER TABLE employees ADD CONSTRAINT fk_employee_project FOREIGN KEY (assigned_project_id) REFERENCES projects(id) ON DELETE SET NULL"
                );
            } catch (err) {
                // Foreign key might already exist
            }
            
            // Add indexes
            try {
                await connection.query("ALTER TABLE employees ADD INDEX idx_category (category)");
                await connection.query("ALTER TABLE employees ADD INDEX idx_department (department)");
                await connection.query("ALTER TABLE employees ADD INDEX idx_assigned_project (assigned_project_id)");
            } catch (err) {
                // Indexes might already exist
            }
            
            console.log('✅ Missing employee columns added successfully');
        } else {
            console.log('✅ All required columns exist in employees table');
        }
        
        // Fix 8: Add missing columns to projects table
        console.log('\n📋 Checking projects table...');
        const [projectColumns] = await connection.query("SHOW COLUMNS FROM projects");
        const projectColumnNames = projectColumns.map(col => col.Field);
        const missingProjectColumns = [];
        
        if (!projectColumnNames.includes('project_code')) missingProjectColumns.push('project_code VARCHAR(20) UNIQUE AFTER id');
        if (!projectColumnNames.includes('client_id')) missingProjectColumns.push('client_id INT AFTER project_name');
        
        if (missingProjectColumns.length > 0) {
            console.log(`⚠️  Adding ${missingProjectColumns.length} missing column(s) to projects table...`);
            
            for (const columnDef of missingProjectColumns) {
                const columnName = columnDef.split(' ')[0];
                console.log(`   - Adding ${columnName}...`);
                await connection.query(
                    `ALTER TABLE projects ADD COLUMN ${columnDef}`
                );
            }
            
            // Add foreign key for client_id
            try {
                await connection.query(
                    "ALTER TABLE projects ADD CONSTRAINT fk_project_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL"
                );
            } catch (err) {
                // Foreign key might already exist
            }
            
            console.log('✅ Missing project columns added successfully');
        } else {
            console.log('✅ All required columns exist in projects table');
        }
        
        // Fix 9: Add missing columns to expenses table (beyond expense_date)
        console.log('\n📋 Checking expenses table for additional columns...');
        const [expenseCols] = await connection.query("SHOW COLUMNS FROM expenses");
        const expenseColumnNames = expenseCols.map(col => col.Field);
        const missingExpenseColumns = [];
        
        if (!expenseColumnNames.includes('subcategory')) missingExpenseColumns.push('subcategory VARCHAR(100) AFTER category');
        if (!expenseColumnNames.includes('voucher_id')) missingExpenseColumns.push('voucher_id INT AFTER project_id');
        if (!expenseColumnNames.includes('receipt_image')) missingExpenseColumns.push('receipt_image VARCHAR(255) AFTER payment_method');
        
        if (missingExpenseColumns.length > 0) {
            console.log(`⚠️  Adding ${missingExpenseColumns.length} missing column(s) to expenses table...`);
            
            for (const columnDef of missingExpenseColumns) {
                const columnName = columnDef.split(' ')[0];
                console.log(`   - Adding ${columnName}...`);
                await connection.query(
                    `ALTER TABLE expenses ADD COLUMN ${columnDef}`
                );
            }
            
            // Add foreign key for voucher_id
            try {
                await connection.query(
                    "ALTER TABLE expenses ADD CONSTRAINT fk_expense_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL"
                );
            } catch (err) {
                // Foreign key might already exist
            }
            
            console.log('✅ Missing expense columns added successfully');
        } else {
            console.log('✅ All required columns exist in expenses table');
        }
        
        console.log('\n✅ Database schema migration completed successfully!\n');
        
        connection.release();
        
    } catch (error) {
        console.error('\n❌ Database migration error:', error.message);
        if (connection) {
            connection.release();
        }
        // Don't throw error - allow server to start even if migration fails
        console.log('⚠️  Server will continue starting, but some features may not work correctly');
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    fixRailwaySchema()
        .then(() => {
            console.log('Migration script finished');
            process.exit(0);
        })
        .catch(error => {
            console.error('Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = fixRailwaySchema;
