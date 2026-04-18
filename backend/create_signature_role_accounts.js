const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createSignatureRoleAccounts() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n' + '='.repeat(70));
        console.log('🔧 CREATING SIGNATURE ROLE ACCOUNTS (ADMIN-MANAGED)');
        console.log('='.repeat(70) + '\n');

        // Get all projects
        const [projects] = await connection.query(
            'SELECT id, project_name, status FROM projects WHERE status IN ("active", "ongoing") ORDER BY id'
        );

        console.log(`📋 Found ${projects.length} active project(s)\n`);

        if (projects.length === 0) {
            console.log('⚠️  No active projects found. Please create projects first.\n');
            return;
        }

        // Define signature roles
        const signatureRoles = [
            {
                code: 'site_manager',
                name: 'Receiver (Site Manager)',
                baseEmail: 'site.manager',
                description: 'Receives payment and materials'
            },
            {
                code: 'head_office_accounts',
                name: 'Payer (Accounts)',
                baseEmail: 'accounts',
                description: 'Handles payments and accounts'
            },
            {
                code: 'engineer',
                name: 'Prepared By (Engineer)',
                baseEmail: 'engineer',
                description: 'Prepares daily sheets'
            },
            {
                code: 'deputy_director',
                name: 'Checked By (Deputy Director)',
                baseEmail: 'deputy.director',
                description: 'Checks and verifies sheets'
            },
            {
                code: 'project_director',
                name: 'Approved By (Project Director)',
                baseEmail: 'project.director',
                description: 'Final approval authority'
            }
        ];

        let created = 0;
        let skipped = 0;
        let errors = 0;
        const accounts = [];

        for (const project of projects) {
            console.log(`\n📁 Project: ${project.project_name} (ID: ${project.id})`);
            console.log('   ' + '-'.repeat(60));

            for (const role of signatureRoles) {
                try {
                    // Create project-specific email
                    const email = `${role.baseEmail}.p${project.id}@khazabilkis.com`;
                    const password = `${role.code}123`;
                    const name = `${role.name.split('(')[0].trim()} - Project ${project.id}`;

                    // Check if account already exists
                    const [existing] = await connection.query(
                        'SELECT id FROM users WHERE email = ?',
                        [email]
                    );

                    if (existing.length > 0) {
                        console.log(`   ⏭️  ${role.name} - Already exists (ID: ${existing[0].id})`);
                        skipped++;
                        continue;
                    }

                    // Hash password
                    const hashedPassword = await bcrypt.hash(password, 10);

                    // Create account
                    const [result] = await connection.query(
                        `INSERT INTO users 
                        (name, email, phone, role, password, is_approved, is_active, created_at)
                        VALUES (?, ?, ?, ?, ?, 1, 1, NOW())`,
                        [
                            name,
                            email,
                            '+880-0000000000',
                            role.code,
                            hashedPassword
                        ]
                    );

                    const userId = result.insertId;
                    accounts.push({
                        project: project.project_name,
                        projectId: project.id,
                        role: role.name,
                        roleCode: role.code,
                        email: email,
                        password: password,
                        userId: userId
                    });

                    console.log(`   ✅ ${role.name} - Created (ID: ${userId})`);
                    created++;
                } catch (error) {
                    console.error(`   ❌ ${role.name} - Error: ${error.message}`);
                    errors++;
                }
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('📊 SUMMARY:');
        console.log('='.repeat(70));
        console.log(`   ✅ Created: ${created} accounts`);
        console.log(`   ⏭️  Skipped: ${skipped} accounts (already exist)`);
        console.log(`   ❌ Errors: ${errors} accounts`);
        console.log(`   📝 Total: ${created + skipped + errors} accounts`);
        console.log('='.repeat(70) + '\n');

        if (accounts.length > 0) {
            console.log('📋 NEW ACCOUNT CREDENTIALS:\n');
            console.log('   ' + '='.repeat(65));
            console.log('   Project | Role | Email | Password | User ID');
            console.log('   ' + '='.repeat(65));
            
            accounts.forEach(acc => {
                console.log(`   Project: ${acc.project} (ID: ${acc.projectId})`);
                console.log(`   Role: ${acc.role}`);
                console.log(`   Email: ${acc.email}`);
                console.log(`   Password: ${acc.password}`);
                console.log(`   User ID: ${acc.userId}`);
                console.log('   ' + '-'.repeat(65));
            });
            
            console.log('\n');
        }

        console.log('💡 IMPORTANT NOTES:');
        console.log('   1. These accounts are PRE-CREATED and ADMIN-MANAGED');
        console.log('   2. Users do NOT need to register - Admin provides credentials');
        console.log('   3. Each project has its own set of signature role accounts');
        console.log('   4. Accounts are auto-detected by role code and project ID');
        console.log('   5. All ID-wise calculations work automatically');
        console.log('');

        console.log('🔐 Account Pattern:');
        console.log('   Email: [role].p[projectId]@khazabilkis.com');
        console.log('   Password: [roleCode]123');
        console.log('');
        console.log('   Examples:');
        console.log('   - site.manager.p1@khazabilkis.com / site_manager123');
        console.log('   - accounts.p1@khazabilkis.com / head_office_accounts123');
        console.log('   - engineer.p1@khazabilkis.com / engineer123');
        console.log('   - deputy.director.p1@khazabilkis.com / deputy_director123');
        console.log('   - project.director.p1@khazabilkis.com / project_director123');
        console.log('');

        // Remove signature roles from registration dropdown
        console.log('📝 Next Steps:');
        console.log('   1. Remove signature roles from registration page');
        console.log('   2. Update frontend to hide these roles from registration');
        console.log('   3. Admin can manage all accounts from User Management');
        console.log('   4. Provide credentials to respective role users');
        console.log('');

        console.log('='.repeat(70));
        console.log('✅ SIGNATURE ROLE ACCOUNTS CREATION COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Failed:', error.message);
        console.error('   Error code:', error.code);
        if (error.sql) {
            console.error('   SQL:', error.sql);
        }
    } finally {
        if (connection) await connection.end();
    }
}

createSignatureRoleAccounts();
