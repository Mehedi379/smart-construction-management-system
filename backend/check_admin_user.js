// Check admin user in database
const pool = require('./src/config/database');

async function checkAdmin() {
    try {
        console.log('Checking admin user...\n');
        
        // First, check what columns exist
        const [columns] = await pool.query(
            "SHOW COLUMNS FROM users"
        );
        
        console.log('Users table columns:');
        columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
        
        // Now query admin users
        const [users] = await pool.query(
            "SELECT id, name, email, role FROM users WHERE role = 'admin' OR email LIKE '%admin%'"
        );
        
        console.log('\nAdmin users found:', users.length);
        console.log(JSON.stringify(users, null, 2));
        
        if (users.length === 0) {
            console.log('\n❌ No admin user found!');
            console.log('Creating admin user...');
            
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            
            const [result] = await pool.query(
                `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
                ['Admin User', 'admin@construction.com', hashedPassword, 'admin']
            );
            
            console.log('✅ Admin user created with ID:', result.insertId);
            console.log('Email: admin@construction.com');
            console.log('Password: Admin@123');
        } else {
            console.log('\n✅ Admin user exists');
            console.log('\nTo reset password, run:');
            console.log('node -e "const pool=require(\'./src/config/database\'); const bcrypt=require(\'bcryptjs\'); (async()=>{ const p=await bcrypt.hash(\'Admin@123\',10); await pool.query(\'UPDATE users SET password=? WHERE email=?\', [p, \'admin@construction.com\']); console.log(\'Password reset!\'); process.exit(0); })()"');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkAdmin();
