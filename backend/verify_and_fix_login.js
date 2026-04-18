const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function verifyAndFixLogin() {
    console.log('\n========================================');
    console.log('🔍 LOGIN SYSTEM VERIFICATION');
    console.log('========================================\n');

    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });
        
        console.log('✅ Connected to database\n');

        // Check admin user
        console.log('1️⃣  Checking admin user...');
        const [users] = await connection.query(
            'SELECT id, name, email, role, is_active, is_approved FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );

        if (users.length === 0) {
            console.log('❌ Admin user not found! Creating...');
            
            // Create admin user
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query(
                `INSERT INTO users (name, email, password, role, is_active, is_approved) 
                 VALUES ('Admin User', 'admin@khazabilkis.com', ?, 'admin', TRUE, TRUE)`,
                [hashedPassword]
            );
            console.log('✅ Admin user created!\n');
        } else {
            const admin = users[0];
            console.log('✅ Admin user found:');
            console.log(`   - Name: ${admin.name}`);
            console.log(`   - Email: ${admin.email}`);
            console.log(`   - Role: ${admin.role}`);
            console.log(`   - Active: ${admin.is_active ? 'Yes ✓' : 'No ✗'}`);
            console.log(`   - Approved: ${admin.is_approved ? 'Yes ✓' : 'No ✗'}\n`);

            // Fix if not active or approved
            if (!admin.is_active || !admin.is_approved) {
                console.log('🔧 Fixing admin status...');
                await connection.query(
                    'UPDATE users SET is_active = TRUE, is_approved = TRUE WHERE email = ?',
                    ['admin@khazabilkis.com']
                );
                console.log('✅ Admin status fixed!\n');
            }
        }

        // Verify password
        console.log('2️⃣  Verifying admin password...');
        const [passwordCheck] = await connection.query(
            'SELECT password FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );
        
        const isMatch = await bcrypt.compare('admin123', passwordCheck[0].password);
        if (isMatch) {
            console.log('✅ Password is correct: admin123\n');
        } else {
            console.log('⚠️  Password is incorrect! Resetting to admin123...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, 'admin@khazabilkis.com']
            );
            console.log('✅ Password reset to: admin123\n');
        }

        // Check all users
        console.log('3️⃣  All users in database:');
        const [allUsers] = await connection.query(
            'SELECT id, name, email, role, is_active, is_approved FROM users ORDER BY id'
        );
        
        allUsers.forEach(user => {
            const status = user.is_approved ? (user.is_active ? '✅ Active' : '❌ Inactive') : '⏳ Pending';
            console.log(`   ${user.id}. ${user.name} (${user.email}) - ${user.role} - ${status}`);
        });
        console.log('');

        // Test login query
        console.log('4️⃣  Testing login query...');
        const [testLogin] = await connection.query(
            'SELECT * FROM users WHERE email = ? AND is_active = TRUE AND is_approved = TRUE',
            ['admin@khazabilkis.com']
        );
        
        if (testLogin.length > 0) {
            console.log('✅ Login query will succeed\n');
        } else {
            console.log('❌ Login query will fail! User not active/approved\n');
        }

        console.log('========================================');
        console.log('✅ VERIFICATION COMPLETE');
        console.log('========================================');
        console.log('\n📝 Login Credentials:');
        console.log('   Email: admin@khazabilkis.com');
        console.log('   Password: admin123\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verifyAndFixLogin();
