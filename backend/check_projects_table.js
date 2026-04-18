const pool = require('./src/config/database');

(async () => {
    try {
        const [rows] = await pool.query('DESCRIBE projects');
        console.log('📋 Projects Table Structure:\n');
        rows.forEach(r => {
            console.log(`✓ ${r.Field.padEnd(25)} - ${r.Type}`);
        });
        process.exit(0);
    } catch(e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
