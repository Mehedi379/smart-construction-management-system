// ============================================
// CREATE WORKER CATEGORY ACCOUNTS
// Smart Construction Management System
// ============================================

const pool = require('./src/config/database');
const bcrypt = require('bcryptjs');

const ADMIN_PASSWORD = '123456';

async function createWorkerAccounts() {
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();
        console.log('\n👷 Creating Worker Category Accounts...\n');

        // Get admin and project info
        const [adminResult] = await conn.query('SELECT id FROM users WHERE email = "admin@test.com"');
        const adminId = adminResult[0].id;
        
        const [projectResult] = await conn.query('SELECT id FROM projects LIMIT 1');
        const projectId = projectResult[0].id;
        
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Worker categories
        const workers = [
            { name: 'Plumber Worker', email: 'plumber@test.com', category: 'Plumber', designation: 'Plumber' },
            { name: 'Electrician Worker', email: 'electrician@test.com', category: 'Electrician', designation: 'Electrician' },
            { name: 'Mason Worker', email: 'mason@test.com', category: 'Mason', designation: 'Mason/Brick Layer' },
            { name: 'Carpenter Worker', email: 'carpenter@test.com', category: 'Carpenter', designation: 'Carpenter' },
            { name: 'Painter Worker', email: 'painter@test.com', category: 'Painter', designation: 'Painter' },
            { name: 'Welder Worker', email: 'welder@test.com', category: 'Welder', designation: 'Welder' },
            { name: 'Helper Worker', email: 'helper@test.com', category: 'Helper', designation: 'General Helper' },
            { name: 'Driver Worker', email: 'driver@test.com', category: 'Driver', designation: 'Vehicle Driver' },
            { name: 'Operator Worker', email: 'operator@test.com', category: 'Operator', designation: 'Machine Operator' },
            { name: 'Supervisor Worker', email: 'supervisor@test.com', category: 'Supervisor', designation: 'Site Supervisor' },
            { name: 'Steel Worker', email: 'steelworker@test.com', category: 'Steel Fixer', designation: 'Steel/Iron Worker' },
            { name: 'Tile Worker', email: 'tileworker@test.com', category: 'Tile Setter', designation: 'Tile/Mosaic Worker' },
            { name: 'Safety Worker', email: 'safetyofficer@test.com', category: 'Safety Officer', designation: 'Safety Officer' }
        ];

        const createdWorkers = [];

        for (const worker of workers) {
            // Check if user already exists
            const [existingUsers] = await conn.query('SELECT id FROM users WHERE email = ?', [worker.email]);
            
            if (existingUsers.length > 0) {
                console.log(`  ⏭️  Skipped ${worker.email} (already exists)`);
                continue;
            }

            // Create user
            const [userResult] = await conn.query(
                `INSERT INTO users (
                    name, email, password, phone, role,
                    is_approved, is_active, status
                ) VALUES (?, ?, ?, ?, ?, TRUE, TRUE, 'active')`,
                [
                    worker.name,
                    worker.email,
                    hashedPassword,
                    '+8801XXXXXXXXX',
                    'employee'
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
                    worker.name,
                    '+8801XXXXXXXXX',
                    worker.designation,
                    worker.category,
                    'Worker',
                    projectId,
                    adminId
                ]
            );
            
            createdWorkers.push({
                ...worker,
                userId,
                employeeId
            });
            
            console.log(`  ✅ ${worker.category}: ${worker.email} (${employeeId})`);
        }
        
        await conn.commit();
        
        // Output all accounts
        console.log('\n' + '='.repeat(70));
        console.log('👷 ALL WORKER CATEGORY ACCOUNTS (Password: 123456 for all)');
        console.log('='.repeat(70) + '\n');
        
        createdWorkers.forEach((worker, index) => {
            console.log(`Category: ${worker.category}`);
            console.log(`Name: ${worker.name}`);
            console.log(`Email: ${worker.email}`);
            console.log(`Password: ${ADMIN_PASSWORD}`);
            console.log(`Employee ID: ${worker.employeeId}`);
            console.log(`Assigned Project: PRJ001 (Test Construction Project)`);
            console.log('-'.repeat(70));
        });
        
        console.log(`\n✅ Total Worker Accounts Created: ${createdWorkers.length}\n`);

    } catch (error) {
        await conn.rollback();
        console.error('\n❌ Error creating worker accounts:', error);
        throw error;
    } finally {
        conn.release();
    }
}

// Run the creation
createWorkerAccounts()
    .then(() => {
        console.log('🎉 Worker category accounts created successfully!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Failed to create worker accounts:', error);
        process.exit(1);
    });
