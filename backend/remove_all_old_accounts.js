const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeAllOldAccounts() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n' + '='.repeat(70));
        console.log('🗑️  REMOVING ALL OLD PROJECT-SPECIFIC ACCOUNTS');
        console.log('='.repeat(70) + '\n');

        // Find accounts with old email patterns
        const [oldAccounts] = await connection.query(`
            SELECT id, name, email, role
            FROM users
            WHERE email LIKE '%.p%@khazabilkis.com'
            OR email = 'deputy@test.com'
            ORDER BY id
        `);

        if (oldAccounts.length === 0) {
            console.log('✅ No old project-specific accounts found!\n');
            return;
        }

        console.log(`📋 Found ${oldAccounts.length} old account(s) to remove:\n`);

        oldAccounts.forEach((user, index) => {
            console.log(`   ${index + 1}. ID: ${user.id} | ${user.name} | ${user.email}`);
        });
        console.log('');

        console.log('⚠️  These accounts will be PERMANENTLY DELETED!\n');

        // Delete old accounts
        let deleted = 0;
        let errors = 0;

        for (const user of oldAccounts) {
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
        console.log(`   📝 Total processed: ${oldAccounts.length} accounts`);
        console.log('='.repeat(70) + '\n');

        // Show remaining accounts
        console.log('📋 Remaining Accounts in System:\n');

        const [remainingUsers] = await connection.query(`
            SELECT id, name, email, role
            FROM users
            ORDER BY id
        `);

        if (remainingUsers.length === 0) {
            console.log('   No accounts found.\n');
        } else {
            console.log('   ' + '='.repeat(65));
            console.log('   ID | Name | Email | Role');
            console.log('   ' + '='.repeat(65));
            
            remainingUsers.forEach(user => {
                const role = user.role || 'admin';
                console.log(`   ${user.id} | ${user.name} | ${user.email} | ${role}`);
            });
            console.log('');
        }

        console.log('💡 CLEAN Signature Role System:');
        console.log('');
        console.log('   MAIN ADMIN (1):');
        console.log('   ✅ admin@test.com - Full system control');
        console.log('');
        console.log('   ADMIN-MANAGED OFFICE ROLES (3):');
        console.log('   ✅ accounts.head1@khazabilkis.com - Hisab Rokhok Head Office 1');
        console.log('   ✅ accounts.head2@khazabilkis.com - Hisab Rokhok Head Office 2');
        console.log('   ✅ deputy.head@khazabilkis.com - Deputy Head Office');
        console.log('');
        console.log('   SELF-REGISTRATION ROLES (3):');
        console.log('   ✅ Site Manager - Users register themselves');
        console.log('   ✅ Site Engineer - Users register themselves');
        console.log('   ✅ Site Director - Users register themselves');
        console.log('');

        console.log('='.repeat(70));
        console.log('✅ ALL OLD ACCOUNTS REMOVAL COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Failed:', error.message);
        console.error('   Error code:', error.code);
    } finally {
        if (connection) await connection.end();
    }
}

removeAllOldAccounts();

