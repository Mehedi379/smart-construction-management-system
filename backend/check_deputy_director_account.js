const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDeputyDirectorAccount() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n' + '='.repeat(70));
        console.log('🔍 CHECKING DEPUTY DIRECTOR ACCOUNT');
        console.log('='.repeat(70) + '\n');

        // Check for deputy_director users
        const [users] = await connection.query(`
            SELECT 
                id, name, email, role, phone,
                is_approved, is_active,
                created_at, last_login
            FROM users 
            WHERE role = 'deputy_director'
            ORDER BY id DESC
        `);

        if (users.length === 0) {
            console.log('❌ No Deputy Director accounts found!\n');
            console.log('💡 To create a Deputy Director account:');
            console.log('   1. Go to Registration page');
            console.log('   2. Select "Deputy Director" role');
            console.log('   3. Fill in details and register');
            console.log('   4. Admin must approve the account\n');
            return;
        }

        console.log(`✅ Found ${users.length} Deputy Director account(s):\n`);

        users.forEach((user, index) => {
            console.log(`${index + 1}. Deputy Director #${user.id}`);
            console.log('   ' + '-'.repeat(50));
            console.log(`   👤 Name: ${user.name}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   📱 Phone: ${user.phone || 'Not provided'}`);
            console.log(`   👔 Role: ${user.role}`);
            console.log(`   ✅ Approved: ${user.is_approved ? 'Yes' : 'No'}`);
            console.log(`   🟢 Active: ${user.is_active ? 'Yes' : 'No'}`);
            console.log(`   📅 Created: ${new Date(user.created_at).toLocaleString('en-GB')}`);
            console.log(`   🔑 Last Login: ${user.last_login ? new Date(user.last_login).toLocaleString('en-GB') : 'Never'}`);
            console.log('');
        });

        // Check if they can login
        console.log('🔐 LOGIN STATUS CHECK:');
        console.log('   ' + '-'.repeat(50));
        
        users.forEach(user => {
            const canLogin = user.is_approved && user.is_active;
            const status = canLogin ? '✅ CAN LOGIN' : '❌ CANNOT LOGIN';
            const reason = !canLogin ? 
                (!user.is_approved ? '(Not approved by admin)' :
                 '(Account inactive)') : '';
            
            console.log(`   ${user.email}: ${status} ${reason}`);
        });

        console.log('');

        // Check signature requests for this role
        console.log('✍️  SIGNATURE REQUESTS FOR DEPUTY DIRECTOR:');
        console.log('   ' + '-'.repeat(50));
        
        const [sigRequests] = await connection.query(`
            SELECT 
                sr.id,
                sr.sheet_id,
                ds.sheet_no,
                p.project_name,
                sr.status,
                sr.requested_by,
                sr.requested_at,
                sr.signed_by,
                sr.signed_at,
                u.name as requested_by_name
            FROM signature_requests sr
            LEFT JOIN daily_sheets ds ON sr.sheet_id = ds.id
            LEFT JOIN projects p ON ds.project_id = p.id
            LEFT JOIN users u ON sr.requested_by = u.id
            WHERE sr.role_code = 'deputy_director'
            ORDER BY sr.id DESC
            LIMIT 10
        `);

        if (sigRequests.length === 0) {
            console.log('   ⚠️  No signature requests found for Deputy Director\n');
        } else {
            console.log(`   Found ${sigRequests.length} signature request(s):\n`);
            sigRequests.forEach((req, index) => {
                console.log(`   ${index + 1}. Sheet: ${req.sheet_no}`);
                console.log(`      Project: ${req.project_name || 'N/A'}`);
                console.log(`      Status: ${req.status}`);
                console.log(`      Requested by: ${req.requested_by_name || 'Unknown'}`);
                console.log(`      Requested at: ${req.requested_at ? new Date(req.requested_at).toLocaleString('en-GB') : 'N/A'}`);
                if (req.status === 'signed') {
                    console.log(`      Signed at: ${new Date(req.signed_at).toLocaleString('en-GB')}`);
                }
                console.log('');
            });
        }

        // Check all roles in system
        console.log('📊 ALL USER ROLES IN SYSTEM:');
        console.log('   ' + '-'.repeat(50));
        
        const [roleStats] = await connection.query(`
            SELECT role, COUNT(*) as count
            FROM users
            GROUP BY role
            ORDER BY count DESC
        `);

        roleStats.forEach(stat => {
            console.log(`   ${stat.role}: ${stat.count} user(s)`);
        });

        console.log('\n' + '='.repeat(70));
        console.log('✅ DEPUTY DIRECTOR ACCOUNT CHECK COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkDeputyDirectorAccount();
