const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAndFixAdmin() {
    console.log('\n🔍 CHECKING ADMIN ACCOUNT...\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        // Check all users
        console.log('📋 All users in database:');
        const [allUsers] = await connection.query(
            'SELECT id, email, name, role FROM users ORDER BY id ASC'
        );
        
        console.table(allUsers);
        console.log('');

        // Find admin users
        console.log('👑 Looking for admin users:');
        const [admins] = await connection.query(
            'SELECT id, email, name, role FROM users WHERE role = "admin"'
        );

        if (admins.length === 0) {
            console.log('❌ No admin users found!\n');
            
            // Check if there are any users
            if (allUsers.length > 0) {
                console.log('📝 Available users to promote to admin:');
                console.table(allUsers);
                console.log('');
                
                // Promote first user to admin
                const firstUser = allUsers[0];
                console.log(`🔧 Promoting ${firstUser.email} to admin...`);
                
                await connection.query(
                    'UPDATE users SET role = "admin" WHERE id = ?',
                    [firstUser.id]
                );
                
                console.log(`✅ ${firstUser.email} is now admin!\n`);
                
                // Verify
                const [updatedUser] = await connection.query(
                    'SELECT id, email, name, role FROM users WHERE id = ?',
                    [firstUser.id]
                );
                
                console.log('✅ Updated user:');
                console.table(updatedUser);
                
            } else {
                console.log('❌ No users in database!');
                console.log('📝 Please register a new user first.\n');
            }
        } else {
            console.log(`✅ Found ${admins.length} admin user(s):\n`);
            console.table(admins);
            console.log('');
            
            // Check if admin has employee record
            const adminId = admins[0].id;
            const [empRecords] = await connection.query(
                'SELECT * FROM employees WHERE user_id = ?',
                [adminId]
            );
            
            if (empRecords.length > 0) {
                console.log('⚠️  WARNING: Admin has employee record!');
                console.log('   This might cause login issues.\n');
                console.log('   Employee record:');
                console.table(empRecords);
                console.log('');
                
                console.log('🔧 Removing employee record for admin...');
                await connection.query(
                    'DELETE FROM employees WHERE user_id = ?',
                    [adminId]
                );
                console.log('✅ Employee record removed!\n');
            } else {
                console.log('✅ Admin does NOT have employee record (correct!)\n');
            }
        }

        console.log('========================================');
        console.log('✅ ADMIN CHECK COMPLETE');
        console.log('========================================\n');

        console.log('🚀 Next Steps:');
        console.log('   1. Try logging in with admin account');
        console.log('   2. Should see admin dashboard');
        console.log('   3. Should be able to create projects');
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) await connection.end();
    }
}

checkAndFixAdmin();
