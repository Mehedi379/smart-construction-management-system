const pool = require('./src/config/database');

async function diagnoseApprovalIssue() {
    try {
        console.log('🔍 DIAGNOSING APPROVAL & LOGIN ISSUE\n');
        console.log('='.repeat(60));
        
        // 1. Check all users and their approval status
        console.log('\n📊 STEP 1: Check All Users Status');
        console.log('-'.repeat(60));
        
        const [users] = await pool.query(`
            SELECT 
                id, name, email, role, 
                is_approved, is_active,
                CASE 
                    WHEN is_approved = 1 AND is_active = 1 THEN '✅ CAN LOGIN'
                    WHEN is_approved = 0 THEN '❌ NOT APPROVED'
                    WHEN is_active = 0 THEN '❌ NOT ACTIVE'
                    ELSE '❌ UNKNOWN'
                END as login_status
            FROM users
            ORDER BY id
        `);
        
        users.forEach(user => {
            console.log(`\nUser ID: ${user.id}`);
            console.log(`  Name: ${user.name}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  is_approved: ${user.is_approved}`);
            console.log(`  is_active: ${user.is_active}`);
            console.log(`  Status: ${user.login_status}`);
        });
        
        // 2. Find recently approved users
        console.log('\n\n📊 STEP 2: Recently Approved Users');
        console.log('-'.repeat(60));
        
        const [approvedUsers] = await pool.query(`
            SELECT id, name, email, role, updated_at
            FROM users
            WHERE is_approved = 1
            ORDER BY updated_at DESC
            LIMIT 5
        `);
        
        if (approvedUsers.length === 0) {
            console.log('No approved users found');
        } else {
            approvedUsers.forEach(user => {
                console.log(`✓ ${user.name} (${user.email}) - Approved at: ${user.updated_at}`);
            });
        }
        
        // 3. Test login for a specific user
        console.log('\n\n📊 STEP 3: Manual Login Test');
        console.log('-'.repeat(60));
        console.log('To test login for a user, run:');
        console.log('');
        console.log('SELECT id, name, email, is_approved, is_active');
        console.log('FROM users');
        console.log("WHERE email = 'user@email.com';");
        console.log('');
        console.log('Expected: is_approved=1, is_active=1');
        
        // 4. Check for common issues
        console.log('\n\n📊 STEP 4: Common Issues Check');
        console.log('-'.repeat(60));
        
        // Issue 1: is_approved = 0
        const [notApproved] = await pool.query(`
            SELECT COUNT(*) as count FROM users WHERE is_approved = 0
        `);
        console.log(`\n❌ Users NOT approved: ${notApproved[0].count}`);
        
        // Issue 2: is_active = 0
        const [notActive] = await pool.query(`
            SELECT COUNT(*) as count FROM users WHERE is_active = 0
        `);
        console.log(`❌ Users NOT active: ${notActive[0].count}`);
        
        // Issue 3: Both true (can login)
        const [canLogin] = await pool.query(`
            SELECT COUNT(*) as count FROM users 
            WHERE is_approved = 1 AND is_active = 1
        `);
        console.log(`✅ Users that CAN login: ${canLogin[0].count}`);
        
        // 5. Show fix commands
        console.log('\n\n📊 STEP 5: Fix Commands (if needed)');
        console.log('-'.repeat(60));
        console.log('\nIf user is approved but can\'t login, run these SQL commands:');
        console.log('');
        console.log('-- Fix specific user (replace email)');
        console.log("UPDATE users SET is_approved = 1, is_active = 1 WHERE email = 'user@email.com';");
        console.log('');
        console.log('-- Verify the fix');
        console.log("SELECT is_approved, is_active FROM users WHERE email = 'user@email.com';");
        console.log('');
        console.log('-- Fix ALL pending users');
        console.log('UPDATE users SET is_approved = 1, is_active = 1 WHERE is_approved = 0;');
        
        // 6. Admin Panel auto-refresh check
        console.log('\n\n📊 STEP 6: Admin Panel Auto-Refresh');
        console.log('-'.repeat(60));
        console.log('\nCurrent behavior:');
        console.log('✓ Admin Panel fetches data on page load');
        console.log('✓ Admin Panel refreshes after approve/reject action');
        console.log('✗ Admin Panel does NOT auto-refresh every X seconds');
        console.log('\nTo see updated data:');
        console.log('1. Refresh the page (F5)');
        console.log('2. OR click on different tab and come back');
        console.log('3. OR approve/reject another user (triggers refresh)');
        
        console.log('\n\n' + '='.repeat(60));
        console.log('📋 SUMMARY');
        console.log('='.repeat(60));
        console.log(`\nTotal Users: ${users.length}`);
        console.log(`Can Login: ${canLogin[0].count}`);
        console.log(`Cannot Login: ${parseInt(notApproved[0].count) + parseInt(notActive[0].count)}`);
        
        if (parseInt(canLogin[0].count) > 0) {
            console.log('\n✅ Some users can login');
            console.log('If specific user can\'t login, check their is_approved and is_active values');
        }
        
        console.log('\n' + '='.repeat(60));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

diagnoseApprovalIssue();
