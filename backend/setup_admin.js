const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupAdmin() {
    console.log('========================================');
    console.log('Admin User Setup');
    console.log('========================================\n');

    // Admin credentials
    const adminEmail = 'admin@khazabilkis.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin User';
    const adminPhone = '01700000000';

    try {
        // Generate bcrypt hash
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        console.log('✓ Password hashed successfully\n');

        // Connect to database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✓ Connected to database\n');

        // Check if admin already exists
        const [existingUsers] = await connection.query(
            'SELECT id, email FROM users WHERE email = ?',
            [adminEmail]
        );

        if (existingUsers.length > 0) {
            console.log('⚠ Admin user already exists!');
            console.log('Updating password...\n');

            // Update existing admin
            await connection.query(
                'UPDATE users SET password = ?, is_active = 1, is_approved = 1, role = "admin" WHERE email = ?',
                [hashedPassword, adminEmail]
            );

            console.log('✓ Admin password updated\n');
            console.log('Admin ID:', existingUsers[0].id);
        } else {
            // Create new admin
            const [result] = await connection.query(
                `INSERT INTO users (name, email, password, role, phone, is_active, is_approved, status) 
                 VALUES (?, ?, ?, 'admin', ?, 1, 1, 'active')`,
                [adminName, adminEmail, hashedPassword, adminPhone]
            );

            console.log('✓ Admin user created successfully\n');
            console.log('Admin ID:', result.insertId);
        }

        // Verify admin exists
        const [adminUsers] = await connection.query(
            'SELECT id, name, email, role, is_active, is_approved FROM users WHERE email = ?',
            [adminEmail]
        );

        console.log('\n========================================');
        console.log('ADMIN CREDENTIALS');
        console.log('========================================');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        console.log('========================================\n');

        console.log('Admin User Details:');
        console.log(JSON.stringify(adminUsers[0], null, 2));

        await connection.end();
        console.log('\n✓ Database connection closed');
        console.log('\n✅ Setup Complete! You can now login with the credentials above.\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Make sure:');
        console.error('1. Database is running');
        console.error('2. Backend .env file is configured correctly');
        console.error('3. Required tables exist in database\n');
        process.exit(1);
    }
}

setupAdmin();
