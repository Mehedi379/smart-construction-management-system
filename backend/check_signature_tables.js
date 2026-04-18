const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    try {
        const [tables] = await conn.query('SHOW TABLES LIKE "signature%"');
        console.log('Signature tables:');
        if (tables.length === 0) {
            console.log('  ❌ No signature tables found!');
        } else {
            tables.forEach(t => console.log('  ✅ ' + Object.values(t)[0]));
        }

        // Also check for sheet_signatures
        const [sheetSigTables] = await conn.query('SHOW TABLES LIKE "sheet_signatures"');
        if (sheetSigTables.length > 0) {
            console.log('  ✅ sheet_signatures');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await conn.end();
    }
})();
