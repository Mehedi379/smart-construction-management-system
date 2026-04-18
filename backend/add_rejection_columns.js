const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('\n🔧 Adding rejection columns to daily_sheets...\n');

    try {
        await conn.query('ALTER TABLE daily_sheets ADD COLUMN rejected_at TIMESTAMP NULL AFTER approved_at');
        console.log('✅ Added rejected_at');
    } catch (e) {
        console.log('⚠️ rejected_at already exists');
    }

    try {
        await conn.query('ALTER TABLE daily_sheets ADD COLUMN rejected_by INT NULL AFTER rejected_at');
        console.log('✅ Added rejected_by');
    } catch (e) {
        console.log('⚠️ rejected_by already exists');
    }

    try {
        await conn.query('ALTER TABLE daily_sheets ADD COLUMN rejection_reason TEXT NULL AFTER rejected_by');
        console.log('✅ Added rejection_reason');
    } catch (e) {
        console.log('⚠️ rejection_reason already exists');
    }

    console.log('\n✅ All rejection columns added!\n');

    const [cols] = await conn.query('SHOW COLUMNS FROM daily_sheets LIKE "rejected_%"');
    console.log('Current rejection columns:');
    cols.forEach(c => console.log(`  - ${c.Field}`));

    await conn.end();
})();
