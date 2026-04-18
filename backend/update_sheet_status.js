const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔄 Updating draft sheets to pending status...\n');
        
        // Update the two specific sheets to pending
        const [result] = await pool.query(
            `UPDATE daily_sheets 
             SET status = 'pending' 
             WHERE sheet_no IN ('26041602', '26041601') 
             AND status = 'draft'`
        );
        
        console.log(`✅ Updated ${result.affectedRows} sheets to pending status`);
        
        // Verify the update
        const [sheets] = await pool.query(
            `SELECT sheet_no, status, today_expense, created_at 
             FROM daily_sheets 
             WHERE sheet_no IN ('26041602', '26041601')`
        );
        
        console.log('\n📊 Updated Sheets:');
        sheets.forEach(sheet => {
            console.log(`   Sheet: ${sheet.sheet_no} | Status: ${sheet.status} | Amount: ৳${sheet.today_expense}`);
        });
        
        console.log('\n✅ Done! The sheets are now in pending status and will be counted in financial calculations once approved.\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
