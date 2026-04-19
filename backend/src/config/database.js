const mysql = require('mysql2/promise');
require('dotenv').config();

// Log database configuration (hide password for security)
console.log('🔧 Database Configuration:');
console.log('  Host:', process.env.DB_HOST || process.env.MYSQLHOST || 'localhost');
console.log('  Port:', process.env.DB_PORT || process.env.MYSQLPORT || '3306');
console.log('  User:', process.env.DB_USER || process.env.MYSQLUSER || 'root');
console.log('  Database:', process.env.DB_NAME || process.env.MYSQLDATABASE || 'construction_db');
console.log('  NODE_ENV:', process.env.NODE_ENV);

const pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'construction_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+06:00'
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('✓ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('✗ Database connection failed:', err.message);
    });

module.exports = pool;
