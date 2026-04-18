const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeOldSignatureAccounts() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n' + '='.repeat(70));
        console.log('🗑️  REMOVING OLD SIGNATURE ROLE ACCOUNTS');
        console.log('='.repeat(70) + '\n');

        // Define old role codes to remove
        const oldRoles = [
            'site_manager',
            'head_office_accounts',
            'engineer',
            'deputy_director',
            'project_director'
        ];

        console.log('📋 Old roles to remove:');
        oldRoles.forEach(role => console.log(`   - ${role}`));
        console.log('');

        // Get all users with old roles
        const [oldUsers] = await connection.query(
            `SELECT id, name, email, role 
             FROM users 
             WHERE role IN (?, ?, ?, ?, ?)
             ORDER BY id`,
            oldRoles
        );

        if (oldUsers.length === 0) {
            console.log('✅ No old signature role accounts found!\n');
            return;
        }

        console.log(`📋 Found ${oldUsers.length} old account(s) to remove:\n`);

        oldUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ID: ${user.id} | ${user.name} | ${user.email} | Role: ${user.role}`);
        });
        console.log('');

        // Ask for confirmation (auto-confirm for script)
        console.log('⚠️  These accounts will be PERMANENTLY DELETED!\n');

        // Delete old accounts
        let deleted = 0;
        let errors = 0;

        for (const user of oldUsers) {
            try {
                await connection.query(
                    'DELETE FROM users WHERE id = ?',
                    [user.id]
                );
                console.log(`   ✅ Deleted: ${user.email} (ID: ${user.id})`);
                deleted++;
            } catch (error) {
                console.error(`   ❌ Failed to delete ${user.email}: ${error.message}`);
                errors++;
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('📊 SUMMARY:');
        console.log('='.repeat(70));
        console.log(`   ✅ Deleted: ${deleted} accounts`);
        console.log(`   ❌ Errors: ${errors} accounts`);
        console.log(`   📝 Total processed: ${oldUsers.length} accounts`);
        console.log('='.repeat(70) + '\n');

        // Show remaining accounts
        console.log('📋 Remaining Signature Role Accounts:\n');

        const [remainingUsers] = await connection.query(`
            SELECT id, name, email, role, is_approved, is_active
            FROM users
            WHERE role IN (
                'site_manager', 'site_engineer', 'site_director',
                'head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office',
                'admin', 'accountant', 'employee'
            )
            ORDER BY id
        `);

        if (remainingUsers.length === 0) {
            console.log('   No accounts found.\n');
        } else {
            console.log('   ' + '='.repeat(65));
            console.log('   ID | Name | Email | Role');
            console.log('   ' + '='.repeat(65));
            
            remainingUsers.forEach(user => {
                console.log(`   ${user.id} | ${user.name} | ${user.email} | ${user.role}`);
            });
            console.log('');
        }

        console.log('💡 NEW Signature Role System:');
        console.log('');
        console.log('   SELF-REGISTRATION (3 roles):');
        console.log('   ✅ site_manager - Users register themselves');
        console.log('   ✅ site_engineer - Users register themselves');
        console.log('   ✅ site_director - Users register themselves');
        console.log('');
        console.log('   ADMIN-MANAGED (3 roles):');
        console.log('   ✅ head_office_accounts_1 - accounts.head1@khazabilkis.com');
        console.log('   ✅ head_office_accounts_2 - accounts.head2@khazabilkis.com');
        console.log('   ✅ deputy_head_office - deputy.head@khazabilkis.com');
        console.log('');
        console.log('   MAIN ADMIN:');
        console.log('   ✅ admin - admin@khazabilkis.com');
        console.log('');

        console.log('='.repeat(70));
        console.log('✅ OLD SIGNATURE ROLE ACCOUNTS REMOVAL COMPLETE');
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

removeOldSignatureAccounts();

