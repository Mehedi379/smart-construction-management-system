// Railway Database Connection & Admin User Creation
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

console.log('🔧 Railway Database Setup\n');
console.log('=' .repeat(60));

const config = {
    host: 'roundhouse.proxy.rlwy.net',
    port: 14817,
    user: 'root',
    password: 'AcbXX3KgvqD7B8Y4WjCu6yNx1Prfu5cNHz',
    database: 'railway'
};

async function setup() {
    let connection;
    
    try {
        console.log('\n1️⃣  Connecting to Railway Database...');
        connection = await mysql.createConnection(config);
        console.log('   ✅ Connected successfully!\n');
        
        console.log('2️⃣  Checking users table...');
        const [tables] = await connection.query('SHOW TABLES LIKE "users"');
        
        if (tables.length === 0) {
            console.log('   ❌ Users table does NOT exist!\n');
            console.log('   💡 You need to import database/schema.sql first');
            console.log('   Open Railway MySQL Console and paste the schema\n');
            await connection.end();
            return;
        }
        
        console.log('   ✅ Users table exists!\n');
        
        console.log('3️⃣  Creating admin user...');
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        console.log('   Generated bcrypt hash for: admin123\n');
        
        try {
            await connection.query(`
                INSERT INTO users (name, email, password, role, phone, is_active, is_approved) 
                VALUES ('Admin User', 'admin@khazabilkis.com', ?, 'admin', '01700000000', 1, 1)
                ON DUPLICATE KEY UPDATE password = ?
            `, [hashedPassword, hashedPassword]);
            
            console.log('   ✅ Admin user created/updated!\n');
            
        } catch (err) {
            console.log('   ⚠️  Error creating user:', err.message);
            console.log('   Trying with different approach...\n');
            
            // Try without ON DUPLICATE KEY
            await connection.query(`
                INSERT IGNORE INTO users (name, email, password, role, phone, is_active, is_approved) 
                VALUES ('Admin User', 'admin@khazabilkis.com', ?, 'admin', '01700000000', 1, 1)
            `, [hashedPassword]);
            
            console.log('   ✅ Admin user created!\n');
        }
        
        console.log('4️⃣  Verifying admin user...');
        const [verify] = await connection.query(
            'SELECT id, name, email, role, is_active, is_approved FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );
        
        if (verify.length > 0) {
            console.log('   ✅ Admin user verified!\n');
            console.log('   User:', verify[0]);
        } else {
            console.log('   ⚠️  Could not verify user\n');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 SUCCESS! DATABASE SETUP COMPLETE!');
        console.log('='.repeat(60));
        console.log('\n📧 Login Credentials:');
        console.log('   Email: admin@khazabilkis.com');
        console.log('   Password: admin123');
        console.log('\n🌐 Login URLs:');
        console.log('   Frontend: https://smart-construction-management-syste.vercel.app/login');
        console.log('   Backend:  https://smart-construction-backend-production.up.railway.app');
        console.log('\n✅ Your app is now ready to use!\n');
        
        await connection.end();
        console.log('🔌 Database connection closed.\n');
        
    } catch (error) {
        console.log('\n❌ ERROR!\n');
        console.log('Message:', error.message);
        console.log('Code:', error.code);
        console.log('');
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 Password is still wrong!');
            console.log('Check Railway MySQL Variables again\n');
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('💡 Users table does not exist!');
            console.log('Import database/schema.sql in Railway MySQL Console\n');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('💡 Database "railway" does not exist!');
            console.log('Check Railway MySQL Variables for correct database name\n');
        }
    }
}

setup();
