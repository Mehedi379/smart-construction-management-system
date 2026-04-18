const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixUserRoles() {
    console.log('\n🔧 FIXING USER ROLES...\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        // Get all users with their requested_role
        console.log('📋 Checking all users:');
        const [users] = await connection.query(
            `SELECT id, email, name, role, requested_role 
             FROM users 
             ORDER BY id ASC`
        );
        
        console.table(users);
        console.log('');

        let fixedCount = 0;

        // Fix each user's role
        for (const user of users) {
            let correctRole = user.role;

            // Determine correct role based on requested_role or email pattern
            if (user.email.includes('admin')) {
                correctRole = 'admin';
            } else if (user.requested_role === 'accountant' || user.email.includes('accountant')) {
                correctRole = 'accountant';
            } else if (user.requested_role === 'engineer' || user.email.includes('engineer')) {
                correctRole = 'engineer';
            } else if (user.requested_role === 'viewer') {
                correctRole = 'viewer';
            } else if (user.role === 'employee') {
                // 'employee' is not a valid role, need to fix
                // Check if they have any hints
                if (user.name.toLowerCase().includes('account')) {
                    correctRole = 'accountant';
                } else if (user.name.toLowerCase().includes('engineer')) {
                    correctRole = 'engineer';
                } else {
                    // Default to viewer for unknown employees
                    correctRole = 'viewer';
                }
            }

            // Update if role is wrong
            if (user.role !== correctRole) {
                console.log(`🔧 Updating ${user.email}: ${user.role} → ${correctRole}`);
                
                await connection.query(
                    'UPDATE users SET role = ? WHERE id = ?',
                    [correctRole, user.id]
                );
                
                fixedCount++;
            }
        }

        console.log('\n========================================');
        console.log(`✅ FIXED ${fixedCount} USER ROLE(S)`);
        console.log('========================================\n');

        // Show updated users
        console.log('📋 Updated users:');
        const [updatedUsers] = await connection.query(
            'SELECT id, email, name, role FROM users ORDER BY id ASC'
        );
        console.table(updatedUsers);
        console.log('');

        console.log('🚀 Next Steps:');
        console.log('   1. Logout from current session');
        console.log('   2. Login again with correct account');
        console.log('   3. Should now see correct role dashboard');
        console.log('');

        console.log('📝 Role Summary:');
        console.log('   - admin@khazabilkis.com → Admin 👑');
        console.log('   - accountant@khazabilkis.com → Accountant 👨‍💼');
        console.log('   - hassanmehedi379@gmail.com → Accountant 👨‍💼');
        console.log('   - hassanmehedi@gmail.com → Engineer 👷');
        console.log('   - Others → Viewer 👀\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) await connection.end();
    }
}

fixUserRoles();
