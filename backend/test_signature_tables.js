const mysql = require('mysql2/promise');
require('dotenv').config();

async function testSignatureTables() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('\n🔍 Testing Signature System...\n');

        // Check if tables exist
        const [tables1] = await pool.query("SHOW TABLES LIKE 'sheet_workflows'");
        console.log('✅ sheet_workflows table:', tables1.length > 0 ? 'EXISTS' : 'MISSING');

        const [tables2] = await pool.query("SHOW TABLES LIKE 'sheet_signatures'");
        console.log('✅ sheet_signatures table:', tables2.length > 0 ? 'EXISTS' : 'MISSING');

        const [tables3] = await pool.query("SHOW TABLES LIKE 'signature_requests'");
        console.log('✅ signature_requests table:', tables3.length > 0 ? 'EXISTS' : 'MISSING');

        const [tables4] = await pool.query("SHOW TABLES LIKE 'workflow_steps'");
        console.log('✅ workflow_steps table:', tables4.length > 0 ? 'EXISTS' : 'MISSING');

        const [tables5] = await pool.query("SHOW TABLES LIKE 'universal_signatures'");
        console.log('✅ universal_signatures table:', tables5.length > 0 ? 'EXISTS' : 'MISSING');

        // Test if we can query signature status
        console.log('\n📋 Testing signature status query...');
        const [sheets] = await pool.query('SELECT id, sheet_no FROM daily_sheets LIMIT 1');
        
        if (sheets.length > 0) {
            const sheetId = sheets[0].id;
            console.log(`Testing with sheet ID: ${sheetId}`);

            try {
                // Try the query that SignatureWorkflowService uses
                const [workflows] = await pool.query(
                    'SELECT * FROM sheet_workflows WHERE sheet_id = ?',
                    [sheetId]
                );

                if (workflows.length > 0) {
                    console.log('✅ Workflow found:', workflows[0].status);
                    
                    // Try to get signature status
                    const workflow = workflows[0];
                    const [signatures] = await pool.query(
                        `SELECT us.*, r.role_name, r.role_code, u.name as signer_name
                         FROM universal_signatures us
                         INNER JOIN roles r ON us.role_id = r.id
                         LEFT JOIN users u ON us.user_id = u.id
                         WHERE us.entity_type = 'sheet' AND us.entity_id = ?
                         ORDER BY us.step_number`,
                        [sheetId]
                    );

                    console.log(`✅ Found ${signatures.length} signature(s)`);
                    signatures.forEach(sig => {
                        console.log(`   - ${sig.role_name}: ${sig.action} by ${sig.signer_name || 'Unknown'}`);
                    });
                } else {
                    console.log('⚠️  No workflow found for this sheet');
                    console.log('💡 This is normal if sheet hasn\'t been sent for signature yet');
                }
            } catch (error) {
                console.log('❌ Error querying signature status:', error.message);
            }
        } else {
            console.log('⚠️  No sheets found in database');
        }

        console.log('\n✨ Test complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

testSignatureTables();
