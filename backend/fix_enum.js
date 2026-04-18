const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔧 Fixing users table role ENUM...\n');
        
        // Alter the ENUM to include all necessary roles
        await pool.query(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM(
                'admin',
                'accountant',
                'engineer',
                'viewer',
                'employee',
                'manager',
                'director',
                'deputy_director'
            ) DEFAULT 'employee'
        `);
        
        console.log('  ✓ Updated role ENUM');
        
        // Now update the roles
        await pool.query('UPDATE users SET role = "manager" WHERE email = "sitemanager@test.com"');
        console.log('  ✓ Set sitemanager@test.com → manager');
        
        await pool.query('UPDATE users SET role = "director" WHERE email = "director@test.com"');
        console.log('  ✓ Set director@test.com → director');
        
        await pool.query('UPDATE users SET role = "deputy_director" WHERE email = "deputy@test.com"');
        console.log('  ✓ Set deputy@test.com → deputy_director');
        
        console.log('\n✅ ENUM fixed and roles updated!\n');
        
        // Verify
        const [users] = await pool.query('SELECT id, email, role FROM users ORDER BY id');
        console.log('📋 Final User List:');
        users.forEach(u => {
            console.log(`  ${u.id}. ${u.email} → ${u.role}`);
        });
        
        // Show the updated ENUM
        const [columns] = await pool.query('SHOW COLUMNS FROM users LIKE "role"');
        console.log('\n📋 Updated Role ENUM:');
        console.log(`  ${columns[0].Type}\n`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
