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
        if (!employeeColumnNames.includes('created_by')) missingEmployeeColumns.push('created_by INT AFTER status');
        if (!employeeColumnNames.includes('updated_by')) missingEmployeeColumns.push('updated_by INT AFTER created_by');
        
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
        
        // Fix 7.5: Add missing columns to users table
        console.log('\n📋 Checking users table...');
        const [userColumns] = await connection.query("SHOW COLUMNS FROM users");
        const userColumnNames = userColumns.map(col => col.Field);
        const missingUserColumns = [];
        
        if (!userColumnNames.includes('status')) missingUserColumns.push("status ENUM('active', 'inactive', 'suspended') DEFAULT 'inactive' AFTER is_approved");
        if (!userColumnNames.includes('requested_role')) missingUserColumns.push('requested_role VARCHAR(50) AFTER is_approved');
        if (!userColumnNames.includes('last_login')) missingUserColumns.push('last_login TIMESTAMP NULL AFTER status');
        
        if (missingUserColumns.length > 0) {
            console.log(`⚠️  Adding ${missingUserColumns.length} missing column(s) to users table...`);
            
            for (const columnDef of missingUserColumns) {
                const columnName = columnDef.split(' ')[0];
                console.log(`   - Adding ${columnName}...`);
                await connection.query(
                    `ALTER TABLE users ADD COLUMN ${columnDef}`
                );
            }
            
            console.log('✅ Missing user columns added successfully');
        } else {
            console.log('✅ All required columns exist in users table');
        }
        
        // Fix 7.6: Fix voucher_type column to support all types
        console.log('\n📋 Checking vouchers table voucher_type column...');
        try {
            // Change voucher_type to support: payment, receipt, expense, journal, contra
            await connection.query(
                "ALTER TABLE vouchers MODIFY COLUMN voucher_type VARCHAR(50) NOT NULL"
            );
            console.log('   ✅ voucher_type updated to VARCHAR(50)');
        } catch (err) {
            console.log('   ⚠️  Could not update voucher_type:', err.message);
        }
        
        // Fix status column in vouchers
        try {
            await connection.query(
                "ALTER TABLE vouchers MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'"
            );
            console.log('   ✅ voucher status column updated');
        } catch (err) {
            console.log('   ⚠️  Could not update voucher status');
        }
        
        // Fix 8: Fix projects table - ensure project_code exists and project_id doesn't block inserts
        console.log('\n📋 Checking projects table...');
        const [projectColumns] = await connection.query("SHOW COLUMNS FROM projects");
        const projectColumnNames = projectColumns.map(col => col.Field);
        
        // Drop project_id column if it exists (we'll use project_code instead)
        if (projectColumnNames.includes('project_id')) {
            console.log('   - Removing old project_id column...');
            try {
                await connection.query(
                    "ALTER TABLE projects DROP COLUMN project_id"
                );
                console.log('   ✅ Dropped project_id column');
            } catch (err) {
                console.log('   ⚠️  Cannot drop project_id:', err.message);
                // Fallback: just make it nullable
                try {
                    await connection.query(
                        "ALTER TABLE projects MODIFY COLUMN project_id VARCHAR(20) NULL DEFAULT NULL"
                    );
                    console.log('   ✅ Made project_id nullable as fallback');
                } catch (err2) {}
            }
        }
        
        const missingProjectColumns = [];
        
        // Re-check columns
        const [updatedProjectColumns] = await connection.query("SHOW COLUMNS FROM projects");
        const updatedProjectColumnNames = updatedProjectColumns.map(col => col.Field);
        
        if (!updatedProjectColumnNames.includes('project_code')) missingProjectColumns.push('project_code VARCHAR(20) UNIQUE AFTER id');
        if (!updatedProjectColumnNames.includes('client_id')) missingProjectColumns.push('client_id INT AFTER project_name');
        if (!updatedProjectColumnNames.includes('location')) missingProjectColumns.push('location TEXT AFTER client_id');
        if (!updatedProjectColumnNames.includes('estimated_budget')) missingProjectColumns.push('estimated_budget DECIMAL(20, 2) DEFAULT 0.00 AFTER location');
        if (!updatedProjectColumnNames.includes('actual_cost')) missingProjectColumns.push('actual_cost DECIMAL(20, 2) DEFAULT 0.00 AFTER estimated_budget');
        if (!updatedProjectColumnNames.includes('start_date')) missingProjectColumns.push('start_date DATE AFTER actual_cost');
        if (!updatedProjectColumnNames.includes('end_date')) missingProjectColumns.push('end_date DATE AFTER start_date');
        if (!updatedProjectColumnNames.includes('description')) missingProjectColumns.push('description TEXT AFTER end_date');
        if (!updatedProjectColumnNames.includes('created_by')) missingProjectColumns.push('created_by INT AFTER description');
        
        if (missingProjectColumns.length > 0) {
            console.log(`⚠️  Adding ${missingProjectColumns.length} missing column(s) to projects table...`);
            
            for (const columnDef of missingProjectColumns) {
                const columnName = columnDef.split(' ')[0];
                console.log(`   - Adding ${columnName}...`);
                await connection.query(
                    `ALTER TABLE projects ADD COLUMN ${columnDef}`
                );
            }
            
            // Add foreign keys
            try {
                await connection.query(
                    "ALTER TABLE projects ADD CONSTRAINT fk_project_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL"
                );
            } catch (err) {}
            
            try {
                await connection.query(
                    "ALTER TABLE projects ADD CONSTRAINT fk_project_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL"
                );
            } catch (err) {}
            
            console.log('✅ Missing project columns added successfully');
        } else {
            console.log('✅ All required columns exist in projects table');
        }
        
        // Fix budget columns size - ensure they can handle large values
        console.log('\n📋 Ensuring budget columns can handle large values...');
        try {
            await connection.query(
                "ALTER TABLE projects MODIFY COLUMN estimated_budget DECIMAL(20, 2) DEFAULT 0.00"
            );
            console.log('   ✅ estimated_budget updated to DECIMAL(20, 2)');
        } catch (err) {
            console.log('   ⚠️  Could not update estimated_budget');
        }
        
        try {
            await connection.query(
                "ALTER TABLE projects MODIFY COLUMN actual_cost DECIMAL(20, 2) DEFAULT 0.00"
            );
            console.log('   ✅ actual_cost updated to DECIMAL(20, 2)');
        } catch (err) {
            console.log('   ⚠️  Could not update actual_cost');
        }
        
        // Fix 10: Create missing workflow_templates table
        console.log('\n📋 Checking workflow_templates table...');
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS workflow_templates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    entity_type VARCHAR(50) NOT NULL,
                    entity_id INT,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    steps JSON,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ workflow_templates table created');
            
            // Insert default template for sheets
            const [existingTemplates] = await connection.query(
                'SELECT id FROM workflow_templates WHERE entity_type = "sheet" AND is_active = TRUE LIMIT 1'
            );
            
            if (existingTemplates.length === 0) {
                await connection.query(`
                    INSERT INTO workflow_templates (entity_type, name, description, steps)
                    VALUES (
                        'sheet',
                        'Default Sheet Approval',
                        'Standard daily sheet approval workflow',
                        '[{"step": 1, "role": "site_manager", "label": "Site Manager Approval"}, {"step": 2, "role": "accountant", "label": "Accountant Approval"}, {"step": 3, "role": "admin", "label": "Final Approval"}]'
                    )
                `);
                console.log('✅ Default sheet workflow template created');
            }
        } catch (err) {
            console.log('⚠️  Could not create workflow_templates:', err.message);
        }
        
        // Fix 11: Fix signature_requests status column
        console.log('\n📋 Fixing signature_requests status column...');
        try {
            await connection.query(
                "ALTER TABLE signature_requests MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'"
            );
            console.log('   ✅ signature_requests status updated to VARCHAR(50)');
        } catch (err) {
            console.log('   ⚠️  Could not update signature_requests status');
        }
        
        // Fix 12: Fix daily_sheets status column
        console.log('\n📋 Fixing daily_sheets status column...');
        try {
            await connection.query(
                "ALTER TABLE daily_sheets MODIFY COLUMN status VARCHAR(50) DEFAULT 'draft'"
            );
            console.log('   ✅ daily_sheets status updated to VARCHAR(50)');
        } catch (err) {
            console.log('   ⚠️  Could not update daily_sheets status');
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
        
        // Fix 10: Fix daily_sheets table columns
        console.log('\n📋 Checking daily_sheets table columns...');
        const [dailySheetColumns] = await connection.query("SHOW COLUMNS FROM daily_sheets");
        const dailySheetColumnNames = dailySheetColumns.map(col => col.Field);
        const missingDailySheetColumns = [];
        
        // Check for correct column names used by the model
        if (!dailySheetColumnNames.includes('sheet_no')) {
            // Check if sheet_id exists (old name)
            if (dailySheetColumnNames.includes('sheet_id')) {
                console.log('   - Renaming sheet_id to sheet_no...');
                await connection.query(
                    "ALTER TABLE daily_sheets CHANGE COLUMN sheet_id sheet_no VARCHAR(30) UNIQUE NOT NULL"
                );
            } else {
                missingDailySheetColumns.push('sheet_no VARCHAR(30) UNIQUE AFTER id');
            }
        }
        
        if (!dailySheetColumnNames.includes('sheet_date')) {
            // Check if date exists (old name)
            if (dailySheetColumnNames.includes('date')) {
                console.log('   - Renaming date to sheet_date...');
                await connection.query(
                    "ALTER TABLE daily_sheets CHANGE COLUMN date sheet_date DATE NOT NULL"
                );
            } else {
                missingDailySheetColumns.push('sheet_date DATE AFTER sheet_no');
            }
        }
        
        if (!dailySheetColumnNames.includes('location')) missingDailySheetColumns.push('location VARCHAR(255) AFTER sheet_date');
        if (!dailySheetColumnNames.includes('previous_balance')) missingDailySheetColumns.push('previous_balance DECIMAL(15, 2) DEFAULT 0 AFTER location');
        if (!dailySheetColumnNames.includes('today_expense')) missingDailySheetColumns.push('today_expense DECIMAL(15, 2) DEFAULT 0 AFTER previous_balance');
        if (!dailySheetColumnNames.includes('remaining_balance')) missingDailySheetColumns.push('remaining_balance DECIMAL(15, 2) DEFAULT 0 AFTER today_expense');
        if (!dailySheetColumnNames.includes('receipt_image')) missingDailySheetColumns.push('receipt_image VARCHAR(255) AFTER remaining_balance');
        if (!dailySheetColumnNames.includes('ocr_text')) missingDailySheetColumns.push('ocr_text TEXT AFTER receipt_image');
        if (!dailySheetColumnNames.includes('created_by')) missingDailySheetColumns.push('created_by INT AFTER ocr_text');
        if (!dailySheetColumnNames.includes('submitted_by')) missingDailySheetColumns.push('submitted_by INT AFTER created_by');
        if (!dailySheetColumnNames.includes('approved_by')) missingDailySheetColumns.push('approved_by INT AFTER submitted_by');
        if (!dailySheetColumnNames.includes('rejected_by')) missingDailySheetColumns.push('rejected_by INT AFTER approved_by');
        if (!dailySheetColumnNames.includes('rejection_reason')) missingDailySheetColumns.push('rejection_reason TEXT AFTER rejected_by');
        if (!dailySheetColumnNames.includes('rejected_at')) missingDailySheetColumns.push('rejected_at TIMESTAMP NULL AFTER rejection_reason');
        if (!dailySheetColumnNames.includes('is_locked')) missingDailySheetColumns.push('is_locked BOOLEAN DEFAULT FALSE AFTER status');
        
        if (missingDailySheetColumns.length > 0) {
            console.log(`⚠️  Adding ${missingDailySheetColumns.length} missing column(s) to daily_sheets table...`);
            
            for (const columnDef of missingDailySheetColumns) {
                const columnName = columnDef.split(' ')[0];
                console.log(`   - Adding ${columnName}...`);
                await connection.query(
                    `ALTER TABLE daily_sheets ADD COLUMN ${columnDef}`
                );
            }
            
            // Add foreign key for created_by
            try {
                await connection.query(
                    "ALTER TABLE daily_sheets ADD CONSTRAINT fk_sheet_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL"
                );
            } catch (err) {
                // Foreign key might already exist
            }
            
            // Add foreign keys for other user columns
            try {
                await connection.query(
                    "ALTER TABLE daily_sheets ADD CONSTRAINT fk_sheet_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL"
                );
            } catch (err) {}
            
            try {
                await connection.query(
                    "ALTER TABLE daily_sheets ADD CONSTRAINT fk_sheet_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL"
                );
            } catch (err) {}
            
            try {
                await connection.query(
                    "ALTER TABLE daily_sheets ADD CONSTRAINT fk_sheet_rejected_by FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL"
                );
            } catch (err) {}
            
            console.log('✅ Missing daily_sheets columns added successfully');
        } else if (dailySheetColumnNames.includes('sheet_no') && dailySheetColumnNames.includes('sheet_date')) {
            console.log('✅ All required columns exist in daily_sheets table');
        }
        
        // Fix 11: Create missing daily sheet and signature tables
        console.log('\n📋 Checking daily sheet related tables...');
        
        // Check signature_requests table
        const [sigRequestTables] = await connection.query("SHOW TABLES LIKE 'signature_requests'");
        if (sigRequestTables.length === 0) {
            console.log('⚠️  Creating signature_requests table...');
            await connection.query(`
                CREATE TABLE signature_requests (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sheet_id INT NOT NULL,
                    role_code VARCHAR(50) NOT NULL,
                    role_name VARCHAR(100) NOT NULL,
                    status ENUM('pending', 'signed', 'rejected') DEFAULT 'pending',
                    requested_by INT,
                    signed_by INT,
                    signed_at TIMESTAMP NULL,
                    rejection_reason TEXT,
                    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
                    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
                    FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_sheet (sheet_id),
                    INDEX idx_role (role_code),
                    INDEX idx_status (status)
                )
            `);
            console.log('✅ signature_requests table created');
        } else {
            console.log('✅ signature_requests table already exists');
        }
        
        // Check sheet_workflows table
        const [sheetWorkflowTables] = await connection.query("SHOW TABLES LIKE 'sheet_workflows'");
        if (sheetWorkflowTables.length === 0) {
            console.log('⚠️  Creating sheet_workflows table...');
            await connection.query(`
                CREATE TABLE sheet_workflows (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    workflow_id VARCHAR(50) UNIQUE NOT NULL,
                    sheet_id INT NOT NULL UNIQUE,
                    project_id INT,
                    current_step INT DEFAULT 1,
                    status ENUM('pending', 'in_review', 'approved', 'rejected') DEFAULT 'pending',
                    started_by INT,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP NULL,
                    FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
                    FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_sheet (sheet_id),
                    INDEX idx_status (status)
                )
            `);
            console.log('✅ sheet_workflows table created');
        } else {
            console.log('✅ sheet_workflows table already exists');
        }
        
        // Check workflow_steps table
        const [workflowStepTables] = await connection.query("SHOW TABLES LIKE 'workflow_steps'");
        if (workflowStepTables.length === 0) {
            console.log('⚠️  Creating workflow_steps table...');
            await connection.query(`
                CREATE TABLE workflow_steps (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    workflow_id INT NOT NULL,
                    step_number INT NOT NULL,
                    role_id INT NOT NULL,
                    step_name VARCHAR(100) NOT NULL,
                    action_required ENUM('signature', 'review', 'approval') DEFAULT 'signature',
                    FOREIGN KEY (workflow_id) REFERENCES sheet_workflows(id) ON DELETE CASCADE,
                    INDEX idx_workflow (workflow_id)
                )
            `);
            console.log('✅ workflow_steps table created');
        } else {
            console.log('✅ workflow_steps table already exists');
        }
        
        // Check universal_signatures table
        const [universalSigTables] = await connection.query("SHOW TABLES LIKE 'universal_signatures'");
        if (universalSigTables.length === 0) {
            console.log('⚠️  Creating universal_signatures table...');
            await connection.query(`
                CREATE TABLE universal_signatures (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    entity_type VARCHAR(50) NOT NULL,
                    entity_id INT NOT NULL,
                    workflow_id INT,
                    step_number INT,
                    user_id INT NOT NULL,
                    role_id INT,
                    action ENUM('signed', 'rejected', 'reviewed') NOT NULL,
                    signature_data TEXT,
                    comments TEXT,
                    ip_address VARCHAR(45),
                    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_entity (entity_type, entity_id),
                    INDEX idx_user (user_id)
                )
            `);
            console.log('✅ universal_signatures table created');
        } else {
            console.log('✅ universal_signatures table already exists');
        }
        
        // Check roles table
        const [roleTables] = await connection.query("SHOW TABLES LIKE 'roles'");
        if (roleTables.length === 0) {
            console.log('⚠️  Creating roles table...');
            await connection.query(`
                CREATE TABLE roles (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    role_code VARCHAR(50) UNIQUE NOT NULL,
                    role_name VARCHAR(100) NOT NULL,
                    description TEXT,
                    step_order INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ roles table created');
            
            // Insert default roles
            console.log('   Inserting default roles...');
            await connection.query(`
                INSERT INTO roles (role_code, role_name, step_order) VALUES
                ('site_manager', 'Site Manager', 1),
                ('site_engineer', 'Site Engineer', 2),
                ('head_office_accounts_1', 'Head Office Accounts 1', 3),
                ('head_office_accounts_2', 'Head Office Accounts 2', 4),
                ('deputy_head_office', 'Deputy Head Office', 5),
                ('site_director', 'Site Director', 6),
                ('project_director', 'Project Director', 7),
                ('deputy_director', 'Deputy Director', 8)
            `);
            console.log('   ✅ Default roles inserted');
        } else {
            console.log('✅ roles table already exists');
        }
        
        // Check daily_sheet_items table
        const [sheetItemTables] = await connection.query("SHOW TABLES LIKE 'daily_sheet_items'");
        if (sheetItemTables.length === 0) {
            console.log('⚠️  Creating daily_sheet_items table...');
            await connection.query(`
                CREATE TABLE daily_sheet_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sheet_id INT NOT NULL,
                    item_no INT NOT NULL,
                    description TEXT,
                    qty DECIMAL(10, 2) DEFAULT 0,
                    rate DECIMAL(10, 2) DEFAULT 0,
                    amount DECIMAL(15, 2) DEFAULT 0,
                    source VARCHAR(50) DEFAULT 'manual',
                    source_id INT,
                    FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
                    INDEX idx_sheet (sheet_id)
                )
            `);
            console.log('✅ daily_sheet_items table created');
        } else {
            console.log('✅ daily_sheet_items table already exists');
        }
        
        // Check daily_sheet_signatures table
        const [sheetSigTables] = await connection.query("SHOW TABLES LIKE 'daily_sheet_signatures'");
        if (sheetSigTables.length === 0) {
            console.log('⚠️  Creating daily_sheet_signatures table...');
            await connection.query(`
                CREATE TABLE daily_sheet_signatures (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sheet_id INT NOT NULL UNIQUE,
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
                    FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE
                )
            `);
            console.log('✅ daily_sheet_signatures table created');
        } else {
            console.log('✅ daily_sheet_signatures table already exists');
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
