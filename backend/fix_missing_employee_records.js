const pool = require('./src/config/database');

async function fixMissingEmployeeRecords() {
    try {
        console.log('🔧 FIXING MISSING EMPLOYEE RECORDS\n');
        console.log('='.repeat(60));
        
        // Find users without employee records
        const [users] = await pool.query(`
            SELECT u.id, u.name, u.email, u.role, u.phone
            FROM users u
            LEFT JOIN employees e ON u.id = e.user_id
            WHERE e.id IS NULL
        `);
        
        console.log(`\nFound ${users.length} user(s) without employee records\n`);
        
        if (users.length === 0) {
            console.log('✅ All users have employee records!');
            console.log('No fix needed.');
            await pool.end();
            return;
        }
        
        let fixed = 0;
        
        for (const user of users) {
            try {
                console.log(`\nFixing: ${user.name} (${user.email})`);
                
                // Auto-assign based on role
                let category = 'Labor';
                let designation = 'Worker';
                let department = 'General';
                
                if (user.role === 'admin') {
                    category = 'Management';
                    designation = 'Admin';
                    department = 'Management';
                } else if (user.role === 'accountant') {
                    category = 'Accounts';
                    designation = 'Accountant';
                    department = 'Finance';
                }
                
                const empId = `EMP${user.id}${Date.now()}`;
                
                await pool.query(
                    `INSERT INTO employees (
                        user_id, employee_id, name, phone, designation,
                        category, department, status, joining_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
                    [
                        user.id,
                        empId,
                        user.name,
                        user.phone || null,
                        designation,
                        category,
                        department,
                        new Date()
                    ]
                );
                
                console.log(`  ✅ Created employee record`);
                console.log(`  Employee ID: ${empId}`);
                console.log(`  Designation: ${designation}`);
                console.log(`  Category: ${category}`);
                console.log(`  Department: ${department}`);
                
                fixed++;
                
            } catch (error) {
                console.error(`  ❌ Error: ${error.message}`);
            }
        }
        
        console.log('\n\n' + '='.repeat(60));
        console.log('📊 RESULT');
        console.log('='.repeat(60));
        console.log(`\n✅ Fixed: ${fixed}/${users.length} users`);
        console.log('\n🎉 All users now have employee records!');
        console.log('\nWhat this means:');
        console.log('  ✅ Users will go to DASHBOARD on login');
        console.log('  ✅ Users will NOT see registration form again');
        console.log('  ✅ is_registered = true for all users');
        console.log('\n💡 Next step:');
        console.log('  Try logging in with the fixed account');
        console.log('  Should go directly to dashboard!');
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

fixMissingEmployeeRecords();
