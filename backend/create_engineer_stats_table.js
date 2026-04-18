const mysql = require('mysql2/promise');
require('dotenv').config();

async function createEngineerStatsTable() {
    console.log('\n📊 Creating engineer_stats summary table...\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        // Create engineer_stats table
        console.log('➕ Creating engineer_stats table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS engineer_stats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                project_id INT NOT NULL,
                total_vouchers INT DEFAULT 0,
                total_voucher_amount DECIMAL(15,2) DEFAULT 0.00,
                total_sheets INT DEFAULT 0,
                total_expense DECIMAL(15,2) DEFAULT 0.00,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_project (user_id, project_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                INDEX idx_project (project_id),
                INDEX idx_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ engineer_stats table created\n');

        // Populate with existing data
        console.log('📝 Populating engineer_stats with existing data...');
        await connection.query(`
            INSERT INTO engineer_stats (user_id, project_id, total_vouchers, total_voucher_amount, total_sheets, total_expense)
            SELECT 
                u.id as user_id,
                e.assigned_project_id as project_id,
                COUNT(DISTINCT v.id) as total_vouchers,
                COALESCE(SUM(v.amount), 0) as total_voucher_amount,
                COUNT(DISTINCT ds.id) as total_sheets,
                COALESCE(SUM(ds.today_expense), 0) as total_expense
            FROM employees e
            INNER JOIN users u ON e.user_id = u.id
            LEFT JOIN vouchers v ON v.created_by = u.id AND v.project_id = e.assigned_project_id
            LEFT JOIN daily_sheets ds ON ds.created_by = u.id AND ds.project_id = e.assigned_project_id
            WHERE e.assigned_project_id IS NOT NULL AND u.role = 'engineer'
            GROUP BY u.id, e.assigned_project_id
            ON DUPLICATE KEY UPDATE
                total_vouchers = VALUES(total_vouchers),
                total_voucher_amount = VALUES(total_voucher_amount),
                total_sheets = VALUES(total_sheets),
                total_expense = VALUES(total_expense),
                last_updated = NOW()
        `);
        console.log('✅ engineer_stats populated\n');

        // Create triggers to auto-update stats
        console.log('🔄 Creating auto-update triggers...');

        // Trigger for vouchers
        await connection.query(`
            CREATE TRIGGER IF NOT EXISTS trg_voucher_after_insert
            AFTER INSERT ON vouchers
            FOR EACH ROW
            BEGIN
                DECLARE eng_user_id INT;
                DECLARE eng_project_id INT;
                
                -- Check if creator is an engineer
                SELECT u.id, e.assigned_project_id 
                INTO eng_user_id, eng_project_id
                FROM users u
                INNER JOIN employees e ON u.id = e.user_id
                WHERE u.id = NEW.created_by AND u.role = 'engineer';
                
                IF eng_user_id IS NOT NULL THEN
                    INSERT INTO engineer_stats (user_id, project_id, total_vouchers, total_voucher_amount)
                    VALUES (eng_user_id, eng_project_id, 1, NEW.amount)
                    ON DUPLICATE KEY UPDATE
                        total_vouchers = total_vouchers + 1,
                        total_voucher_amount = total_voucher_amount + NEW.amount,
                        last_updated = NOW();
                END IF;
            END
        `);
        console.log('✅ Voucher insert trigger created');

        // Trigger for daily sheets
        await connection.query(`
            CREATE TRIGGER IF NOT EXISTS trg_sheet_after_insert
            AFTER INSERT ON daily_sheets
            FOR EACH ROW
            BEGIN
                DECLARE eng_user_id INT;
                DECLARE eng_project_id INT;
                
                -- Check if creator is an engineer
                SELECT u.id, e.assigned_project_id 
                INTO eng_user_id, eng_project_id
                FROM users u
                INNER JOIN employees e ON u.id = e.user_id
                WHERE u.id = NEW.created_by AND u.role = 'engineer';
                
                IF eng_user_id IS NOT NULL THEN
                    INSERT INTO engineer_stats (user_id, project_id, total_sheets, total_expense)
                    VALUES (eng_user_id, eng_project_id, 1, NEW.today_expense)
                    ON DUPLICATE KEY UPDATE
                        total_sheets = total_sheets + 1,
                        total_expense = total_expense + NEW.today_expense,
                        last_updated = NOW();
                END IF;
            END
        `);
        console.log('✅ Daily sheet insert trigger created\n');

        console.log('========================================');
        console.log('✅ ENGINEER STATS SYSTEM READY');
        console.log('========================================\n');

        console.log('📋 How it works:');
        console.log('   1. engineer_stats table stores aggregated data');
        console.log('   2. Auto-updates via triggers on insert');
        console.log('   3. Fast dashboard queries (no complex JOINs)');
        console.log('   4. Real-time stats for each engineer\n');

        console.log('📊 Table structure:');
        console.log('   - user_id: Engineer ID');
        console.log('   - project_id: Assigned project');
        console.log('   - total_vouchers: Count of vouchers');
        console.log('   - total_voucher_amount: Sum of voucher amounts');
        console.log('   - total_sheets: Count of daily sheets');
        console.log('   - total_expense: Sum of daily expenses');
        console.log('   - last_updated: Last update timestamp\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) await connection.end();
    }
}

createEngineerStatsTable();
