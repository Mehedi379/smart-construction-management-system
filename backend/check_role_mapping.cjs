const mysql = require('mysql2/promise');
require('dotenv').config();

(async()=>{
    const c=await mysql.createConnection({
        host:process.env.DB_HOST,
        user:process.env.DB_USER,
        password:process.env.DB_PASSWORD,
        database:process.env.DB_NAME
    });
    
    console.log('\n📋 Workflow Steps (role mapping):');
    const [steps]=await c.query(`
        SELECT ws.step_number, ws.role_id, r.role_code, r.role_name 
        FROM workflow_steps ws 
        JOIN roles r ON ws.role_id = r.id 
        WHERE ws.workflow_id = 2 
        ORDER BY ws.step_number
    `);
    steps.forEach(s=>console.log(`  Step ${s.step_number}: role_code=${s.role_code}, role_name=${s.role_name}`));
    
    console.log('\n📋 All roles in system:');
    const [roles]=await c.query('SELECT id, role_code, role_name FROM roles');
    roles.forEach(r=>console.log(`  ID: ${r.id}, role_code: ${r.role_code}, role_name: ${r.role_name}`));
    
    await c.end();
})();
