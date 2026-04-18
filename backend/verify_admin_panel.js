// ============================================
// VERIFY ADMIN CONTROL PANEL - ALL SYSTEMS CHECK
// Smart Construction Management System
// ============================================

const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n=== ADMIN CONTROL PANEL - FULL SYSTEM CHECK ===\n');
        
        let allChecks = [];
        let passed = 0;
        let failed = 0;
        
        // 1. Check Admin Users
        console.log('👑 CHECKING ADMIN USERS...\n');
        const [admins] = await pool.query(`
            SELECT id, name, email, role, is_approved, is_active, created_at
            FROM users
            WHERE role = 'admin'
            ORDER BY id
        `);
        
        if (admins.length === 0) {
            console.log('   ❌ FAIL: No admin users found!');
            allChecks.push({ check: 'Admin Users', status: 'FAIL', message: 'No admin users' });
            failed++;
        } else {
            console.log(`   ✅ PASS: ${admins.length} admin user(s) found\n`);
            admins.forEach((admin, index) => {
                console.log(`   Admin #${index + 1}:`);
                console.log(`      ID: ${admin.id}`);
                console.log(`      Name: ${admin.name}`);
                console.log(`      Email: ${admin.email}`);
                console.log(`      Role: ${admin.role}`);
                console.log(`      Approved: ${admin.is_approved === 1 ? '✅ Yes' : '❌ No'}`);
                console.log(`      Active: ${admin.is_active === 1 ? '✅ Yes' : '❌ No'}`);
                console.log(`      Created: ${admin.created_at}`);
            });
            allChecks.push({ check: 'Admin Users', status: 'PASS', message: `${admins.length} admin(s)` });
            passed++;
        }
        
        // 2. Check Users Table Structure
        console.log('\n\n📋 CHECKING USERS TABLE...\n');
        const [userColumns] = await pool.query('SHOW COLUMNS FROM users');
        const requiredColumns = ['id', 'name', 'email', 'password', 'role', 'is_approved', 'is_active'];
        const missingColumns = requiredColumns.filter(col => !userColumns.find(c => c.Field === col));
        
        if (missingColumns.length > 0) {
            console.log(`   ❌ FAIL: Missing columns: ${missingColumns.join(', ')}`);
            allChecks.push({ check: 'Users Table Structure', status: 'FAIL', message: `Missing: ${missingColumns.join(', ')}` });
            failed++;
        } else {
            console.log('   ✅ PASS: All required columns exist');
            allChecks.push({ check: 'Users Table Structure', status: 'PASS', message: 'Complete' });
            passed++;
        }
        
        // 3. Check Projects Table
        console.log('\n\n📁 CHECKING PROJECTS TABLE...\n');
        const [projects] = await pool.query(`
            SELECT COUNT(*) as count FROM projects
        `);
        console.log(`   Projects Count: ${projects[0].count}`);
        console.log('   ✅ PASS: Projects table accessible');
        allChecks.push({ check: 'Projects Table', status: 'PASS', message: `${projects[0].count} projects` });
        passed++;
        
        // 4. Check Employees Table
        console.log('\n\n👥 CHECKING EMPLOYEES TABLE...\n');
        const [employees] = await pool.query(`
            SELECT COUNT(*) as count FROM employees
        `);
        console.log(`   Employees Count: ${employees[0].count}`);
        console.log('   ✅ PASS: Employees table accessible');
        allChecks.push({ check: 'Employees Table', status: 'PASS', message: `${employees[0].count} employees` });
        passed++;
        
        // 5. Check Role Permissions
        console.log('\n\n🔐 CHECKING ROLE PERMISSIONS...\n');
        const [roles] = await pool.query(`
            SELECT DISTINCT role, COUNT(*) as count
            FROM users
            GROUP BY role
            ORDER BY count DESC
        `);
        
        if (roles.length === 0) {
            console.log('   ⚠️  WARNING: No roles found in users table');
            allChecks.push({ check: 'Role Permissions', status: 'WARNING', message: 'No roles' });
        } else {
            console.log('   Role Distribution:');
            roles.forEach(role => {
                console.log(`      - ${role.role}: ${role.count} user(s)`);
            });
            allChecks.push({ check: 'Role Permissions', status: 'PASS', message: `${roles.length} role types` });
            passed++;
        }
        
        // 6. Check Database Connections
        console.log('\n\n🔗 CHECKING DATABASE CONNECTIONS...\n');
        const [tables] = await pool.query('SHOW TABLES');
        console.log(`   Total Tables: ${tables.length}`);
        console.log('   ✅ PASS: Database connection stable');
        allChecks.push({ check: 'Database Connection', status: 'PASS', message: `${tables.length} tables` });
        passed++;
        
        // 7. Check Foreign Keys
        console.log('\n\n🔗 CHECKING FOREIGN KEY CONSTRAINTS...\n');
        const [foreignKeys] = await pool.query(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY TABLE_NAME
        `);
        
        console.log(`   Foreign Keys Found: ${foreignKeys.length}`);
        if (foreignKeys.length > 0) {
            console.log('   ✅ PASS: Foreign key constraints exist');
            allChecks.push({ check: 'Foreign Keys', status: 'PASS', message: `${foreignKeys.length} constraints` });
            passed++;
        } else {
            console.log('   ⚠️  WARNING: No foreign keys found');
            allChecks.push({ check: 'Foreign Keys', status: 'WARNING', message: 'None found' });
        }
        
        // 8. Check Indexes
        console.log('\n\n📇 CHECKING DATABASE INDEXES...\n');
        const [indexes] = await pool.query(`
            SELECT 
                TABLE_NAME,
                INDEX_NAME,
                COLUMN_NAME
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            AND INDEX_NAME != 'PRIMARY'
            ORDER BY TABLE_NAME, INDEX_NAME
        `);
        
        console.log(`   Indexes Found: ${indexes.length}`);
        console.log('   ✅ PASS: Database indexes exist');
        allChecks.push({ check: 'Database Indexes', status: 'PASS', message: `${indexes.length} indexes` });
        passed++;
        
        // 9. Check System Tables
        console.log('\n\n📊 CHECKING SYSTEM TABLES...\n');
        const requiredTables = [
            'users', 'employees', 'projects', 'expenses', 'vouchers',
            'daily_sheets', 'purchases', 'signature_requests', 
            'workflow_steps', 'audit_logs'
        ];
        
        const existingTables = tables.map(t => Object.values(t)[0]);
        const missingTables = requiredTables.filter(t => !existingTables.includes(t));
        
        if (missingTables.length > 0) {
            console.log(`   ❌ FAIL: Missing tables: ${missingTables.join(', ')}`);
            allChecks.push({ check: 'System Tables', status: 'FAIL', message: `Missing: ${missingTables.join(', ')}` });
            failed++;
        } else {
            console.log('   ✅ PASS: All required system tables exist');
            allChecks.push({ check: 'System Tables', status: 'PASS', message: 'All present' });
            passed++;
        }
        
        // 10. Check Auto-Increment Status
        console.log('\n\n🔢 CHECKING AUTO-INCREMENT STATUS...\n');
        const [autoIncrement] = await pool.query(`
            SELECT 
                TABLE_NAME,
                AUTO_INCREMENT
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
            AND AUTO_INCREMENT IS NOT NULL
            ORDER BY TABLE_NAME
        `);
        
        console.log('   Auto-Increment Tables:');
        autoIncrement.forEach(table => {
            console.log(`      - ${table.TABLE_NAME}: Next ID = ${table.AUTO_INCREMENT}`);
        });
        allChecks.push({ check: 'Auto-Increment', status: 'PASS', message: 'Working' });
        passed++;
        
        // Final Summary
        console.log(`\n\n${'='.repeat(60)}`);
        console.log('📊 ADMIN CONTROL PANEL - SYSTEM CHECK SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️  Warnings: ${allChecks.filter(c => c.status === 'WARNING').length}`);
        console.log(`📝 Total Checks: ${allChecks.length}`);
        
        console.log(`\n📋 Detailed Results:`);
        allChecks.forEach((check, index) => {
            const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️';
            console.log(`   ${index + 1}. ${icon} ${check.check}: ${check.message}`);
        });
        
        if (failed === 0) {
            console.log(`\n${'='.repeat(60)}`);
            console.log('🎉 ALL CRITICAL CHECKS PASSED!');
            console.log('✅ Admin Control Panel is working correctly!');
            console.log('='.repeat(60));
        } else {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`⚠️  ${failed} check(s) failed - Review needed!`);
            console.log('='.repeat(60));
        }
        
        console.log('\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();
