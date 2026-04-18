const pool = require('./src/config/database');

async function checkSchema() {
    try {
        const [columns] = await pool.query('DESCRIBE daily_sheets');
        console.log('daily_sheets columns:');
        columns.forEach(c => console.log(` - ${c.Field}: ${c.Type}`));

        // Check if total_amount column exists
        const hasTotalAmount = columns.some(c => c.Field === 'total_amount');
        
        if (!hasTotalAmount) {
            console.log('\n❌ Missing column: total_amount');
            console.log('Adding total_amount column...');
            
            await pool.query(`
                ALTER TABLE daily_sheets 
                ADD COLUMN total_amount DECIMAL(15, 2) DEFAULT 0 
                AFTER today_expense
            `);
            
            console.log('✅ Added total_amount column');
        } else {
            console.log('\n✅ total_amount column exists');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
