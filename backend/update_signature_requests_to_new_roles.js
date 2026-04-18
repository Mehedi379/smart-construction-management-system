const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateExistingSignatureRequests() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n' + '='.repeat(70));
        console.log('🔄 UPDATING EXISTING SIGNATURE REQUESTS TO NEW ROLES');
        console.log('='.repeat(70) + '\n');

        // Get all sheets
        const [sheets] = await connection.query(
            'SELECT id, sheet_no, project_id FROM daily_sheets ORDER BY id'
        );

        console.log(`📋 Found ${sheets.length} sheet(s) to update\n`);

        if (sheets.length === 0) {
            console.log('✅ No sheets found. Nothing to update.\n');
            return;
        }

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const sheet of sheets) {
            try {
                console.log(`📄 Sheet ${sheet.sheet_no} (ID: ${sheet.id})...`);

                // Check if sheet has OLD roles
                const [oldRoles] = await connection.query(
                    `SELECT COUNT(*) as count FROM signature_requests 
                     WHERE sheet_id = ? 
                     AND role_code IN ('head_office_accounts', 'engineer', 'deputy_director', 'project_director')`,
                    [sheet.id]
                );

                if (oldRoles[0].count > 0) {
                    // Delete old signature requests
                    await connection.query(
                        'DELETE FROM signature_requests WHERE sheet_id = ?',
                        [sheet.id]
                    );

                    console.log(`   🗑️  Deleted ${oldRoles[0].count} old role requests`);

                    // Create new signature requests
                    const newRoles = [
                        { code: 'site_manager', name: 'Receiver (Site Manager)' },
                        { code: 'site_engineer', name: 'Prepared By (Site Engineer)' },
                        { code: 'head_office_accounts_1', name: 'Payer 1 (Hisab Rokhok Head Office)' },
                        { code: 'head_office_accounts_2', name: 'Payer 2 (Hisab Rokhok Head Office)' },
                        { code: 'deputy_head_office', name: 'Checker (Deputy Head Office)' },
                        { code: 'site_director', name: 'Approved By (Site Director)' }
                    ];

                    // Get sheet creator
                    const [sheetData] = await connection.query(
                        'SELECT created_by FROM daily_sheets WHERE id = ?',
                        [sheet.id]
                    );

                    const createdBy = sheetData[0]?.created_by || 1;

                    for (const role of newRoles) {
                        await connection.query(
                            `INSERT INTO signature_requests 
                            (sheet_id, role_code, role_name, requested_by, status)
                            VALUES (?, ?, ?, ?, 'not_requested')`,
                            [sheet.id, role.code, role.name, createdBy]
                        );
                    }

                    console.log(`   ✅ Created 6 new role requests\n`);
                    updated++;
                } else {
                    console.log(`   ⏭️  Already has new roles (skipped)\n`);
                    skipped++;
                }
            } catch (error) {
                console.error(`   ❌ Error: ${error.message}\n`);
                errors++;
            }
        }

        console.log('='.repeat(70));
        console.log('📊 SUMMARY:');
        console.log('='.repeat(70));
        console.log(`   ✅ Updated: ${updated} sheets`);
        console.log(`   ⏭️  Skipped: ${skipped} sheets`);
        console.log(`   ❌ Errors: ${errors} sheets`);
        console.log(`   📝 Total processed: ${sheets.length} sheets`);
        console.log('='.repeat(70) + '\n');

        console.log('💡 NEW Signature Workflow (6 Roles):\n');
        console.log('   1. Site Manager (Receiver) - Self-registration');
        console.log('   2. Site Engineer (Prepared By) - Self-registration');
        console.log('   3. Hisab Rokhok Head Office 1 (Payer 1) - Admin-managed');
        console.log('   4. Hisab Rokhok Head Office 2 (Payer 2) - Admin-managed');
        console.log('   5. Deputy Head Office (Checker) - Admin-managed');
        console.log('   6. Site Director (Approved By) - Self-registration');
        console.log('');

        console.log('📝 Role Accounts:\n');
        console.log('   SELF-REGISTRATION (3 roles):');
        console.log('   ✅ Site Manager - Users register themselves');
        console.log('   ✅ Site Engineer - Users register themselves');
        console.log('   ✅ Site Director - Users register themselves');
        console.log('');
        console.log('   ADMIN-MANAGED (3 roles):');
        console.log('   ✅ Hisab Rokhok Head Office 1 - accounts.head1@khazabilkis.com');
        console.log('   ✅ Hisab Rokhok Head Office 2 - accounts.head2@khazabilkis.com');
        console.log('   ✅ Deputy Head Office - deputy.head@khazabilkis.com');
        console.log('');

        console.log('='.repeat(70));
        console.log('✅ SIGNATURE REQUESTS UPDATE COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Failed:', error.message);
        console.error('   Error code:', error.code);
    } finally {
        if (connection) await connection.end();
    }
}

updateExistingSignatureRequests();
