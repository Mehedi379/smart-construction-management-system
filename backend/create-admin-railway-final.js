// Create Admin User in Railway Database
// Run this AFTER database connection is working

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// ⚠️ IMPORTANT: Update these with your EXACT Railway credentials
const config = {
    host: 'roundhouse.proxy.rlwy.net',
    port: 14817,
    user: 'root',  // Change if you created a new user
    password: 'AcbXX3KgvqD7B8Y4WjCu6yNx1Prfu5cNHz',  // EXACT password from Railway
    database: 'railway'
};

async function createAdminUser() {
    let connection;
    
    try {
        console.log('🔧 Connecting to Railway Database...\n');
        console.log('Host:', config.host);
        console.log('Port:', config.port);
        console.log('User:', config.user);
        console.log('Password length:', config.password.length);
        console.log('Database:', config.database);
        console.log('');
        
        connection = await mysql.createConnection(config);
        console.log('✅ Database connected successfully!\n');
        
        // Check if admin user already exists
        console.log('🔍 Checking if admin user exists...');
        const [existingUsers] = await connection.query(
            'SELECT id, name, email, role FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );
        
        if (existingUsers.length > 0) {
            console.log('✅ Admin user already exists!\n');
            console.log('User details:', existingUsers[0]);
            
            // Update password anyway
            console.log('\n🔄 Updating admin password to: admin123\n');
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            
            await connection.query(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, 'admin@khazabilkis.com']
            );
            
            console.log('✅ Password updated!\n');
        } else {
            console.log('❌ Admin user not found. Creating...\n');
            
            // Create admin user
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            
            console.log('Generated bcrypt hash for: admin123\n');
            
            await connection.query(`
                INSERT INTO users (name, email, password, role, phone, is_active, is_approved) 
                VALUES ('Admin User', 'admin@khazabilkis.com', ?, 'admin', '01700000000', 1, 1)
            `, [hashedPassword]);
            
            console.log('✅ Admin user created successfully!\n');
        }
        
        // Verify
        console.log('📋 Verifying admin user...');
        const [verifyUsers] = await connection.query(
            'SELECT id, name, email, role, is_active, is_approved FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );
        
        if (verifyUsers.length > 0) {
            console.log('✅ Admin user verified!\n');
            console.log('User details:', verifyUsers[0]);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ADMIN USER READY!');
        console.log('='.repeat(60));
        console.log('\n📧 Login Credentials:');
        console.log('   Email: admin@khazabilkis.com');
        console.log('   Password: admin123');
        console.log('\n🌐 Login URL:');
        console.log('   https://smart-construction-management-syste.vercel.app/login');
        console.log('\n');
        
    } catch (error) {
        console.log('❌ ERROR!\n');
        console.log('Error message:', error.message);
        console.log('Error code:', error.code);
        console.log('');
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 DATABASE CONNECTION FAILED!');
            console.log('');
            console.log('Possible reasons:');
            console.log('1. Password is incorrect');
            console.log('2. User does not have permission');
            console.log('3. Database does not exist');
            console.log('');
            console.log('Solutions:');
            console.log('1. Verify password in Railway MySQL Variables');
            console.log('2. Copy password EXACTLY (no spaces)');
            console.log('3. Try creating a new MySQL user');
            console.log('');
            console.log('Get password from:');
            console.log('Railway → MySQL Service → Variables → MYSQL_ROOT_PASSWORD');
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('💡 DATABASE TABLE MISSING!');
            console.log('');
            console.log('The "users" table does not exist.');
            console.log('You need to run the database schema first.');
            console.log('');
            console.log('Solution:');
            console.log('1. Open Railway MySQL Console');
            console.log('2. Copy content from: database/schema.sql');
            console.log('3. Paste and run in MySQL Console');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed.\n');
        }
    }
}

createAdminUser();
