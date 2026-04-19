const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Initialize Database Endpoint
router.post('/init-database', async (req, res) => {
    try {
        console.log('🔧 Initializing database...');
        
        const pool = require('../config/database');
        
        // Check if tables exist
        const [tables] = await pool.query('SHOW TABLES');
        
        if (tables.length > 0) {
            return res.json({
                success: false,
                message: `Database already has ${tables.length} tables. Skip initialization.`
            });
        }
        
        // Create users table
        await pool.query(`
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'employee',
                phone VARCHAR(20),
                is_active BOOLEAN DEFAULT TRUE,
                is_approved BOOLEAN DEFAULT TRUE,
                requested_role VARCHAR(50),
                last_login TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Created users table');
        
        // Create employees table
        await pool.query(`
            CREATE TABLE employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                employee_id VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                father_name VARCHAR(100),
                phone VARCHAR(20),
                email VARCHAR(100),
                address TEXT,
                nid VARCHAR(20),
                designation VARCHAR(50),
                category VARCHAR(50),
                department VARCHAR(50),
                daily_wage DECIMAL(10, 2) DEFAULT 0.00,
                monthly_salary DECIMAL(10, 2) DEFAULT 0.00,
                work_role VARCHAR(50),
                assigned_project_id INT,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✓ Created employees table');
        
        // Create projects table
        await pool.query(`
            CREATE TABLE projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_name VARCHAR(200) NOT NULL,
                location VARCHAR(200),
                start_date DATE,
                end_date DATE,
                estimated_budget DECIMAL(15, 2) DEFAULT 0.00,
                actual_cost DECIMAL(15, 2) DEFAULT 0.00,
                description TEXT,
                status ENUM('planning', 'ongoing', 'completed', 'on_hold') DEFAULT 'planning',
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✓ Created projects table');
        
        // Create more essential tables...
        // (Adding minimal tables for login to work)
        
        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(
            'INSERT INTO users (name, email, password, role, is_active, is_approved) VALUES (?, ?, ?, ?, ?, ?)',
            ['Admin', 'admin@khazabilkis.com', hashedPassword, 'admin', true, true]
        );
        console.log('✓ Created admin user');
        
        res.json({
            success: true,
            message: 'Database initialized successfully!',
            tables_created: ['users', 'employees', 'projects'],
            admin_user: {
                email: 'admin@khazabilkis.com',
                password: 'admin123'
            }
        });
        
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        res.status(500).json({
            success: false,
            message: 'Database initialization failed',
            error: error.message
        });
    }
});

// Test Database Connection
router.post('/test-connection', async (req, res) => {
    try {
        console.log('🔍 Testing database connection...');
        console.log('DB_HOST:', process.env.DB_HOST);
        console.log('DB_PORT:', process.env.DB_PORT);
        console.log('DB_USER:', process.env.DB_USER);
        console.log('DB_NAME:', process.env.DB_NAME);
        
        const pool = require('../config/database');
        const [rows] = await pool.query('SELECT 1 as test');
        
        res.json({
            success: true,
            message: 'Database connection successful!',
            config: {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                database: process.env.DB_NAME
            }
        });
    } catch (error) {
        console.error('❌ Test connection error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Connection failed',
            error: error.message,
            config: {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                database: process.env.DB_NAME
            }
        });
    }
});

// Fix Admin User Endpoint
router.post('/fix-admin', async (req, res) => {
    try {
        console.log('🔧 Fixing admin user...');
        
        const pool = require('../config/database');
        
        // Generate proper password hash for 'admin123'
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Check if admin exists
        const [existingUsers] = await pool.query(
            'SELECT id, email FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );
        
        if (existingUsers.length > 0) {
            // Update existing admin
            await pool.query(
                `UPDATE users 
                 SET password = ?, 
                     role = 'admin', 
                     is_active = 1, 
                     is_approved = 1 
                 WHERE email = ?`,
                [hashedPassword, 'admin@khazabilkis.com']
            );
            console.log('✅ Admin user updated');
        } else {
            // Create new admin
            await pool.query(
                `INSERT INTO users (name, email, password, role, phone, is_active, is_approved) 
                 VALUES (?, ?, ?, 'admin', '01700000000', 1, 1)`,
                ['Admin User', 'admin@khazabilkis.com', hashedPassword]
            );
            console.log('✅ Admin user created');
        }
        
        // Verify
        const [verifyUser] = await pool.query(
            'SELECT id, name, email, role, is_active, is_approved FROM users WHERE email = ?',
            ['admin@khazabilkis.com']
        );
        
        res.json({
            success: true,
            message: 'Admin user fixed successfully!',
            user: verifyUser[0] || null,
            login: {
                email: 'admin@khazabilkis.com',
                password: 'admin123'
            }
        });
        
    } catch (error) {
        console.error('❌ Fix admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fix admin user',
            error: error.message
        });
    }
});

module.exports = router;
