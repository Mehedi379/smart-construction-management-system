// Check and fix triggers
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTriggers() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'construction_db'
    });

    console.log('\n🔍 Checking Triggers...\n');

    // Get all triggers on vouchers table
    const [triggers] = await conn.query(
        `SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_STATEMENT 
         FROM information_schema.TRIGGERS 
         WHERE EVENT_OBJECT_SCHEMA = ? AND EVENT_OBJECT_TABLE = 'vouchers'`,
        [process.env.DB_NAME || 'construction_db']
    );

    console.log('📋 Found', triggers.length, 'triggers on vouchers table:\n');

    triggers.forEach((trigger, i) => {
        console.log(`${i + 1}. ${trigger.TRIGGER_NAME}`);
        console.log(`   Event: ${trigger.EVENT_MANIPULATION}`);
        console.log(`   Action: ${trigger.ACTION_STATEMENT.substring(0, 100)}...\n`);
    });

    // Drop all triggers
    console.log('\n🗑️  Dropping old triggers...\n');
    
    for (const trigger of triggers) {
        await conn.query(`DROP TRIGGER IF EXISTS ${trigger.TRIGGER_NAME}`);
        console.log(`   ✓ Dropped: ${trigger.TRIGGER_NAME}`);
    }

    console.log('\n✅ All old triggers removed!');
    console.log('\nVoucher updates should work now.\n');

    await conn.end();
}

fixTriggers().catch(console.error);
