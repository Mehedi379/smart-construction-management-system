const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function setup() {
    console.log('\n========================================');
    console.log('Smart Construction Management System');
    console.log('Database Setup');
    console.log('========================================\n');

    const password = await new Promise((resolve) => {
        rl.question('Enter MySQL root password (press Enter if no password): ', (answer) => {
            resolve(answer);
        });
    });

    rl.close();

    console.log('\nConnecting to MySQL...');

    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: password || '',
        });

        console.log('✓ Connected to MySQL\n');

        // Create database
        console.log('Creating database...');
        await connection.query('CREATE DATABASE IF NOT EXISTS construction_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('✓ Database created\n');

        // Use database
        await connection.query('USE construction_db');

        // Run schema
        console.log('Creating tables...');
        const fs = require('fs');
        const path = require('path');
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        
        // Split and execute statements
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.toUpperCase().includes('CREATE TABLE') || 
                statement.toUpperCase().includes('INSERT')) {
                try {
                    await connection.query(statement);
                } catch (err) {
                    // Ignore errors for existing tables
                }
            }
        }
        console.log('✓ Tables created\n');

        // Create admin user
        console.log('Creating admin user...');
        const adminPassword = 'admin123';
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);

        // Check if admin exists
        const [existing] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );

        if (existing.length > 0) {
            await connection.query(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, 'admin@khazabilkis.com']
            );
            console.log('✓ Admin user updated\n');
        } else {
            await connection.query(
                `INSERT INTO users (name, email, password, role, phone, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Admin User', 'admin@khazabilkis.com', hashedPassword, 'admin', '01700000000', 1]
            );
            console.log('✓ Admin user created\n');
        }

        // Update .env file
        console.log('Updating backend configuration...');
        const envPath = path.join(__dirname, '..', 'backend', '.env');
        const envContent = `# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=${password || ''}
DB_NAME=construction_db

# Server Configuration
PORT=9000
NODE_ENV=development

# JWT Secret
JWT_SECRET=smart_construction_secret_key_2026_change_in_production
JWT_EXPIRE=7d

# Upload Settings
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
`;
        fs.writeFileSync(envPath, envContent);
        console.log('✓ Backend configuration updated\n');

        console.log('========================================');
        console.log('✓ Setup Complete!');
        console.log('========================================\n');
        console.log('Login Credentials:');
        console.log('Email: admin@khazabilkis.com');
        console.log('Password: admin123\n');
        console.log('Next step: Start the backend server');
        
        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        
        if (error.message.includes('access denied')) {
            console.log('\nWrong password! Please try again with the correct MySQL root password.');
            console.log('Common passwords: root, password, admin, 1234');
        }
        
        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
}

setup();
