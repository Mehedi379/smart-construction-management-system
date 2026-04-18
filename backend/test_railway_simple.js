const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('\n=== Testing Railway MySQL Connection ===\n');
    
    const configs = [
        {
            name: 'Config 1: Public Proxy',
            host: 'roundhouse.proxy.rlwy.net',
            port: 17140,
            user: 'root',
            password: 'AcbXX3KgvqD7B8Y4WjCu6yNx1Prfu5cNHz',
            database: 'railway'
        },
        {
            name: 'Config 2: Without Database',
            host: 'roundhouse.proxy.rlwy.net',
            port: 17140,
            user: 'root',
            password: 'AcbXX3KgvqD7B8Y4WjCu6yNx1Prfu5cNHz'
        }
    ];

    for (const config of configs) {
        console.log(`\nTesting: ${config.name}`);
        console.log(`Host: ${config.host}:${config.port}`);
        console.log(`User: ${config.user}`);
        console.log(`Database: ${config.database || '(none)'}\n`);
        
        let connection;
        try {
            connection = await mysql.createConnection({
                host: config.host,
                port: config.port,
                user: config.user,
                password: config.password,
                database: config.database,
                connectTimeout: 10000
            });
            
            console.log('✅ CONNECTION SUCCESSFUL!');
            
            const [result] = await connection.query('SELECT 1 as test');
            console.log('✅ Query test passed');
            
            if (config.database) {
                const [tables] = await connection.query('SHOW TABLES');
                console.log(`✅ Tables found: ${tables.length}`);
            }
            
            await connection.end();
            console.log('✅ Connection closed\n');
            
            // If successful, stop testing
            return;
            
        } catch (error) {
            console.log(`❌ FAILED: ${error.message}\n`);
        }
    }
    
    console.log('\n=== All connection attempts failed ===');
    console.log('\nPossible solutions:');
    console.log('1. Verify the password in Railway Variables tab');
    console.log('2. Check if MySQL service is running (green status)');
    console.log('3. Railway MySQL may only allow connections from within Railway network');
    console.log('4. Try deploying your backend to Railway to connect internally');
}

testConnection();
