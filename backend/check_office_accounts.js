const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkOfficeAccounts() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n' + '='.repeat(70));
        console.log('🔍 CHECKING OFFICE ROLE ACCOUNTS');
        console.log('='.repeat(70) + '\n');

        // Check if accounts exist
        const officeEmails = [
            'accounts.head1@khazabilkis.com',
            'accounts.head2@khazabilkis.com',
            'deputy.head@khazabilkis.com'
        ];

        console.log('📋 Checking accounts:\n');

        for (const email of officeEmails) {
            const [users] = await connection.query(
                'SELECT id, name, email, role, is_approved, is_active, password FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                console.log(`❌ ${email} - NOT FOUND`);
            } else {
                const user = users[0];
                console.log(`✅ ${email}`);
                console.log(`   ID: ${user.id}`);
                console.log(`   Name: ${user.name}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Approved: ${user.is_approved ? 'Yes' : 'No'}`);
                console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
                
                // Test password
                const passwords = {
                    'accounts.head1@khazabilkis.com': 'headofficeaccounts1123',
                    'accounts.head2@khazabilkis.com': 'headofficeaccounts2123',
                    'deputy.head@khazabilkis.com': 'deputyheadoffice123'
                };
                
                const testPassword = passwords[email];
                const isPasswordValid = await bcrypt.compare(testPassword, user.password);
                
                console.log(`   Password Test: ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);
                
                if (!isPasswordValid) {
                    console.log(`   ⚠️  Password doesn't match! Creating correct password...`);
                    
                    // Update password
                    const newHashedPassword = await bcrypt.hash(testPassword, 10);
                    await connection.query(
                        'UPDATE users SET password = ? WHERE email = ?',
                        [newHashedPassword, email]
                    );
                    console.log(`   ✅ Password updated successfully!`);
                    
                    // Verify again
                    const [updatedUser] = await connection.query(
                        'SELECT password FROM users WHERE email = ?',
                        [email]
                    );
                    const verifyPassword = await bcrypt.compare(testPassword, updatedUser[0].password);
                    console.log(`   Verification: ${verifyPassword ? '✅ VALID' : '❌ INVALID'}`);
                }
                
                console.log('');
            }
        }

        // Show all users in database
        console.log('\n📊 All Users in Database:\n');
        const [allUsers] = await connection.query(
            'SELECT id, name, email, role, is_approved, is_active FROM users ORDER BY id'
        );

        allUsers.forEach(user => {
            const status = user.is_approved && user.is_active ? '✅ Active' : '❌ Inactive';
            console.log(`   ${user.id}. ${user.email} | ${user.role || '(no role)'} | ${status}`);
        });

        console.log('\n' + '='.repeat(70));
        console.log('✅ CHECK COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('   Error code:', error.code);
    } finally {
        if (connection) await connection.end();
    }
}

checkOfficeAccounts();
