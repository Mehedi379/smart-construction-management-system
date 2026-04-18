// ============================================
// COMPLETE SYSTEM CLEANUP & TEST DATA CREATION
// Smart Construction Management System
// ============================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function cleanupAndCreateTestData() {
    console.log('\n' + '='.repeat(70));
    console.log('🧹 STARTING COMPLETE SYSTEM CLEANUP & TEST DATA CREATION');
    console.log('='.repeat(70) + '\n');

    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'construction_db'
    });

    try {
        // ============================================
        // PART 1: CLEAN ALL DATA
        // ============================================
        console.log('🗑️  PART 1: Cleaning All Data...\n');

        await conn.beginTransaction();

        // Delete in correct order (respecting foreign keys)
        console.log('   Deleting transactional data...');
        await conn.query('DELETE FROM audit_logs');
        console.log('   ✓ Audit logs cleared');

        await conn.query('DELETE FROM workflow_steps');
        console.log('   ✓ Workflow steps cleared');

        await conn.query('DELETE FROM signature_requests');
        console.log('   ✓ Signature requests cleared');

        await conn.query('DELETE FROM ledger_entries');
        console.log('   ✓ Ledger entries cleared');

        await conn.query('DELETE FROM transactions');
        console.log('   ✓ Transactions cleared');

        await conn.query('DELETE FROM expenses');
        console.log('   ✓ Expenses cleared');

        await conn.query('DELETE FROM vouchers');
        console.log('   ✓ Vouchers cleared');

        await conn.query('DELETE FROM daily_sheets');
        console.log('   ✓ Daily sheets cleared');

        await conn.query('DELETE FROM purchases');
        console.log('   ✓ Purchases cleared');

        await conn.query('DELETE FROM attendance');
        console.log('   ✓ Attendance cleared');

        await conn.query('DELETE FROM ledger_accounts');
        console.log('   ✓ Ledger accounts cleared');

        console.log('\n   Deleting employees and projects...');
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.query('TRUNCATE TABLE employees');
        console.log('   ✓ Employee records cleared');
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        await conn.query('DELETE FROM projects');
        console.log('   ✓ Projects cleared');

        console.log('\n   Deleting users (keeping admin)...');
        await conn.query('DELETE FROM users WHERE id != 1');
        console.log('   ✓ Users cleared (admin preserved)');

        // Reset auto-increment
        console.log('\n   Resetting auto-increment values...');
        const tables = [
            'audit_logs', 'workflow_steps', 'signature_requests',
            'ledger_entries', 'transactions', 'expenses', 'vouchers',
            'daily_sheets', 'purchases', 'attendance', 'ledger_accounts',
            'employees', 'projects'
        ];

        for (const table of tables) {
            await conn.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        }
        console.log('   ✓ All auto-increment values reset');

        // Reset users table last (keep admin)
        await conn.query('ALTER TABLE users AUTO_INCREMENT = 2');
        console.log('   ✓ Users table auto-increment set to 2 (admin is 1)\n');

        await conn.commit();

        // ============================================
        // PART 2: CREATE PROJECTS
        // ============================================
        console.log('🏗️  PART 2: Creating Test Projects...\n');

        const projects = [
            {
                code: 'PRJ-001',
                name: 'Dhaka Tower Construction',
                location: 'Dhaka, Bangladesh',
                budget: 5000000,
                status: 'ongoing'
            },
            {
                code: 'PRJ-002',
                name: 'Chittagong Bridge Project',
                location: 'Chittagong, Bangladesh',
                budget: 8000000,
                status: 'ongoing'
            }
        ];

        const projectIds = [];
        for (const project of projects) {
            const [result] = await conn.query(
                `INSERT INTO projects 
                (project_code, project_name, location, start_date, estimated_budget, status, created_by)
                VALUES (?, ?, ?, CURDATE(), ?, ?, 1)`,
                [project.code, project.name, project.location, project.budget, project.status]
            );
            projectIds.push(result.insertId);
            console.log(`   ✓ Created: ${project.code} - ${project.name}`);
        }
        console.log('');

        // ============================================
        // PART 3: CREATE ROLE-WISE ACCOUNTS
        // ============================================
        console.log('👥 PART 3: Creating Role-Wise Test Accounts...\n');

        const testPassword = '123456';
        const hashedPassword = await bcrypt.hash(testPassword, 10);

        const roleAccounts = [
            // Project 1 Accounts
            {
                name: 'Head Office Accounts 1',
                email: 'ho.accounts1@test.com',
                role: 'head_office_accounts_1',
                projectId: projectIds[0],
                category: 'Head Office Accounts',
                designation: 'Accounts Manager'
            },
            {
                name: 'Head Office Accounts 2',
                email: 'ho.accounts2@test.com',
                role: 'head_office_accounts_2',
                projectId: projectIds[0],
                category: 'Head Office Accounts',
                designation: 'Accounts Officer'
            },
            {
                name: 'Deputy Head Office',
                email: 'deputy.ho@test.com',
                role: 'deputy_head_office',
                projectId: projectIds[0],
                category: 'Management',
                designation: 'Deputy Manager'
            },
            {
                name: 'Project Director - PRJ1',
                email: 'project.director1@test.com',
                role: 'project_director',
                projectId: projectIds[0],
                category: 'Management',
                designation: 'Project Director'
            },
            {
                name: 'Site Director - PRJ1',
                email: 'site.director1@test.com',
                role: 'site_director',
                projectId: projectIds[0],
                category: 'Management',
                designation: 'Site Director'
            },
            {
                name: 'Deputy Director - PRJ1',
                email: 'deputy.director1@test.com',
                role: 'deputy_director',
                projectId: projectIds[0],
                category: 'Management',
                designation: 'Deputy Director'
            },
            {
                name: 'Site Manager - PRJ1',
                email: 'site.manager1@test.com',
                role: 'site_manager',
                projectId: projectIds[0],
                category: 'Management',
                designation: 'Site Manager'
            },
            {
                name: 'Site Engineer - PRJ1',
                email: 'site.engineer1@test.com',
                role: 'site_engineer',
                projectId: projectIds[0],
                category: 'Engineering',
                designation: 'Site Engineer'
            },
            {
                name: 'Engineer - PRJ1',
                email: 'engineer1@test.com',
                role: 'engineer',
                projectId: projectIds[0],
                category: 'Engineering',
                designation: 'Engineer'
            },
            {
                name: 'Accountant - PRJ1',
                email: 'accountant1@test.com',
                role: 'accountant',
                projectId: projectIds[0],
                category: 'Accounts',
                designation: 'Accountant'
            },
            {
                name: 'Employee - PRJ1',
                email: 'employee1@test.com',
                role: 'employee',
                projectId: projectIds[0],
                category: 'Labor',
                designation: 'General Worker'
            },

            // Project 2 Accounts
            {
                name: 'Project Director - PRJ2',
                email: 'project.director2@test.com',
                role: 'project_director',
                projectId: projectIds[1],
                category: 'Management',
                designation: 'Project Director'
            },
            {
                name: 'Site Manager - PRJ2',
                email: 'site.manager2@test.com',
                role: 'site_manager',
                projectId: projectIds[1],
                category: 'Management',
                designation: 'Site Manager'
            },
            {
                name: 'Site Engineer - PRJ2',
                email: 'site.engineer2@test.com',
                role: 'site_engineer',
                projectId: projectIds[1],
                category: 'Engineering',
                designation: 'Site Engineer'
            },
            {
                name: 'Accountant - PRJ2',
                email: 'accountant2@test.com',
                role: 'accountant',
                projectId: projectIds[1],
                category: 'Accounts',
                designation: 'Accountant'
            }
        ];

        const createdAccounts = [];

        for (const account of roleAccounts) {
            // Create user
            const [userResult] = await conn.query(
                `INSERT INTO users 
                (name, email, password, phone, role, is_approved, is_active, status)
                VALUES (?, ?, ?, '+8801XXXXXXXXX', ?, TRUE, TRUE, 'active')`,
                [account.name, account.email, hashedPassword, account.role]
            );

            const userId = userResult.insertId;

            // Create employee record
            const employeeId = `EMP${String(userId).padStart(4, '0')}`;
            await conn.query(
                `INSERT INTO employees 
                (user_id, employee_id, name, phone, designation, category, department, assigned_project_id, status, created_by)
                VALUES (?, ?, ?, '+8801XXXXXXXXX', ?, ?, ?, ?, 'active', 1)`,
                [userId, employeeId, account.name, account.designation, account.category, account.category, account.projectId]
            );

            createdAccounts.push({
                ...account,
                userId,
                employeeId,
                projectName: account.projectId === projectIds[0] ? projects[0].name : projects[1].name
            });

            console.log(`   ✓ ${account.role}: ${account.email}`);
        }

        console.log('');

        // ============================================
        // PART 4: SUMMARY
        // ============================================
        console.log('\n' + '='.repeat(70));
        console.log('✅ CLEANUP & TEST DATA CREATION COMPLETED');
        console.log('='.repeat(70) + '\n');

        console.log('📊 Summary:');
        console.log('   ✓ All old data cleaned');
        console.log('   ✓ 2 projects created');
        console.log('   ✓ 15 role-wise accounts created');
        console.log('   ✓ All accounts approved and active\n');

        console.log('🔐 TEST ACCOUNTS (Password: 123456 for all):\n');
        console.log('   ' + '='.repeat(65));
        console.log('   ROLE | EMAIL | PROJECT');
        console.log('   ' + '='.repeat(65));

        createdAccounts.forEach(acc => {
            console.log(`   ${acc.role}`);
            console.log(`   Email: ${acc.email}`);
            console.log(`   Project: ${acc.projectName}`);
            console.log('   ' + '-'.repeat(65));
        });

        console.log('\n🎯 Testing Instructions:');
        console.log('   1. Login with each account');
        console.log('   2. Verify each user sees only their project data');
        console.log('   3. Create vouchers, expenses, sheets');
        console.log('   4. Check calculations are correct');
        console.log('   5. Verify project isolation works');
        console.log('   6. Test admin panel shows all users\n');

        console.log('📝 Admin Account:');
        console.log('   Email: admin@khazabilkis.com');
        console.log('   Password: 123456\n');

    } catch (error) {
        await conn.rollback();
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        await conn.end();
    }
}

cleanupAndCreateTestData()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
