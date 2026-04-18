const pool = require('./src/config/database');

(async () => {
    try {
        console.log('🔍 COMPLETE DATABASE SCHEMA ANALYSIS\n');
        console.log('=' .repeat(80));
        
        const tables = [
            'users',
            'employees', 
            'projects',
            'expenses',
            'vouchers',
            'purchases',
            'suppliers',
            'ledger_accounts',
            'ledger_entries'
        ];
        
        for (const table of tables) {
            try {
                const [rows] = await pool.query(`DESCRIBE ${table}`);
                console.log(`\n📋 TABLE: ${table.toUpperCase()} (${rows.length} columns)`);
                console.log('-'.repeat(80));
                rows.forEach(r => {
                    console.log(`  ${r.Field.padEnd(30)} | ${r.Type.padEnd(25)} | ${r.Null === 'YES' ? 'NULL' : 'NOT NULL'} | ${r.Key || ''}`);
                });
            } catch (e) {
                console.log(`\n❌ TABLE ${table}: ${e.message}`);
            }
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ Analysis Complete!\n');
        process.exit(0);
    } catch(e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
