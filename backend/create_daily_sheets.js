const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    try {
        // Read the schema file
        const schemaPath = path.join(__dirname, '..', 'database', 'daily_sheet_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute the schema
        await conn.query(schema);
        console.log('✅ Daily sheet tables created successfully!');

        // Verify tables were created
        const [tables] = await conn.query('SHOW TABLES LIKE "daily_sheet%"');
        console.log('\nCreated tables:');
        tables.forEach(t => console.log('  - ' + Object.values(t)[0]));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await conn.end();
    }
})();
