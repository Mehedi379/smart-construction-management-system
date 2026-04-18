const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'construction_db'
    });

    // Get projects
    const [projects] = await conn.query(
        'SELECT id, project_code, project_name, location, status FROM projects ORDER BY id'
    );
    
    console.log('\n' + '='.repeat(70));
    console.log('📋 PROJECTS IN SYSTEM');
    console.log('='.repeat(70) + '\n');
    
    projects.forEach(p => {
        console.log(`${p.id}. ${p.project_code} - ${p.project_name}`);
        console.log(`   Location: ${p.location}`);
        console.log(`   Status: ${p.status}`);
        console.log('');
    });

    // Get active users
    const [users] = await conn.query(
        'SELECT id, name, email, role, is_approved, is_active FROM users WHERE is_active = 1 ORDER BY id'
    );
    
    console.log('\n' + '='.repeat(70));
    console.log('👥 ACTIVE USER ACCOUNTS');
    console.log('='.repeat(70) + '\n');
    
    users.forEach(u => {
        console.log(`${u.id}. ${u.name}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Role: ${u.role}`);
        console.log(`   Approved: ${u.is_approved ? 'Yes' : 'No'}`);
        console.log('');
    });

    console.log('\n' + '='.repeat(70));
    console.log(`📊 TOTAL: ${projects.length} projects, ${users.length} users`);
    console.log('='.repeat(70) + '\n');

    await conn.end();
})();
