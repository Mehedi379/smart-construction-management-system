// Fix Admin User for Railway Deployment
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixAdminUser() {
    console.log('🔧 Fixing admin user for Railway database...\n');

    // Railway database configuration
    const config = {
        host: process.env.DB_HOST || 'mysql.railway.internal',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'railway',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

    console.log('📊 Database Configuration:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Password: ${config.password ? 'Set' : 'NOT SET'}\n`);

    if (!config.password) {
        console.error('❌ ERROR: DB_PASSWORD environment variable is not set!');
        console.error('Please set the DB_PASSWORD in your Railway environment variables.');
        process.exit(1);
    }

    let connection;

    try {
        // Connect to database
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(config);
        console.log('✅ Connected to database\n');

        // Generate proper password hash for 'admin123'
        const plainPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        
        console.log('🔐 Generated new password hash for: admin123');
        console.log(`   Hash: ${hashedPassword.substring(0, 20)}...\n`);

        // Check if admin user exists
        const [existingUsers] = await connection.query(
            'SELECT id, name, email, role FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );

        if (existingUsers.length > 0) {
            // Update existing admin user with new password
            console.log('📝 Admin user exists. Updating password...\n');
            
            await connection.query(
                `UPDATE users 
                 SET password = ?, 
                     role = 'admin', 
                     is_active = 1, 
                     is_approved = 1 
                 WHERE email = ?`,
                [hashedPassword, 'admin@khazabilkis.com']
            );
            
            console.log('✅ Admin user updated successfully!\n');
        } else {
            // Create new admin user
            console.log('📝 Admin user does not exist. Creating...\n');
            
            await connection.query(
                `INSERT INTO users (name, email, password, role, phone, is_active, is_approved) 
                 VALUES (?, ?, ?, 'admin', '01700000000', 1, 1)`,
                ['Admin User', 'admin@khazabilkis.com', hashedPassword]
            );
            
            console.log('✅ Admin user created successfully!\n');
        }

        // Verify the user
        const [verifyUser] = await connection.query(
            'SELECT id, name, email, role, is_active, is_approved FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );

        if (verifyUser.length > 0) {
            console.log('✅ Admin User Details:');
            console.log(`   ID: ${verifyUser[0].id}`);
            console.log(`   Name: ${verifyUser[0].name}`);
            console.log(`   Email: ${verifyUser[0].email}`);
            console.log(`   Role: ${verifyUser[0].role}`);
            console.log(`   Active: ${verifyUser[0].is_active}`);
            console.log(`   Approved: ${verifyUser[0].is_approved}\n`);
        }

        console.log('═══════════════════════════════════════════');
        console.log('✅ ADMIN USER IS READY!');
        console.log('═══════════════════════════════════════════');
        console.log('📧 Email: admin@khazabilkis.com');
        console.log('🔑 Password: admin123');
        console.log('═══════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed.');
        }
    }
}

// Run the script
fixAdminUser();
