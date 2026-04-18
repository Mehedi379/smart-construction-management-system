const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSignatures() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_construction',
        waitForConnections: true,
        connectionLimit: 10
    });

    try {
        console.log('🔍 Checking signature_requests for sheet 26041507...\n');

        // Get sheet ID
        const [sheets] = await pool.query(
            'SELECT id, sheet_no FROM daily_sheets WHERE sheet_no = ?',
            ['26041507']
        );

        if (sheets.length === 0) {
            console.log('❌ Sheet 26041507 not found');
            return;
        }

        const sheetId = sheets[0].id;
        console.log(`✅ Sheet ID: ${sheetId}\n`);

        // Get signature requests
        const [requests] = await pool.query(
            `SELECT 
                sr.id,
                sr.role_code,
                sr.role_name,
                sr.status,
                sr.requested_by,
                sr.signed_by,
                sr.signed_at,
                sr.signature_data,
                sr.comments,
                u1.name as requested_by_name,
                u2.name as signed_by_name
             FROM signature_requests sr
             LEFT JOIN users u1 ON sr.requested_by = u1.id
             LEFT JOIN users u2 ON sr.signed_by = u2.id
             WHERE sr.sheet_id = ?
             ORDER BY FIELD(sr.role_code, 'site_manager', 'head_office_accounts', 'engineer', 'deputy_director', 'project_director')`,
            [sheetId]
        );

        console.log(`📋 Found ${requests.length} signature requests:\n`);

        requests.forEach((req, i) => {
            console.log(`${i + 1}. ${req.role_name}`);
            console.log(`   Role Code: ${req.role_code}`);
            console.log(`   Status: ${req.status}`);
            console.log(`   Requested By: ${req.requested_by_name || 'N/A'}`);
            console.log(`   Signed By: ${req.signed_by_name || 'Not signed'}`);
            console.log(`   Signed At: ${req.signed_at || 'N/A'}`);
            console.log(`   Has Signature Data: ${req.signature_data ? 'YES ✓' : 'NO ✗'}`);
            console.log(`   Signature Data Length: ${req.signature_data ? req.signature_data.length : 0}`);
            console.log('');
        });

        // Check specifically for deputy_director
        const deputySig = requests.find(r => r.role_code === 'deputy_director');
        if (deputySig) {
            console.log('🔍 Deputy Director Signature Details:');
            console.log(`   Status: ${deputySig.status}`);
            console.log(`   Signed By: ${deputySig.signed_by_name}`);
            console.log(`   Has Signature: ${deputySig.signature_data ? 'YES' : 'NO'}`);
            
            if (deputySig.signature_data) {
                console.log(`   Signature starts with: ${deputySig.signature_data.substring(0, 50)}...`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSignatures();
