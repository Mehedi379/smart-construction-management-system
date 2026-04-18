// ============================================
// FIX EXISTING SHEETS - Add Missing Workflows & Signatures
// Smart Construction Management System
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('\n' + '='.repeat(60));
console.log('🔧 FIXING EXISTING SHEETS - Adding Workflows & Signatures');
console.log('='.repeat(60) + '\n');

async function fixExistingSheets() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Connected to database\n');
        
        // Get active workflow template
        const [templates] = await connection.query(
            'SELECT id FROM workflow_templates WHERE entity_type = "sheet" AND is_active = TRUE LIMIT 1'
        );
        
        if (templates.length === 0) {
            console.log('❌ No active workflow template found!');
            return;
        }
        
        const workflowTemplateId = templates[0].id;
        console.log(`✅ Using workflow template ID: ${workflowTemplateId}\n`);
        
        // Get all sheets
        const [sheets] = await connection.query('SELECT id, sheet_no FROM daily_sheets');
        console.log(`📊 Found ${sheets.length} sheets to check\n`);
        
        let fixedCount = 0;
        let alreadyFixed = 0;
        
        for (const sheet of sheets) {
            console.log(`\n📝 Checking sheet: ${sheet.sheet_no} (ID: ${sheet.id})`);
            
            // Check if workflow exists
            const [workflows] = await connection.query(
                'SELECT id FROM sheet_workflows WHERE sheet_id = ?',
                [sheet.id]
            );
            
            if (workflows.length === 0) {
                console.log('  ❌ No workflow found - Creating...');
                await connection.query(
                    'INSERT INTO sheet_workflows (sheet_id, workflow_id, current_step, status) VALUES (?, ?, 1, "draft")',
                    [sheet.id, workflowTemplateId]
                );
                console.log('  ✅ Workflow created');
                fixedCount++;
            } else {
                console.log('  ✅ Workflow already exists');
                alreadyFixed++;
            }
            
            // Note: sheet_signatures table is for actual signatures, not role placeholders
            // The signature_requests table handles role tracking
            
            // Check if signature requests exist
            const [requests] = await connection.query(
                'SELECT COUNT(*) as count FROM signature_requests WHERE sheet_id = ?',
                [sheet.id]
            );
            
            if (requests[0].count === 0) {
                console.log('  ❌ No signature requests - Initializing...');
                
                const roles = [
                    { code: 'receiver', name: 'Receiver' },
                    { code: 'payer', name: 'Payer' },
                    { code: 'prepared_by', name: 'Prepared By' },
                    { code: 'checked_by', name: 'Checked By (Deputy Director)' },
                    { code: 'approved_by', name: 'Approved By' }
                ];
                
                // Use admin user (ID 1) as requested_by
                for (const role of roles) {
                    await connection.query(
                        `INSERT INTO signature_requests 
                        (sheet_id, role_code, role_name, requested_by, status)
                        VALUES (?, ?, ?, 1, 'not_requested')`,
                        [sheet.id, role.code, role.name]
                    );
                }
                console.log('  ✅ 5 signature requests initialized');
            } else {
                console.log(`  ✅ ${requests[0].count} signature requests already exist`);
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 FIX SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Sheets Checked: ${sheets.length}`);
        console.log(`Sheets Fixed: ${fixedCount}`);
        console.log(`Already Fixed: ${alreadyFixed}`);
        console.log('');
        
        if (fixedCount > 0) {
            console.log('🎉 SUCCESS! All sheets now have workflows and signatures!');
        } else {
            console.log('✅ All sheets were already fixed!');
        }
        
        console.log('\n📋 Next Steps:');
        console.log('1. Restart backend server');
        console.log('2. Go to Daily Sheets');
        console.log('3. View any sheet');
        console.log('4. You should now see all 5 signature roles!');
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
fixExistingSheets();
