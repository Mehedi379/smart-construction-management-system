const mysql = require('mysql2/promise');

async function testDirectConnection() {
    console.log('🔍 Testing Direct MySQL Connection...\n');
    
    const config = {
        host: 'roundhouse.proxy.rlwy.net',
        port: 14817,
        user: 'root',
        password: 'AcbXX3KgvqD7B8Y4WjCu6yNx1Prfu5cNHz',
        database: 'railway'
    };
    
    console.log('Connection Details:');
    console.log('  Host:', config.host);
    console.log('  Port:', config.port);
    console.log('  User:', config.user);
    console.log('  Password:', config.password.substring(0, 10) + '...');
    console.log('  Database:', config.database);
    console.log('');
    
    try {
        console.log('Attempting connection...');
        const connection = await mysql.createConnection(config);
        console.log('✅ Connection successful!\n');
        
        // Check if users table exists
        const [tables] = await connection.query('SHOW TABLES LIKE "users"');
        if (tables.length > 0) {
            console.log('✅ Users table exists\n');
            
            // Check admin user
            const [users] = await connection.query(
                'SELECT id, name, email, role, is_approved, is_active FROM users WHERE email = ?',
                ['admin@khazabilkis.com']
            );
            
            if (users.length > 0) {
                console.log('✅ Admin user found:');
                console.log(users[0]);
            } else {
                console.log('❌ Admin user NOT found!');
                console.log('Need to create admin user.');
            }
        } else {
            console.log('❌ Users table does NOT exist!');
            console.log('Need to run database/schema.sql');
        }
        
        await connection.end();
        
    } catch (error) {
        console.log('❌ Connection failed!');
        console.log('Error:', error.message);
        console.log('Error Code:', error.code);
        console.log('');
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('DIAGNOSIS: Password is wrong or user has no access');
            console.log('Check if password has extra spaces');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('DIAGNOSIS: Cannot reach database server');
            console.log('Check host and port');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('DIAGNOSIS: Database "railway" does not exist');
        }
    }
}

testDirectConnection();
