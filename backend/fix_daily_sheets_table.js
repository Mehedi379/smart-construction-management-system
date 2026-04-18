const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    try {
        console.log('🔧 Fixing daily_sheets table...\n');

        // Add missing columns to daily_sheets
        const columnsToAdd = [
            { 
                name: 'total_amount', 
                sql: 'ALTER TABLE daily_sheets ADD COLUMN total_amount DECIMAL(15,2) DEFAULT 0.00 AFTER today_expense' 
            },
            { 
                name: 'total_vouchers', 
                sql: 'ALTER TABLE daily_sheets ADD COLUMN total_vouchers INT DEFAULT 0 AFTER total_amount' 
            },
            { 
                name: 'previous_sheet_id', 
                sql: 'ALTER TABLE daily_sheets ADD COLUMN previous_sheet_id INT NULL AFTER project_id' 
            }
        ];

        for (const col of columnsToAdd) {
            try {
                await conn.query(col.sql);
                console.log('✅ Added column: ' + col.name);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log('✓ Column already exists: ' + col.name);
                } else {
                    console.log('❌ Error adding ' + col.name + ': ' + error.message);
                }
            }
        }

        // Add foreign key for previous_sheet_id
        try {
            await conn.query(
                'ALTER TABLE daily_sheets ADD FOREIGN KEY (previous_sheet_id) REFERENCES daily_sheets(id) ON DELETE SET NULL'
            );
            console.log('✅ Added foreign key: previous_sheet_id');
        } catch (error) {
            if (error.code === 'ER_DUP_KEY') {
                console.log('✓ Foreign key already exists: previous_sheet_id');
            } else {
                console.log('⚠️  Foreign key warning: ' + error.message);
            }
        }

        console.log('\n✅ daily_sheets table fixed successfully!');

        // Verify the table structure
        const [columns] = await conn.query('DESCRIBE daily_sheets');
        console.log('\nFinal table structure:');
        columns.forEach(col => console.log('  - ' + col.Field + ': ' + col.Type));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await conn.end();
    }
})();
