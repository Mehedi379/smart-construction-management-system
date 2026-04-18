const pool = require('./src/config/database');

async function checkUsers() {
    try {
        // Check Deputy Director users
        const [deputyDirectors] = await pool.query(
            'SELECT id, name, email, role FROM users WHERE role = "deputy_director"'
        );
        
        console.log('📋 Deputy Director Users:');
        if (deputyDirectors.length === 0) {
            console.log('   ❌ No Deputy Director accounts found!');
        } else {
            deputyDirectors.forEach(u => {
                console.log(`   ✓ ${u.name} (${u.email})`);
            });
        }

        // Check all roles
        const [allRoles] = await pool.query(
            'SELECT DISTINCT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role'
        );
        
        console.log('\n📊 All User Roles:');
        allRoles.forEach(r => {
            console.log(`   ${r.role}: ${r.count} user(s)`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkUsers();
