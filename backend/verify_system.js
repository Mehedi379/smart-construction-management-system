const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifySystem() {
    console.log('\n========================================');
    console.log('🔍 SYSTEM VERIFICATION STARTING');
    console.log('========================================\n');

    let connection;
    
    try {
        // 1. Test Database Connection
        console.log('1️⃣  Testing Database Connection...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });
        console.log('✅ Database connected successfully\n');

        // 2. Check Users Table Structure
        console.log('2️⃣  Checking Users Table Structure...');
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM users
        `);
        const roleColumn = columns.find(col => col.Field === 'role');
        console.log('Role column type:', roleColumn?.Type);
        
        if (roleColumn?.Type.includes('engineer')) {
            console.log('✅ Engineer role exists in database\n');
        } else {
            console.log('❌ Engineer role NOT found in database');
            console.log('   Run: database/add_engineer_role.sql\n');
        }

        // 3. Check Existing Users
        console.log('3️⃣  Checking Existing Users...');
        const [users] = await connection.query(`
            SELECT id, name, email, role, is_active, is_approved 
            FROM users 
            ORDER BY id
        `);
        console.log(`Total users: ${users.length}`);
        users.forEach(user => {
            const status = user.is_approved ? (user.is_active ? '✅ Active' : '❌ Inactive') : '⏳ Pending';
            console.log(`   - ${user.name} (${user.email}) - Role: ${user.role} - ${status}`);
        });
        console.log('');

        // 4. Check Roles Distribution
        console.log('4️⃣  Role Distribution...');
        const [roleStats] = await connection.query(`
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        `);
        roleStats.forEach(stat => {
            console.log(`   ${stat.role}: ${stat.count} user(s)`);
        });
        console.log('');

        // 5. Check Employees Table
        console.log('5️⃣  Checking Employees Table...');
        const [empCount] = await connection.query(`SELECT COUNT(*) as count FROM employees`);
        console.log(`Total employees: ${empCount[0].count}`);
        
        const [empCategories] = await connection.query(`
            SELECT category, COUNT(*) as count 
            FROM employees 
            WHERE category IS NOT NULL
            GROUP BY category
        `);
        if (empCategories.length > 0) {
            console.log('Categories:');
            empCategories.forEach(cat => {
                console.log(`   - ${cat.category}: ${cat.count}`);
            });
        }
        console.log('');

        // 6. Check Projects
        console.log('6️⃣  Checking Projects...');
        const [projects] = await connection.query(`
            SELECT id, project_name, project_code, status 
            FROM projects 
            ORDER BY id
        `);
        console.log(`Total projects: ${projects.length}`);
        projects.forEach(proj => {
            console.log(`   - ${proj.project_name} (${proj.project_code}) - ${proj.status}`);
        });
        console.log('');

        // 7. Check for Orphaned Records
        console.log('7️⃣  Checking Data Integrity...');
        const [orphanedUsers] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM users u 
            LEFT JOIN employees e ON u.id = e.user_id 
            WHERE e.id IS NULL AND u.is_approved = TRUE
        `);
        if (orphanedUsers[0].count > 0) {
            console.log(`⚠️  ${orphanedUsers[0].count} approved user(s) without employee record`);
        } else {
            console.log('✅ All approved users have employee records');
        }
        console.log('');

        // 8. Test JWT Secret
        console.log('8️⃣  Checking Configuration...');
        if (process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your_secret_key') {
            console.log('✅ JWT Secret is configured');
        } else {
            console.log('⚠️  JWT Secret might be using default value');
        }
        console.log('');

        console.log('========================================');
        console.log('✅ SYSTEM VERIFICATION COMPLETE');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        console.error('Make sure MySQL is running and database exists\n');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verifySystem();
