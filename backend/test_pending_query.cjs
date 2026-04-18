const mysql = require('mysql2/promise');
require('dotenv').config();

(async function(){
    const c=await mysql.createConnection({
        host:process.env.DB_HOST,
        user:process.env.DB_USER,
        password:process.env.DB_PASSWORD,
        database:process.env.DB_NAME
    });
    
    console.log('\n=== Testing Fixed Query for Deputy Director ===\n');
    
    const userId = 10; // Deputy Director user ID
    
    // Get user's role
    const [user] = await c.query('SELECT role FROM users WHERE id = ?', [userId]);
    console.log('User ID:', userId);
    console.log('User Role:', user[0].role);
    console.log('');
    
    // Test the NEW query (from signature_requests)
    console.log('=== Testing NEW Query (signature_requests table) ===');
    const [pending] = await c.query(
        `SELECT 
            sr.id as request_id,
            ds.id as sheet_id,
            ds.sheet_no,
            ds.sheet_date,
            ds.project_id,
            p.project_name,
            ds.total_amount,
            sr.role_code as required_role_code,
            sr.role_name as required_role,
            sr.status as request_status,
            sr.requested_at,
            'sheet' as entity_type
        FROM signature_requests sr
        INNER JOIN daily_sheets ds ON sr.sheet_id = ds.id
        INNER JOIN projects p ON ds.project_id = p.id
        WHERE sr.role_code = ?
        AND sr.status = 'requested'
        ORDER BY sr.requested_at DESC`,
        [user[0].role]
    );
    
    console.log('Pending signatures found:', pending.length);
    console.log('');
    
    if(pending.length > 0) {
        console.log('✅ SUCCESS! Pending signatures:');
        pending.forEach(p => {
            console.log(`\n  Sheet: ${p.sheet_no}`);
            console.log(`  Project: ${p.project_name}`);
            console.log(`  Amount: ৳${p.total_amount}`);
            console.log(`  Role: ${p.required_role}`);
            console.log(`  Requested At: ${p.requested_at}`);
            console.log(`  Status: ${p.request_status}`);
        });
    } else {
        console.log('❌ No pending signatures found');
    }
    
    await c.end();
})();
