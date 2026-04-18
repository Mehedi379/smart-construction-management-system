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

module.exports = router;
