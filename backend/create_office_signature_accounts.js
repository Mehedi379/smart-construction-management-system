const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createOfficeSignatureAccounts() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n' + '='.repeat(70));
        console.log('🔧 CREATING OFFICE SIGNATURE ROLE ACCOUNTS (ADMIN-MANAGED)');
        console.log('='.repeat(70) + '\n');

        // Define 3 office signature roles
        const officeRoles = [
            {
                code: 'head_office_accounts_1',
                name: 'Hisab Rokhok Head Office (Payer 1)',
                baseEmail: 'accounts.head1',
                description: 'Head Office Accounts - Payment Handler 1'
            },
            {
                code: 'head_office_accounts_2',
                name: 'Hisab Rokhok Head Office (Payer 2)',
                baseEmail: 'accounts.head2',
                description: 'Head Office Accounts - Payment Handler 2'
            },
            {
                code: 'deputy_head_office',
                name: 'Deputy Head Office (Checker)',
                baseEmail: 'deputy.head',
                description: 'Deputy Head Office - Verification'
            }
        ];

        let created = 0;
        let skipped = 0;
        let errors = 0;
        const accounts = [];

        console.log('📝 Creating Office Signature Role Accounts:\n');

        for (const role of officeRoles) {
            try {
                // Create global email (not project-specific)
                const email = `${role.baseEmail}@khazabilkis.com`;
                const password = `${role.code.replace(/_/g, '')}123`;
                const name = role.name.split('(')[0].trim();

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

        console.log('\n' + '='.repeat(70));
        console.log('📊 SUMMARY:');
        console.log('='.repeat(70));
        console.log(`   ✅ Created: ${created} accounts`);
        console.log(`   ⏭️  Skipped: ${skipped} accounts (already exist)`);
        console.log(`   ❌ Errors: ${errors} accounts`);
        console.log(`   📝 Total: ${created + skipped + errors} accounts`);
        console.log('='.repeat(70) + '\n');

        if (accounts.length > 0) {
            console.log('📋 ACCOUNT CREDENTIALS:\n');
            console.log('   ' + '='.repeat(65));
            console.log('   Role | Email | Password | User ID');
            console.log('   ' + '='.repeat(65));
            
            accounts.forEach(acc => {
                console.log(`   Role: ${acc.role}`);
                console.log(`   Email: ${acc.email}`);
                console.log(`   Password: ${acc.password}`);
                console.log(`   User ID: ${acc.userId}`);
                console.log('   ' + '-'.repeat(65));
            });
            
            console.log('\n');
        }

        console.log('💡 IMPORTANT NOTES:');
        console.log('   1. These accounts are GLOBAL (not project-specific)');
        console.log('   2. They work across ALL projects');
        console.log('   3. Admin provides credentials to users');
        console.log('   4. Used for head office signature workflow');
        console.log('');

        console.log('🔐 Account Pattern:');
        console.log('   Email: [role]@khazabilkis.com');
        console.log('   Password: [roleCodeWithoutUnderscores]123');
        console.log('');
        console.log('   Examples:');
        console.log('   - accounts.head1@khazabilkis.com / headofficeaccounts1123');
        console.log('   - accounts.head2@khazabilkis.com / headofficeaccounts2123');
        console.log('   - deputy.head@khazabilkis.com / deputyheadoffice123');
        console.log('');

        console.log('📝 Complete Signature Role System:');
        console.log('');
        console.log('   SELF-REGISTRATION (3 roles):');
        console.log('   ✅ Site Manager (Receiver)');
        console.log('   ✅ Site Engineer (Prepared By)');
        console.log('   ✅ Site Director (Approved By)');
        console.log('');
        console.log('   ADMIN-MANAGED (3 roles):');
        console.log('   ✅ Hisab Rokhok Head Office (Payer 1)');
        console.log('   ✅ Hisab Rokhok Head Office (Payer 2)');
        console.log('   ✅ Deputy Head Office (Checker)');
        console.log('');
        console.log('   REGULAR EMPLOYEES:');
        console.log('   ✅ Accounts / Finance');
        console.log('   ✅ Labor / Worker');
        console.log('   ✅ Civil Work');
        console.log('   ✅ Electrical');
        console.log('   ✅ Plumbing');
        console.log('   ✅ Skilled Worker');
        console.log('   ✅ Technical');
        console.log('');

        console.log('='.repeat(70));
        console.log('✅ OFFICE SIGNATURE ROLE ACCOUNTS CREATION COMPLETE');
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

createOfficeSignatureAccounts();
