const mysql = require('mysql2/promise');
require('dotenv').config();

(async function(){
    const c=await mysql.createConnection({
        host:process.env.DB_HOST,
        user:process.env.DB_USER,
        password:process.env.DB_PASSWORD,
        database:process.env.DB_NAME
    });
    
    console.log('\n=== Deputy Director User ===');
    const [users]=await c.query('SELECT id,name,email,role FROM users WHERE role="deputy_director"');
    console.log('User found:', users.length > 0);
    if(users.length > 0) {
        console.log('User ID:', users[0].id);
        console.log('User Name:', users[0].name);
        console.log('User Role:', users[0].role);
    }
    
    console.log('\n=== Signature Requests for deputy_director ===');
    const [reqs]=await c.query('SELECT id, sheet_id, role_code, status, requested_by FROM signature_requests WHERE role_code="deputy_director"');
    console.log('Total requests:', reqs.length);
    reqs.forEach(r => {
        console.log(`Request ID: ${r.id}, Sheet: ${r.sheet_id}, Status: ${r.status}, Requested By: ${r.requested_by}`);
    });
    
    console.log('\n=== Requests with status=requested (Pending) ===');
    const [pending]=await c.query('SELECT * FROM signature_requests WHERE role_code="deputy_director" AND status="requested"');
    console.log('Pending requests:', pending.length);
    pending.forEach(r => {
        console.log(`Pending: Sheet ${r.sheet_id}, Requested by: ${r.requested_by}, At: ${r.requested_at}`);
    });
    
    await c.end();
})();
