const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function createAdminUser() {
    const password = 'admin123';
    const hashedPassword = bcrypt.hashSync(password, 10);

    console.log('Generated bcrypt hash for "admin123":');
    console.log(hashedPassword);
    console.log('');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('Connected to database...');

        // Check if admin already exists
        const [existing] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );

        if (existing.length > 0) {
            console.log('Admin user already exists. Updating password...');
            await connection.query(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, 'admin@khazabilkis.com']
            );
        } else {
            console.log('Creating admin user...');
            await connection.query(
                `INSERT INTO users (name, email, password, role, phone, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Admin User', 'admin@khazabilkis.com', hashedPassword, 'admin', '01700000000', true]
            );
        }

        console.log('');
        console.log('========================================');
        console.log('✓ Admin user created successfully!');
        console.log('========================================');
        console.log('');
        console.log('Login Credentials:');
        console.log('Email: admin@khazabilkis.com');
        console.log('Password: admin123');
        console.log('');

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
        console.log('');
        console.log('Make sure:');
        console.log('1. MySQL is running');
        console.log('2. Database "construction_db" exists');
        console.log('3. Backend .env file has correct DB credentials');
        process.exit(1);
    }
}

createAdminUser();
