const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔍 Checking if stored procedure exists...\n');
        
        const [rows] = await pool.query(`
            SELECT ROUTINE_NAME 
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_TYPE = 'PROCEDURE' 
            AND ROUTINE_SCHEMA = 'construction_db'
            AND ROUTINE_NAME = 'create_or_add_to_sheet'
        `);
        
        if (rows.length > 0) {
            console.log('✅ Stored procedure EXISTS');
        } else {
            console.log('❌ Stored procedure DOES NOT EXIST');
            console.log('\n🔧 This is why voucher approval is failing!\n');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
