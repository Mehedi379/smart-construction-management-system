const mysql = require('mysql2/promise');

// Force reload dotenv for Railway
const dotenv = require('dotenv');
dotenv.config({ override: true });

// Log ALL environment variables related to database
console.log('🔧 Environment Variables Check:');
console.log('  DB_HOST:', process.env.DB_HOST);
console.log('  MYSQLHOST:', process.env.MYSQLHOST);
console.log('  DB_PORT:', process.env.DB_PORT);
console.log('  MYSQLPORT:', process.env.MYSQLPORT);
console.log('  DB_USER:', process.env.DB_USER);
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? 'Set (length: ' + process.env.DB_PASSWORD.length + ')' : 'undefined');
console.log('  MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? 'Set (length: ' + process.env.MYSQLPASSWORD.length + ')' : 'undefined');
console.log('  DB_NAME:', process.env.DB_NAME);
console.log('  NODE_ENV:', process.env.NODE_ENV);

// Show all variable names that contain 'PASSWORD'
console.log('\n🔍 All PASSWORD variables:');
Object.keys(process.env).forEach(key => {
    if (key.includes('PASSWORD') || key.includes('PASS')) {
        console.log(`  ${key}: Set (length: ${process.env[key].length})`);
    }
});

// Railway uses both internal and external variables
// Try multiple possible variable names for host
const dbHost = process.env.DB_HOST || 
               process.env.MYSQL_HOST ||  // Alternative name
               process.env.DATABASE_HOST || // Another alternative
               process.env.MYSQLHOST || 
               (process.env.NODE_ENV === 'production' ? 'roundhouse.proxy.rlwy.net' : 'localhost');
               
const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306');
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';

// Try ALL possible password variable names
const dbPassword = process.env.DB_PASSWORD || 
                   process.env.DATABASE_PASSWORD ||
                   process.env.MYSQL_ROOT_PASSWORD ||  // From MySQL service
                   process.env.MYSQL_PASSWORD ||
                   process.env.MYSQLPASSWORD ||
                   '';

// Debug: Log which password variable is being used
if (process.env.DB_PASSWORD) {
    console.log('✅ Using DB_PASSWORD');
} else if (process.env.DATABASE_PASSWORD) {
    console.log('✅ Using DATABASE_PASSWORD');
} else if (process.env.MYSQL_ROOT_PASSWORD) {
    console.log('✅ Using MYSQL_ROOT_PASSWORD');
} else if (process.env.MYSQL_PASSWORD) {
    console.log('✅ Using MYSQL_PASSWORD');
} else {
    console.log('❌ NO PASSWORD VARIABLE FOUND!');
}

const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'construction_db';

console.log('\n🔧 Final Database Configuration:');
console.log('  Host:', dbHost);
console.log('  Port:', dbPort);
console.log('  User:', dbUser);
console.log('  Password:', dbPassword ? 'Set (length: ' + dbPassword.length + ')' : 'EMPTY');
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
