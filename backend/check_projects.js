const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkProjects() {
    console.log('\n📋 Checking Projects in Database...\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });
        
        const [projects] = await connection.query(
            'SELECT id, project_code, project_name, status FROM projects ORDER BY id'
        );
        
        if (projects.length === 0) {
            console.log('❌ No projects found in database!');
            console.log('\nCreate a project first:');
            console.log('1. Login as admin');
            console.log('2. Go to Projects page');
            console.log('3. Click "New Project"');
            console.log('4. Create at least one project\n');
        } else {
            console.log(`✅ Found ${projects.length} projects:\n`);
            projects.forEach((p, i) => {
                const statusIcon = (p.status === 'ongoing' || p.status === 'planning') ? '✅' : '❌';
                console.log(`${i+1}. ${p.project_name} (${p.project_code}) - ${p.status} ${statusIcon}`);
            });
            console.log('\n✅ Projects exist! After backend restart, they will show in registration.\n');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkProjects();
