// ============================================
// FULL SYSTEM RESET + TEST DATA CREATION
// Smart Construction Management System
// ============================================

const pool = require('./src/config/database');
const bcrypt = require('bcryptjs');

const ADMIN_PASSWORD = '123456';
const PROJECT_NAME = 'Test Construction Project';

async function fullSystemReset() {
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();
        console.log('\n🚀 Starting Full System Reset...\n');

        // ============================================
        // STEP 1: CLEAN OLD DATA
        // ============================================
        console.log('📋 Step 1: Cleaning old data...');
        
        // Delete old data in correct order (foreign key constraints)
        await conn.query('DELETE FROM audit_logs');
        console.log('  ✓ Cleared audit logs');
        
        await conn.query('DELETE FROM sheet_signatures');
        console.log('  ✓ Cleared sheet signatures');
        
        await conn.query('DELETE FROM daily_sheets');
        console.log('  ✓ Cleared daily sheets');
        
        await conn.query('DELETE FROM vouchers');
        console.log('  ✓ Cleared vouchers');
        
        await conn.query('DELETE FROM expenses');
        console.log('  ✓ Cleared expenses');
        
        await conn.query('DELETE FROM purchases');
        console.log('  ✓ Cleared purchases');
        
        await conn.query('DELETE FROM ledger_entries');
        console.log('  ✓ Cleared ledger entries');
        
        await conn.query('DELETE FROM user_roles');
        console.log('  ✓ Cleared all user roles');
        
        await conn.query('DELETE FROM employees');
        console.log('  ✓ Cleared all employee records');
        
        await conn.query('DELETE FROM users');
        console.log('  ✓ Cleared all users');
        
        await conn.query('DELETE FROM projects');
        console.log('  ✓ Cleared all projects');
        
        // Reset auto-increment
        await conn.query('ALTER TABLE projects AUTO_INCREMENT = 1');
        await conn.query('ALTER TABLE users AUTO_INCREMENT = 1');
        await conn.query('ALTER TABLE employees AUTO_INCREMENT = 1');
        console.log('  ✓ Reset auto-increment counters\n');

        // ============================================
        // STEP 1.5: CREATE ADMIN USER FIRST
        // ============================================
        console.log('📋 Step 1.5: Creating admin user...');
        
        const adminHashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        const [adminResult] = await conn.query(
            `INSERT INTO users (
                name, email, password, phone, role,
                is_approved, is_active, status
            ) VALUES (?, ?, ?, ?, ?, TRUE, TRUE, 'active')`,
            ['Admin User', 'admin@test.com', adminHashedPassword, '+8801XXXXXXXXX', 'admin']
        );
        
        const adminId = adminResult.insertId;
        console.log(`  ✓ Admin user created (ID: ${adminId})\n`);

        // ============================================
        // STEP 2: CREATE TEST PROJECT
        // ============================================
        console.log('📋 Step 2: Creating test project...');
        
        const projectCode = `PRJ${String(1).padStart(3, '0')}`;
        const [projectResult] = await conn.query(
            `INSERT INTO projects (
                project_code, project_name, client_id, location, description,
                estimated_budget, start_date, end_date, status, created_by
            ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
            [
                projectCode,
                PROJECT_NAME,
                'Test Location',
                'Test construction project for system validation',
                5000000, // 50 Lakh BDT
                '2026-01-01',
                null,
                'ongoing',
                adminId
            ]
        );
        
        const projectId = projectResult.insertId;
        console.log(`  ✓ Project created: ${PROJECT_NAME}`);
        console.log(`  ✓ Project Code: ${projectCode}`);
        console.log(`  ✓ Project ID: ${projectId}`);
        console.log(`  ✓ Budget: ৳50,00,000\n`);

        // ============================================
        // STEP 3: CREATE ALL ROLE ACCOUNTS
        // ============================================
        console.log('📋 Step 3: Creating role accounts...\n');
        
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        
        const roles = [
            {
                name: 'Accountant User',
                email: 'accountant@test.com',
                role: 'accountant',
                category: 'Accounts',
                designation: 'Head Accountant'
            },
            {
                name: 'Site Manager',
                email: 'sitemanager@test.com',
                role: 'manager',
                category: 'Management',
                designation: 'Site Manager'
            },
            {
                name: 'Site Engineer',
                email: 'engineer@test.com',
                role: 'engineer',
                category: 'Engineer',
                designation: 'Senior Engineer'
            },
            {
                name: 'Project Director',
                email: 'director@test.com',
                role: 'director',
                category: 'Management',
                designation: 'Project Director'
            },
            {
                name: 'Deputy Director',
                email: 'deputy@test.com',
                role: 'deputy_director',
                category: 'Management',
                designation: 'Deputy Director'
            },
            {
                name: 'Worker Employee',
                email: 'worker@test.com',
                role: 'employee',
                category: 'Worker',
                designation: 'General Worker'
            }
        ];

        const createdUsers = [];

        for (const userData of roles) {
            // Create user
            const [userResult] = await conn.query(
                `INSERT INTO users (
                    name, email, password, phone, role,
                    is_approved, is_active, status, approved_by, approved_at
                ) VALUES (?, ?, ?, ?, ?, TRUE, TRUE, 'active', 1, NOW())`,
                [
                    userData.name,
                    userData.email,
                    hashedPassword,
                    '+8801XXXXXXXXX',
                    userData.role
                ]
            );
            
            const userId = userResult.insertId;
            const employeeId = `EMP${String(userId).padStart(4, '0')}`;
            
            // Create employee record
            await conn.query(
                `INSERT INTO employees (
                    user_id, employee_id, name, phone,
                    designation, category, department,
                    assigned_project_id, status, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
                [
                    userId,
                    employeeId,
                    userData.name,
                    '+8801XXXXXXXXX',
                    userData.designation,
                    userData.category,
                    userData.category,
                    projectId,
                    adminId
                ]
            );
            
            createdUsers.push({
                ...userData,
                userId,
                employeeId
            });
            
            console.log(`  ✓ ${userData.role}: ${userData.email}`);
        }
        
        console.log('');

        // ============================================
        // STEP 4: OUTPUT ALL ACCOUNTS
        // ============================================
        console.log('\n' + '='.repeat(70));
        console.log('🔐 ALL TEST ACCOUNTS (Password: 123456 for all)');
        console.log('='.repeat(70) + '\n');
        
        createdUsers.forEach((user, index) => {
            console.log(`Role: ${user.name}`);
            console.log(`Email: ${user.email}`);
            console.log(`Password: ${ADMIN_PASSWORD}`);
            console.log(`Role Type: ${user.role}`);
            console.log(`Employee ID: ${user.employeeId}`);
            console.log(`Assigned Project: ${PROJECT_NAME} (ID: ${projectId})`);
            console.log('-'.repeat(70));
        });

        console.log('\n' + '='.repeat(70));
        console.log('📊 PROJECT DETAILS');
        console.log('='.repeat(70) + '\n');
        console.log(`Project Name: ${PROJECT_NAME}`);
        console.log(`Project Code: ${projectCode}`);
        console.log(`Project ID: ${projectId}`);
        console.log(`Budget: ৳50,00,000`);
        console.log(`Status: Ongoing`);
        console.log(`Start Date: 2026-01-01`);
        console.log(`Assigned Users: ${createdUsers.length}`);

        await conn.commit();
        
        console.log('\n✅ System reset completed successfully!\n');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        await conn.rollback();
        console.error('\n❌ Error during system reset:', error);
        throw error;
    } finally {
        conn.release();
    }
}

// Run the reset
fullSystemReset()
    .then(() => {
        console.log('🎉 Full system reset completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 System reset failed:', error);
        process.exit(1);
    });
