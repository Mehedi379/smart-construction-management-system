const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔧 Fixing Daily Sheet Workflow System...\n');
        
        // Step 1: Update existing draft sheets to pending
        console.log('📋 Step 1: Updating draft sheets to pending...');
        const [updateResult] = await pool.query(
            'UPDATE daily_sheets SET status = "pending" WHERE status = "draft" AND id IN (SELECT id FROM (SELECT id FROM daily_sheets WHERE status = "draft") as temp)'
        );
        console.log(`  ✅ Updated ${updateResult.affectedRows} sheets to pending\n`);
        
        // Step 2: Check if sheet_workflows table exists
        console.log('📋 Step 2: Checking workflow tables...');
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME IN ('sheet_workflows', 'workflow_steps', 'universal_signatures')
        `);
        
        console.log(`  Found ${tables.length} workflow tables`);
        tables.forEach(t => console.log(`    - ${t.TABLE_NAME}`));
        console.log('');
        
        // Step 3: Check workflow steps
        console.log('📋 Step 3: Checking workflow configuration...');
        const [workflows] = await pool.query('SELECT * FROM workflow_templates WHERE entity_type = "sheet" AND is_active = TRUE');
        
        if (workflows.length > 0) {
            console.log(`  ✅ Found ${workflows.length} active sheet workflow(s)\n`);
            
            const [steps] = await pool.query(`
                SELECT ws.step_number, ws.step_name, r.role_code, r.role_name
                FROM workflow_steps ws
                INNER JOIN roles r ON ws.role_id = r.id
                WHERE ws.workflow_id = ?
                ORDER BY ws.step_number
            `, [workflows[0].id]);
            
            console.log('  📋 Workflow Steps:');
            steps.forEach(step => {
                console.log(`    ${step.step_number}. ${step.role_name} (${step.role_code})`);
            });
            console.log('');
        } else {
            console.log('  ❌ No active workflow found!\n');
        }
        
        // Step 4: Check signatures
        console.log('📋 Step 4: Checking signatures...');
        const [sigCount] = await pool.query('SELECT COUNT(*) as count FROM universal_signatures WHERE entity_type = "sheet"');
        console.log(`  Total sheet signatures: ${sigCount[0].count}\n`);
        
        console.log('✅ System check complete!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
