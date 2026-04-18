const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeSignatureRequests() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n' + '='.repeat(70));
        console.log('🔧 INITIALIZING SIGNATURE REQUESTS FOR EXISTING SHEETS');
        console.log('='.repeat(70) + '\n');

        // Get all sheets that don't have signature requests
        const [sheets] = await connection.query(`
            SELECT ds.id, ds.sheet_no, ds.project_id, ds.created_by, ds.status
            FROM daily_sheets ds
            WHERE NOT EXISTS (
                SELECT 1 FROM signature_requests sr WHERE sr.sheet_id = ds.id
            )
            ORDER BY ds.id
        `);

        console.log(`📋 Found ${sheets.length} sheet(s) without signature requests\n`);

        if (sheets.length === 0) {
            console.log('✅ All sheets already have signature requests!');
            return;
        }

        // Define the 5 signature roles
        const roles = [
            { code: 'site_manager', name: 'Receiver (Site Manager)' },
            { code: 'head_office_accounts', name: 'Payer (Accounts)' },
            { code: 'engineer', name: 'Prepared By (Engineer)' },
            { code: 'deputy_director', name: 'Checked By (Deputy Director)' },
            { code: 'project_director', name: 'Approved By (Project Director)' }
        ];

        let initialized = 0;
        let errors = 0;

        for (const sheet of sheets) {
            try {
                console.log(`📄 Sheet ${sheet.sheet_no} (ID: ${sheet.id})...`);
                
                // Create signature requests for all 5 roles
                for (const role of roles) {
                    await connection.query(
                        `INSERT INTO signature_requests 
                        (sheet_id, role_code, role_name, requested_by, status)
                        VALUES (?, ?, ?, ?, 'not_requested')`,
                        [sheet.id, role.code, role.name, sheet.created_by]
                    );
                }
                
                console.log(`   ✅ Initialized ${roles.length} signature requests\n`);
                initialized++;
            } catch (error) {
                console.error(`   ❌ Error: ${error.message}\n`);
                errors++;
            }
        }

        console.log('='.repeat(70));
        console.log('📊 SUMMARY:');
        console.log('='.repeat(70));
        console.log(`   ✅ Successfully initialized: ${initialized} sheets`);
        console.log(`   ❌ Errors: ${errors} sheets`);
        console.log(`   📝 Total signature requests created: ${initialized * 5}`);
        console.log('='.repeat(70) + '\n');

        console.log('💡 Next Steps:');
        console.log('   1. Refresh your browser');
        console.log('   2. Go to Daily Sheets page');
        console.log('   3. Click "View" on any sheet');
        console.log('   4. Scroll down to "Signature Requests" section');
        console.log('   5. You should now see "Send Request" buttons!\n');

    } catch (error) {
        console.error('❌ Failed to initialize signature requests:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

initializeSignatureRequests();
