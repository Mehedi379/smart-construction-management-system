const pool = require('./src/config/database');

async function checkNewUserRegistration() {
    try {
        console.log('🔍 CHECKING NEW USER REGISTRATION ISSUE\n');
        console.log('='.repeat(60));
        
        // Find most recent user
        const [users] = await pool.query(`
            SELECT 
                u.id, u.name, u.email, u.role, u.is_approved, u.is_active,
                e.id as emp_id, e.employee_id, e.designation, e.category,
                CASE 
                    WHEN e.id IS NOT NULL THEN '✅ HAS EMPLOYEE RECORD'
                    ELSE '❌ NO EMPLOYEE RECORD'
                END as record_status
            FROM users u
            LEFT JOIN employees e ON u.id = e.user_id
            ORDER BY u.id DESC
            LIMIT 5
        `);
        
        console.log('\nRecent Users:');
        console.log('-'.repeat(60));
        
        users.forEach(user => {
            console.log(`\nUser: ${user.name}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  Approved: ${user.is_approved}`);
            console.log(`  Active: ${user.is_active}`);
            console.log(`  Employee Record: ${user.record_status}`);
            if (user.employee_id) {
                console.log(`  Employee ID: ${user.employee_id}`);
                console.log(`  Designation: ${user.designation}`);
                console.log(`  Category: ${user.category}`);
            }
            
            // Predict login behavior
            if (!user.is_approved) {
                console.log(`  🔮 On Login: Will show "Pending approval" error`);
            } else if (!user.emp_id) {
                console.log(`  🔮 On Login: Will show REGISTRATION FORM (is_registered=false)`);
            } else {
                console.log(`  🔮 On Login: Will go to DASHBOARD (is_registered=true)`);
            }
        });
        
        console.log('\n\n💡 ISSUE EXPLANATION:');
        console.log('-'.repeat(60));
        console.log('If user has NO employee record:');
        console.log('  → is_registered = false');
        console.log('  → Login page shows registration form again');
        console.log('  → User gets stuck in loop!');
        console.log('\n✅ SOLUTION:');
        console.log('  All users should have employee records');
        console.log('  Created during registration (authController.js line 50-68)');
        console.log('\nIf employee record is missing:');
        console.log('  Run: node fix_missing_employee_records.js');
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

checkNewUserRegistration();
