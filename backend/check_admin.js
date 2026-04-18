const pool = require('./src/config/database');

async function checkAdmin() {
    try {
        const [users] = await pool.query(
            'SELECT id, name, email, role, is_approved, is_active FROM users WHERE role = "admin"'
        );
        
        console.log('\n=== ADMIN USERS ===\n');
        console.log('Found:', users.length, 'admin(s)\n');
        
        users.forEach(u => {
            console.log('ID:', u.id);
            console.log('Name:', u.name);
            console.log('Email:', u.email);
            console.log('Role:', u.role);
            console.log('Approved:', u.is_approved);
            console.log('Active:', u.is_active);
            console.log('---');
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkAdmin();
