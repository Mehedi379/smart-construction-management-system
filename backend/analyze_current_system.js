const mysql = require('mysql2/promise');
require('dotenv').config();

async function analyzeSystem() {
    console.log('\n========================================');
    console.log('🔍 COMPLETE SYSTEM ANALYSIS');
    console.log('========================================\n');

    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('✅ Connected to database\n');

        // 1. Check existing tables
        console.log('📊 EXISTING DATABASE TABLES:');
        console.log('----------------------------------------');
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        tableNames.forEach((table, i) => {
            console.log(`${i + 1}. ${table}`);
        });
        console.log('');

        // 2. Check users table structure
        console.log('👤 USERS TABLE STRUCTURE:');
        console.log('----------------------------------------');
        const [userCols] = await connection.query('DESCRIBE users');
        userCols.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'REQUIRED' : 'optional'}`);
        });
        console.log('');

        // 3. Check employees table structure
        console.log('👷 EMPLOYEES TABLE STRUCTURE:');
        console.log('----------------------------------------');
        const [empCols] = await connection.query('DESCRIBE employees');
        empCols.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type}`);
        });
        console.log('');

        // 4. Check projects table
        console.log('🏗️ PROJECTS TABLE STRUCTURE:');
        console.log('----------------------------------------');
        const [projCols] = await connection.query('DESCRIBE projects');
        projCols.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type}`);
        });
        console.log('');

        // 5. Check if daily_sheets table exists
        console.log('📄 DAILY SHEETS TABLE:');
        console.log('----------------------------------------');
        if (tableNames.includes('daily_sheets')) {
            console.log('✅ daily_sheets table EXISTS');
            const [sheetCols] = await connection.query('DESCRIBE daily_sheets');
            sheetCols.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type}`);
            });
        } else {
            console.log('❌ daily_sheets table MISSING - NEED TO CREATE');
        }
        console.log('');

        // 6. Check if daily_sheet_items table exists
        console.log('📝 DAILY SHEET ITEMS TABLE:');
        console.log('----------------------------------------');
        if (tableNames.includes('daily_sheet_items')) {
            console.log('✅ daily_sheet_items table EXISTS');
        } else {
            console.log('❌ daily_sheet_items table MISSING - NEED TO CREATE');
        }
        console.log('');

        // 7. Check if signatures table exists
        console.log('✍️ SIGNATURES TABLE:');
        console.log('----------------------------------------');
        if (tableNames.includes('signatures')) {
            console.log('✅ signatures table EXISTS');
        } else {
            console.log('ℹ️  signatures stored as JSON in daily_sheets (OK)');
        }
        console.log('');

        // 8. Check if user_projects table exists
        console.log('🔗 USER_PROJECTS TABLE:');
        console.log('----------------------------------------');
        if (tableNames.includes('user_projects')) {
            console.log('✅ user_projects table EXISTS');
        } else {
            console.log('ℹ️  Using employees.assigned_project_id instead (OK)');
        }
        console.log('');

        // 9. Check roles in users table
        console.log('👥 USER ROLES:');
        console.log('----------------------------------------');
        const [roles] = await connection.query(
            'SELECT DISTINCT role FROM users ORDER BY role'
        );
        roles.forEach(r => console.log(`  - ${r.role}`));
        console.log('');

        // 10. Check active users count
        console.log('📊 USER STATISTICS:');
        console.log('----------------------------------------');
        const [userStats] = await connection.query(
            'SELECT role, COUNT(*) as count, SUM(is_active = 1) as active FROM users GROUP BY role'
        );
        userStats.forEach(stat => {
            console.log(`  ${stat.role}: ${stat.count} total, ${stat.active} active`);
        });
        console.log('');

        // 11. Check projects count
        console.log('🏗️ PROJECT STATISTICS:');
        console.log('----------------------------------------');
        const [projStats] = await connection.query(
            'SELECT status, COUNT(*) as count FROM projects GROUP BY status'
        );
        projStats.forEach(stat => {
            console.log(`  ${stat.status}: ${stat.count} projects`);
        });
        console.log('');

        // 12. Check if approvals table exists
        console.log('✅ APPROVALS TABLE:');
        console.log('----------------------------------------');
        if (tableNames.includes('approvals')) {
            console.log('✅ approvals table EXISTS');
        } else {
            console.log('ℹ️  Using users.is_approved field instead (OK)');
        }
        console.log('');

        console.log('========================================');
        console.log('📋 ANALYSIS COMPLETE');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

analyzeSystem();
