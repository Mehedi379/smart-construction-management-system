const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('\n🔍 Checking database structure...\n');

    // Check if role is ENUM
    const [columns] = await conn.query(`
        SHOW COLUMNS FROM users WHERE Field = 'role'
    `);
    
    console.log('Role column info:');
    console.log(`  Type: ${columns[0].Type}`);
    console.log(`  Null: ${columns[0].Null}`);
    console.log(`  Default: ${columns[0].Default}\n`);

    // Check current values
    const [currentRoles] = await conn.query(`
        SELECT DISTINCT role FROM users
    `);
    
    console.log('Current distinct role values:');
    currentRoles.forEach(r => {
        console.log(`  '${r.role}'`);
    });
    console.log('');

    // Try direct update with transaction
    console.log('🔄 Updating with transaction...\n');
    
    await conn.query('START TRANSACTION');
    
    try {
        const [result1] = await conn.query(`
            UPDATE users 
            SET role = 'head_office_accounts' 
            WHERE email = 'ho.accounts1@test.com'
        `);
        console.log(`Update 1: ${result1.affectedRows} rows affected`);

        const [result2] = await conn.query(`
            UPDATE users 
            SET role = 'head_office_accounts' 
            WHERE email = 'ho.accounts2@test.com'
        `);
        console.log(`Update 2: ${result2.affectedRows} rows affected`);

        const [result3] = await conn.query(`
            UPDATE users 
            SET role = 'head_office_admin' 
            WHERE email = 'headoffice.admin@khazabilkis.com'
        `);
        console.log(`Update 3: ${result3.affectedRows} rows affected`);

        await conn.query('COMMIT');
        console.log('\n✅ Transaction committed\n');

    } catch (error) {
        await conn.query('ROLLBACK');
        console.log('\n❌ Transaction rolled back:', error.message, '\n');
    }

    // Verify immediately
    const [verify] = await conn.query(`
        SELECT id, name, email, role 
        FROM users 
        WHERE email IN ('ho.accounts1@test.com', 'ho.accounts2@test.com', 'headoffice.admin@khazabilkis.com')
    `);

    console.log('Verification:');
    verify.forEach(u => {
        console.log(`  ${u.email} => role: '${u.role}'`);
    });

    await conn.end();
    console.log('\n✅ Done!\n');
})();
