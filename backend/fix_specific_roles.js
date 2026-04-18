const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔧 FIXING SPECIFIC USER ROLES...\n');
        
        // Fix Head Office Accounts users → accountant
        console.log('📋 Fixing Head Office Accounts users...\n');
        
        const [accountsResult] = await pool.query(
            `UPDATE users 
             SET role = 'accountant' 
             WHERE email IN ('ho.accounts1@test.com', 'ho.accounts2@test.com')`
        );
        
        console.log(`   ✅ Updated ${accountsResult.affectedRows} Head Office Accounts users to "accountant"\n`);
        
        // Fix Head Office Admin → admin
        console.log('📋 Fixing Head Office Admin user...\n');
        
        const [adminResult] = await pool.query(
            `UPDATE users 
             SET role = 'admin' 
             WHERE email = 'headoffice.admin@khazabilkis.com'`
        );
        
        console.log(`   ✅ Updated ${adminResult.affectedRows} Head Office Admin user to "admin"\n`);
        
        // Verify final distribution
        console.log('📊 Final role distribution:\n');
        
        const [roleStats] = await pool.query(
            `SELECT u.role, COUNT(*) as count
             FROM users u
             WHERE u.is_active = TRUE
             GROUP BY u.role
             ORDER BY count DESC`
        );
        
        roleStats.forEach(stat => {
            console.log(`   ${stat.role}: ${stat.count} user(s)`);
        });
        
        console.log('\n✅ All roles fixed successfully!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
