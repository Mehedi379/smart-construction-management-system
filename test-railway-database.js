// Test Railway Database Connection and Admin User
// Run this to diagnose the login issue

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

console.log('🔍 Testing Railway Database Connection...\n');

// Railway database configuration
// ⚠️ IMPORTANT: Update these with your actual Railway credentials!
const config = {
    host: 'roundhouse.proxy.rlwy.net',
    port: 17140,
    user: 'root',
    password: 'AcbXX3KgvqD7B8Y4WjCu6yNx1Prfu5cNHz', // Replace with your actual password
    database: 'railway'
};

async function testDatabase() {
    let connection;
    
    try {
        // Test 1: Connect to database
        console.log('Test 1: Connecting to Railway Database...');
        console.log(`   Host: ${config.host}`);
        console.log(`   Port: ${config.port}`);
        console.log(`   User: ${config.user}`);
        console.log(`   Database: ${config.database}`);
        console.log('');
        
        connection = await mysql.createConnection(config);
        console.log('✅ Database connection successful!\n');
        console.log('='.repeat(60) + '\n');

        // Test 2: Check if users table exists
        console.log('Test 2: Checking if users table exists...');
        try {
            const [tables] = await connection.query(
                "SHOW TABLES LIKE 'users'"
            );
            
            if (tables.length === 0) {
                console.log('❌ users table does NOT exist!');
                console.log('   You need to run the database schema first.');
                console.log('   Run: mysql -h roundhouse.proxy.rlwy.net -P 17140 -u root -p < database/schema.sql');
                console.log('');
                console.log('='.repeat(60) + '\n');
            } else {
                console.log('✅ users table exists\n');
                console.log('='.repeat(60) + '\n');

                // Test 3: Check admin user
                console.log('Test 3: Checking admin user...');
                const [users] = await connection.query(
                    "SELECT id, name, email, role, is_active, is_approved FROM users WHERE email = ?",
                    ['admin@khazabilkis.com']
                );

                if (users.length === 0) {
                    console.log('❌ Admin user does NOT exist!\n');
                    console.log('Creating admin user...');
                    
                    // Create admin user
                    const hashedPassword = bcrypt.hashSync('admin123', 10);
                    console.log('   Generated bcrypt hash for password: admin123\n');
                    
                    await connection.query(`
                        INSERT INTO users (name, email, password, role, phone, is_active, is_approved) 
                        VALUES ('Admin User', 'admin@khazabilkis.com', ?, 'admin', '01700000000', 1, 1)
                    `, [hashedPassword]);

                    console.log('✅ Admin user created successfully!');
                    console.log('   Email: admin@khazabilkis.com');
                    console.log('   Password: admin123\n');
                } else {
                    console.log('✅ Admin user exists!');
                    console.log('   User details:', users[0]);
                    
                    // Test password
                    console.log('\nTesting password verification...');
                    const isPasswordValid = bcrypt.compareSync('admin123', users[0].password);
                    
                    if (isPasswordValid) {
                        console.log('✅ Password is correct!\n');
                    } else {
                        console.log('❌ Password is incorrect!');
                        console.log('   Updating password to: admin123\n');
                        
                        const hashedPassword = bcrypt.hashSync('admin123', 10);
                        await connection.query(
                            "UPDATE users SET password = ? WHERE email = ?",
                            [hashedPassword, 'admin@khazabilkis.com']
                        );
                        console.log('✅ Password updated!\n');
                    }
                }

                console.log('='.repeat(60) + '\n');

                // Test 4: Check all users
                console.log('Test 4: All users in database...');
                const [allUsers] = await connection.query(
                    "SELECT id, name, email, role, is_active, is_approved FROM users"
                );
                
                console.log(`   Total users: ${allUsers.length}\n`);
                allUsers.forEach(user => {
                    console.log(`   ${user.id}. ${user.name} (${user.email})`);
                    console.log(`      Role: ${user.role}`);
                    console.log(`      Active: ${user.is_active ? 'YES' : 'NO'}`);
                    console.log(`      Approved: ${user.is_approved ? 'YES' : 'NO'}`);
                    console.log('');
                });

            }
        } catch (error) {
            console.log('❌ Error checking users table:', error.message);
            console.log('   The table structure might be different.');
        }

    } catch (error) {
        console.log('❌ Database connection failed!');
        console.log('   Error:', error.message);
        console.log('');
        console.log('💡 Possible solutions:');
        console.log('   1. Check if Railway MySQL service is running');
        console.log('   2. Verify database credentials in Railway Variables');
        console.log('   3. Check if password is correct (copy from Railway dashboard)');
        console.log('   4. Make sure environment variables are set in Railway:');
        console.log('      - DB_HOST');
        console.log('      - DB_PORT');
        console.log('      - DB_USER');
        console.log('      - DB_PASSWORD');
        console.log('      - DB_NAME');
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

testDatabase();
