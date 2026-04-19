const mysql = require('mysql2/promise');
require('dotenv').config();

// Log ALL environment variables related to database
console.log('🔧 Environment Variables Check:');
console.log('  DB_HOST:', process.env.DB_HOST);
console.log('  MYSQLHOST:', process.env.MYSQLHOST);
console.log('  DB_PORT:', process.env.DB_PORT);
console.log('  MYSQLPORT:', process.env.MYSQLPORT);
console.log('  DB_USER:', process.env.DB_USER);
console.log('  DB_NAME:', process.env.DB_NAME);
console.log('  NODE_ENV:', process.env.NODE_ENV);

// Determine the correct host
// Railway fallback: if DB_HOST is undefined, use the known Railway MySQL host
let dbHost = process.env.DB_HOST || process.env.MYSQLHOST;
if (!dbHost && process.env.NODE_ENV === 'production') {
    // Fallback for Railway deployment
    dbHost = 'roundhouse.proxy.rlwy.net';
    console.log('⚠️  DB_HOST not found, using Railway default');
}
dbHost = dbHost || 'localhost';

const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306');
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'construction_db';

console.log('\n🔧 Final Database Configuration:');
console.log('  Host:', dbHost);
console.log('  Port:', dbPort);
console.log('  User:', dbUser);
console.log('  Database:', dbName);

const pool = mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
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
