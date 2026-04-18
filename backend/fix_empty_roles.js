const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔍 CHECKING USERS WITH EMPTY/NULL ROLES...\n');
        
        // Find users with empty or null roles
        const [users] = await pool.query(
            `SELECT u.id, u.email, u.name, u.role, e.category, e.designation
             FROM users u
             LEFT JOIN employees e ON u.id = e.user_id
             WHERE u.role IS NULL OR u.role = '' OR u.role = ' '
             ORDER BY u.id`
        );
        
        if (users.length === 0) {
            console.log('   ✅ No users with empty/null roles found!\n');
            process.exit(0);
        }
        
        console.log(`Found ${users.length} users with empty/null roles:\n`);
        users.forEach(user => {
            console.log(`   User ID: ${user.id}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Current Role: "${user.role}" (empty/null)`);
            console.log(`   Category: ${user.category || 'N/A'}`);
            console.log(`   Designation: ${user.designation || 'N/A'}\n`);
        });
        
        // Ask user what to do - for now, auto-fix to 'employee'
        console.log('🔧 Auto-fixing: Setting all empty/null roles to "employee"...\n');
        
        const [result] = await pool.query(
            `UPDATE users SET role = 'employee' WHERE role IS NULL OR role = '' OR role = ' '`
        );
        
        console.log(`✅ Updated ${result.affectedRows} users to "employee" role\n`);
        
        // Verify
        const [verify] = await pool.query(
            `SELECT u.role, COUNT(*) as count
             FROM users u
             GROUP BY u.role
             ORDER BY count DESC`
        );
        
        console.log('📊 Final role distribution:\n');
        verify.forEach(stat => {
            console.log(`   ${stat.role || '(empty)'}: ${stat.count} user(s)`);
        });
        
        console.log('\n✅ Fix complete!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
