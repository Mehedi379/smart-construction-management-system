const mysql = require('mysql2/promise');
require('dotenv').config();

(async()=>{
    const c=await mysql.createConnection({
        host:process.env.DB_HOST,
        user:process.env.DB_USER,
        password:process.env.DB_PASSWORD,
        database:process.env.DB_NAME
    });
    
    console.log('\n📋 Users with deputy_director role:');
    const [users]=await c.query('SELECT id, name, email, role FROM users WHERE role="deputy_director"');
    users.forEach(u=>console.log(`  ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`));
    
    console.log('\n📋 Signature requests with role_code=checked_by (Deputy Director):');
    const [requests]=await c.query('SELECT sr.id, sr.sheet_id, sr.status, sr.requested_by, ds.sheet_no FROM signature_requests sr JOIN daily_sheets ds ON sr.sheet_id=ds.id WHERE sr.role_code="checked_by"');
    requests.forEach(r=>console.log(`  Request ID: ${r.id}, Sheet: ${r.sheet_no}, Status: ${r.status}, Requested By: ${r.requested_by}`));
    
    console.log('\n📋 All signature requests statuses:');
    const [allRequests]=await c.query('SELECT role_code, status, COUNT(*) as count FROM signature_requests GROUP BY role_code, status');
    allRequests.forEach(r=>console.log(`  ${r.role_code}: ${r.status} (${r.count})`));
    
    await c.end();
})();
