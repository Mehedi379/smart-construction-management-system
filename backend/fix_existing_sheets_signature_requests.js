const pool = require('./src/config/database');

(async () => {
    try {
        console.log('🔍 Checking sheets without signature requests...\n');

        // Find all sheets
        const [sheets] = await pool.query('SELECT id, sheet_no FROM daily_sheets');
        console.log(`Found ${sheets.length} sheets\n`);

        for (const sheet of sheets) {
            // Check if signature requests exist
            const [existing] = await pool.query(
                'SELECT COUNT(*) as count FROM signature_requests WHERE sheet_id = ?',
                [sheet.id]
            );

            if (existing[0].count === 0) {
                console.log(`⚠️  Sheet ${sheet.sheet_no} (ID: ${sheet.id}) has NO signature requests`);
                
                // Delete any old workflow
                await pool.query('DELETE FROM sheet_workflows WHERE sheet_id = ?', [sheet.id]);
                
                // Create signature requests
                const roles = [
                    { code: 'site_manager', name: 'Site Manager Verification' },
                    { code: 'site_engineer', name: 'Site Engineer Approval' },
                    { code: 'project_director', name: 'Project Director Approval' },
                    { code: 'deputy_director', name: 'Deputy Director Review' },
                    { code: 'head_office_accounts', name: 'Head Office Accounts Approval' },
                    { code: 'head_office_admin', name: 'Head Office Admin Final Approval' }
                ];

                for (const role of roles) {
                    await pool.query(
                        `INSERT INTO signature_requests 
                        (sheet_id, role_code, role_name, requested_by, status)
                        VALUES (?, ?, ?, ?, 'not_requested')`,
                        [sheet.id, role.code, role.name, 1] // requested_by = 1 (admin)
                    );
                }

                // Create workflow
                const [templates] = await pool.query(
                    'SELECT id FROM workflow_templates WHERE entity_type = "sheet" AND is_active = TRUE LIMIT 1'
                );

                if (templates.length > 0) {
                    await pool.query(
                        'INSERT INTO sheet_workflows (sheet_id, workflow_id, current_step, status) VALUES (?, ?, 1, "pending")',
                        [sheet.id, templates[0].id]
                    );
                }

                console.log(`✅ Created signature requests and workflow for sheet ${sheet.sheet_no}\n`);
            } else {
                console.log(`✅ Sheet ${sheet.sheet_no} (ID: ${sheet.id}) already has signature requests`);
            }
        }

        console.log('\n✨ Done! All sheets now have signature requests.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
