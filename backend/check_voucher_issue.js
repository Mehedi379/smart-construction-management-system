// Check voucher update issue
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkVoucherIssue() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'construction_db'
    });

    console.log('\n🔍 Checking Voucher System...\n');

    // Check if vouchers table exists and has correct structure
    const [columns] = await conn.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'vouchers'
         ORDER BY ORDINAL_POSITION`,
        [process.env.DB_NAME || 'construction_db']
    );

    console.log('📋 Vouchers Table Structure:');
    columns.forEach(col => {
        console.log(`   ${col.COLUMN_NAME} - ${col.COLUMN_TYPE} (Nullable: ${col.IS_NULLABLE})`);
    });

    // Check if there are any vouchers
    const [vouchers] = await conn.query('SELECT * FROM vouchers');
    console.log(`\n📊 Total Vouchers: ${vouchers.length}`);

    if (vouchers.length > 0) {
        console.log('\nSample Voucher:');
        console.log(vouchers[0]);
    }

    // Check stored procedures
    const [procedures] = await conn.query(
        `SELECT ROUTINE_NAME FROM information_schema.ROUTINES 
         WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'`,
        [process.env.DB_NAME || 'construction_db']
    );

    console.log('\n📝 Stored Procedures:');
    procedures.forEach(proc => {
        console.log(`   - ${proc.ROUTINE_NAME}`);
    });

    // Check if create_or_add_to_sheet exists
    const [sheetProc] = await conn.query(
        `SELECT COUNT(*) as count FROM information_schema.ROUTINES 
         WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = 'create_or_add_to_sheet'`,
        [process.env.DB_NAME || 'construction_db']
    );

    if (sheetProc[0].count === 0) {
        console.log('\n⚠️  WARNING: create_or_add_to_sheet procedure NOT FOUND!');
        console.log('This will cause voucher update to fail when approving.');
    } else {
        console.log('\n✅ create_or_add_to_sheet procedure exists');
    }

    await conn.end();
}

checkVoucherIssue().catch(console.error);
