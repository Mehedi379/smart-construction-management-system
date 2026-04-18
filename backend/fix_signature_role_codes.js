// ============================================
// FIX SIGNATURE REQUEST ROLE CODES
// Map generic roles to actual user roles
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('\n' + '='.repeat(60));
console.log('🔧 FIXING SIGNATURE REQUEST ROLE CODES');
console.log('='.repeat(60) + '\n');

// Role mapping: generic role_code -> actual user role
const ROLE_MAPPING = {
    'receiver': 'site_manager',
    'payer': 'head_office_accounts',
    'prepared_by': 'engineer',
    'checked_by': 'deputy_director',
    'approved_by': 'project_director'
};

async function fixRoleCodes() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Connected to database\n');
        
        // Update all signature requests
        for (const [genericRole, actualRole] of Object.entries(ROLE_MAPPING)) {
            console.log(`\n📝 Updating: ${genericRole} → ${actualRole}`);
            
            const [result] = await connection.query(
                'UPDATE signature_requests SET role_code = ? WHERE role_code = ?',
                [actualRole, genericRole]
            );
            
            console.log(`  ✅ Updated ${result.affectedRows} requests`);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ ROLE CODES FIXED!');
        console.log('='.repeat(60));
        
        // Verify the fix
        console.log('\n📋 Verifying fix:');
        const [requests] = await connection.query(
            'SELECT role_code, status, COUNT(*) as count FROM signature_requests GROUP BY role_code, status'
        );
        requests.forEach(r => console.log(`  ${r.role_code}: ${r.status} (${r.count})`));
        
        console.log('\n🎉 Now Deputy Director will see requests for checked_by role!');
        console.log('\n📋 Next Steps:');
        console.log('1. Restart backend server');
        console.log('2. Login as Deputy Director');
        console.log('3. Check "Pending Signatures"');
        console.log('4. You should now see the request!');
        console.log('');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the fix
fixRoleCodes();
