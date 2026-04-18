const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔧 Fixing missing roles...\n');
        
        await pool.query('UPDATE users SET role = "manager" WHERE email = "sitemanager@test.com"');
        console.log('  ✓ Updated sitemanager@test.com → manager');
        
        await pool.query('UPDATE users SET role = "director" WHERE email = "director@test.com"');
        console.log('  ✓ Updated director@test.com → director');
        
        await pool.query('UPDATE users SET role = "deputy_director" WHERE email = "deputy@test.com"');
        console.log('  ✓ Updated deputy@test.com → deputy_director');
        
        console.log('\n✅ All roles fixed!\n');
        
        // Verify
        const [users] = await pool.query('SELECT id, email, role FROM users ORDER BY id');
        console.log('📋 Current Users:');
        users.forEach(u => {
            console.log(`  ${u.id}. ${u.email} → ${u.role}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();
