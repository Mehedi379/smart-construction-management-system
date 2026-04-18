const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔍 CHECKING SHEET SIGNATURE STATUS...\n');
        
        // Step 1: Check all sheets
        console.log('📋 Step 1: All sheets and their status...\n');
        
        const [sheets] = await pool.query(
            `SELECT 
                ds.id,
                ds.sheet_no,
                ds.status,
                ds.sheet_date,
                ds.today_expense,
                ds.project_id,
                p.project_name,
                sw.id as workflow_id,
                sw.current_step,
                sw.status as workflow_status
             FROM daily_sheets ds
             LEFT JOIN sheet_workflows sw ON ds.id = sw.sheet_id
             LEFT JOIN projects p ON ds.project_id = p.id
             ORDER BY ds.id DESC`
        );
        
        console.log(`Found ${sheets.length} sheet(s):\n`);
        sheets.forEach(sheet => {
            console.log(`Sheet: ${sheet.sheet_no}`);
            console.log(`  Status: ${sheet.status}`);
            console.log(`  Amount: ৳${sheet.today_expense}`);
            console.log(`  Date: ${sheet.sheet_date}`);
            console.log(`  Project: ${sheet.project_name || 'N/A'}`);
            console.log(`  Workflow: ${sheet.workflow_status || 'NO WORKFLOW'}`);
            console.log(`  Current Step: ${sheet.current_step || 'N/A'}`);
            console.log('');
        });
        
        // Step 2: Check signature requests
        console.log('\n📋 Step 2: Signature requests...\n');
        
        const [sigRequests] = await pool.query(
            `SELECT 
                sr.id,
                sr.sheet_id,
                ds.sheet_no,
                sr.role_code,
                sr.role_name,
                sr.status,
                sr.requested_at
             FROM signature_requests sr
             INNER JOIN daily_sheets ds ON sr.sheet_id = ds.id
             ORDER BY sr.sheet_id, sr.id`
        );
        
        console.log(`Found ${sigRequests.length} signature request(s):\n`);
        sigRequests.forEach(req => {
            console.log(`Sheet: ${req.sheet_no}`);
            console.log(`  Role: ${req.role_code} (${req.role_name})`);
            console.log(`  Status: ${req.status}`);
            console.log(`  Requested: ${req.requested_at || 'N/A'}`);
            console.log('');
        });
        
        // Step 3: Identify the problem
        console.log('\n⚠️  PROBLEM ANALYSIS:\n');
        
        const draftSheets = sheets.filter(s => s.status === 'draft');
        const sheetsWithoutWorkflow = sheets.filter(s => !s.workflow_id);
        
        if (draftSheets.length > 0) {
            console.log(`❌ ${draftSheets.length} sheet(s) are still in DRAFT status`);
            console.log('   Draft sheets cannot be signed!\n');
            draftSheets.forEach(sheet => {
                console.log(`   - ${sheet.sheet_no} (${sheet.status})`);
            });
            console.log('');
        }
        
        if (sheetsWithoutWorkflow.length > 0) {
            console.log(`❌ ${sheetsWithoutWorkflow.length} sheet(s) have NO WORKFLOW`);
            console.log('   Sheets need workflow to enable signature!\n');
            sheetsWithoutWorkflow.forEach(sheet => {
                console.log(`   - ${sheet.sheet_no} (no workflow)`);
            });
            console.log('');
        }
        
        // Step 4: Solution
        console.log('💡 SOLUTION:\n');
        console.log('   Option 1: Send draft sheets for signature');
        console.log('   Option 2: Create workflows for sheets without workflows\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
