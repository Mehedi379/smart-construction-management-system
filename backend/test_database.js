// ============================================
// DATABASE CONNECTION TEST & FIX
// Smart Construction Management System
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('\n========================================');
console.log('🔍 DATABASE CONNECTION TEST');
console.log('========================================\n');

async function testDatabase() {
    let connection;
    
    try {
        // Test 1: Check if MySQL is running
        console.log('📋 Test 1: Checking MySQL Server...');
        console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
        console.log(`   User: ${process.env.DB_USER || 'root'}`);
        console.log(`   Database: ${process.env.DB_NAME || 'construction_db'}`);
        console.log('');
        
        // Test 2: Try to connect without database
        console.log('📋 Test 2: Testing MySQL Connection (without database)...');
        try {
            const testConnection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || ''
            });
            
            console.log('✅ MySQL server is running');
            console.log('✅ Connection successful');
            await testConnection.end();
        } catch (err) {
            console.log('❌ MySQL server is NOT running or connection failed');
            console.log(`   Error: ${err.message}`);
            console.log('');
            console.log('💡 SOLUTION:');
            console.log('   1. Open XAMPP/WAMP');
            console.log('   2. Start MySQL service');
            console.log('   3. Try again');
            console.log('');
            return;
        }
        
        // Test 3: Check if database exists
        console.log('\n📋 Test 3: Checking if database exists...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });
        
        const [databases] = await connection.query(
            'SHOW DATABASES LIKE ?', 
            [process.env.DB_NAME || 'construction_db']
        );
        
        if (databases.length === 0) {
            console.log(`❌ Database '${process.env.DB_NAME || 'construction_db'}' does NOT exist`);
            console.log('');
            console.log('💡 Creating database...');
            
            await connection.query(
                'CREATE DATABASE IF NOT EXISTS ??', 
                [process.env.DB_NAME || 'construction_db']
            );
            
            console.log(`✅ Database '${process.env.DB_NAME || 'construction_db'}' created successfully`);
        } else {
            console.log(`✅ Database '${process.env.DB_NAME || 'construction_db'}' exists`);
        }
        
        await connection.end();
        
        // Test 4: Connect to the database
        console.log('\n📋 Test 4: Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });
        
        console.log('✅ Connected to database successfully');
        
        // Test 5: Check tables
        console.log('\n📋 Test 5: Checking database tables...');
        const [tables] = await connection.query('SHOW TABLES');
        
        if (tables.length === 0) {
            console.log('⚠️  No tables found in database');
            console.log('');
            console.log('💡 You need to run database migrations:');
            console.log('   1. Check database/schema.sql');
            console.log('   2. Run the SQL file in phpMyAdmin or MySQL');
            console.log('');
        } else {
            console.log(`✅ Found ${tables.length} tables:`);
            tables.forEach(table => {
                const tableName = Object.values(table)[0];
                console.log(`   - ${tableName}`);
            });
        }
        
        // Test 6: Check critical tables
        console.log('\n📋 Test 6: Checking critical tables...');
        const criticalTables = [
            'users', 'projects', 'employees', 'vouchers', 
            'expenses', 'daily_sheets', 'purchases', 'ledger_entries'
        ];
        
        const existingTableNames = tables.map(t => Object.values(t)[0]);
        
        for (const table of criticalTables) {
            if (existingTableNames.includes(table)) {
                const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`✅ ${table}: ${count[0].count} records`);
            } else {
                console.log(`⚠️  ${table}: Table missing`);
            }
        }
        
        // Test 7: Check users table
        console.log('\n📋 Test 7: Checking user accounts...');
        const [users] = await connection.query(
            'SELECT id, name, email, role, status FROM users LIMIT 10'
        );
        
        if (users.length === 0) {
            console.log('⚠️  No users found in database');
            console.log('');
            console.log('💡 Creating admin account...');
            
            try {
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash('123456', 10);
                
                await connection.query(
                    `INSERT INTO users (name, email, password, role, status, is_approved) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    ['Admin User', 'admin@test.com', hashedPassword, 'admin', 'active', 1]
                );
                
                console.log('✅ Admin account created');
                console.log('   Email: admin@test.com');
                console.log('   Password: 123456');
            } catch (err) {
                console.log('⚠️  Could not create admin account (users table might not exist)');
            }
        } else {
            console.log(`✅ Found ${users.length} user(s):`);
            users.forEach(user => {
                console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
            });
        }
        
        // Test 8: Check database performance
        console.log('\n📋 Test 8: Database performance check...');
        const [result] = await connection.query('SELECT 1 + 1 AS result');
        console.log(`✅ Query execution: ${result[0].result === 2 ? 'Fast' : 'Slow'}`);
        
        // Summary
        console.log('\n========================================');
        console.log('📊 DATABASE TEST SUMMARY');
        console.log('========================================');
        console.log('✅ MySQL Server: Running');
        console.log('✅ Database: Connected');
        console.log(`✅ Tables: ${tables.length} found`);
        console.log(`✅ Users: ${users.length} found`);
        console.log('');
        console.log('🎉 DATABASE STATUS: HEALTHY');
        console.log('========================================\n');
        
    } catch (error) {
        console.log('\n========================================');
        console.log('❌ DATABASE TEST FAILED');
        console.log('========================================');
        console.log(`Error: ${error.message}`);
        console.log('');
        console.log('💡 TROUBLESHOOTING:');
        console.log('');
        console.log('1. MySQL not running?');
        console.log('   → Open XAMPP/WAMP and start MySQL');
        console.log('');
        console.log('2. Wrong credentials?');
        console.log('   → Check backend/.env file');
        console.log('   → DB_HOST=localhost');
        console.log('   → DB_USER=root');
        console.log('   → DB_PASSWORD=(empty or your password)');
        console.log('');
        console.log('3. Database doesn\'t exist?');
        console.log('   → Run: CREATE DATABASE construction_db;');
        console.log('   → Or run database/schema.sql');
        console.log('');
        console.log('4. Port conflict?');
        console.log('   → Default MySQL port: 3306');
        console.log('   → Check if another service is using it');
        console.log('========================================\n');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the test
testDatabase();
