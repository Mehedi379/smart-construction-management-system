const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    console.log('\n' + '='.repeat(70));
    console.log('📊 CHECKING ROLES IN DATABASE');
    console.log('='.repeat(70) + '\n');

    // Get all roles
    const [roles] = await conn.query('SELECT * FROM roles ORDER BY id');
    
    console.log('Current Roles:\n');
    roles.forEach(role => {
        console.log(`${role.id}. ${role.name} (${role.code})`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n💡 Which roles to keep?');
    console.log('   - admin');
    console.log('   - accountant');
    console.log('   - engineer');
    console.log('   - site_engineer');
    console.log('   - site_manager');
    console.log('   - worker');
    console.log('   - project_director');
    console.log('   - deputy_director');
    console.log('\n' + '='.repeat(70) + '\n');

    await conn.end();
})();
