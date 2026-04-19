// Test Railway Database Connection using MYSQL_URL
const mysql = require('mysql2/promise');

console.log('🔍 Testing Railway Database Connection...\n');

// Try multiple connection methods
async function testAllMethods() {
    
    // Method 1: Parse from MYSQL_URL format
    console.log('Method 1: Using individual variables');
    console.log('=====================================\n');
    
    const configs = [
        {
            name: 'Config 1: Standard DB variables',
            host: 'roundhouse.proxy.rlwy.net',
            port: 14817,
            user: 'root',
            password: 'AcbXX3KgvqD7B8Y4WjCu6yNx1Prfu5cNHz',
            database: 'railway'
        },
        {
            name: 'Config 2: Using internal host',
            host: 'mysql.railway.internal',
            port: 3306,
            user: 'root',
            password: 'AcbXX3KgvqD7B8Y4WjCu6yNx1Prfu5cNHz',
            database: 'railway'
        }
    ];
    
    for (const config of configs) {
        console.log(`\nTesting: ${config.name}`);
        console.log(`Host: ${config.host}`);
        console.log(`Port: ${config.port}`);
        console.log(`User: ${config.user}`);
        console.log(`Password length: ${config.password.length}\n`);
        
        try {
            const connection = await mysql.createConnection(config);
            console.log('✅ CONNECTION SUCCESSFUL!\n');
            
            // Test query
            const [rows] = await connection.query('SHOW TABLES');
            console.log('Tables in database:', rows.length);
            
            // Check if users table exists
            const [users] = await connection.query('SHOW TABLES LIKE "users"');
            if (users.length > 0) {
                console.log('✅ Users table exists!\n');
                
                // Create admin user
                const bcrypt = require('bcryptjs');
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                
                console.log('Creating admin user...\n');
                
                try {
                    await connection.query(`
                        INSERT INTO users (name, email, password, role, phone, is_active, is_approved) 
                        VALUES ('Admin User', 'admin@khazabilkis.com', ?, 'admin', '01700000000', 1, 1)
                        ON DUPLICATE KEY UPDATE password = ?
                    `, [hashedPassword, hashedPassword]);
                    
                    console.log('✅ Admin user created/updated!\n');
                    
                    // Verify
                    const [verify] = await connection.query(
                        'SELECT id, name, email, role FROM users WHERE email = ?',
                        ['admin@khazabilkis.com']
                    );
                    
                    console.log('✅ Admin user verified:', verify[0]);
                    
                } catch (err) {
                    console.log('⚠️ Error creating user:', err.message);
                }
            } else {
                console.log('❌ Users table does NOT exist!');
                console.log('You need to import database/schema.sql first\n');
            }
            
            await connection.end();
            console.log('\n🔌 Connection closed.\n');
            console.log('='.repeat(60));
            console.log('🎉 SUCCESS! Database is working!\n');
            return;
            
        } catch (error) {
            console.log('❌ FAILED!');
            console.log('Error:', error.message);
            console.log('Error code:', error.code);
            console.log('\n');
        }
    }
    
    console.log('='.repeat(60));
    console.log('❌ ALL METHODS FAILED!\n');
    console.log('💡 NEXT STEPS:\n');
    console.log('1. Open Railway Dashboard');
    console.log('2. Go to MySQL Service → Connect → MySQL CLI');
    console.log('3. Run this command to reset password:');
    console.log('   ALTER USER "root"@"%" IDENTIFIED BY "AcbXX3KgvqD7B8Y4WjCu6yNx1Prfu5cNHz";');
    console.log('   FLUSH PRIVILEGES;');
    console.log('\n4. Or check the exact password in MySQL Service → Variables\n');
}

testAllMethods();
