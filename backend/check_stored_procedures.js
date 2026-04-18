const pool = require('./src/config/database');

(async () => {
    try {
        // Check stored procedures
        const [procs] = await pool.query(
            `SELECT ROUTINE_NAME FROM information_schema.ROUTINES 
             WHERE ROUTINE_SCHEMA = 'construction_db' AND ROUTINE_TYPE = 'PROCEDURE'`
        );
        console.log('=== STORED PROCEDURES ===');
        procs.forEach(p => console.log('✓', p.ROUTINE_NAME));
        
        if (procs.length === 0) {
            console.log('⚠ No stored procedures found!');
        }

        // Check workflow steps
        const [steps] = await pool.query(
            `SELECT ws.id, r.role_code, r.role_name, ws.step_number, ws.step_name
             FROM workflow_steps ws
             LEFT JOIN roles r ON ws.role_id = r.id
             WHERE ws.workflow_id = 2
             ORDER BY ws.step_number`
        );
        console.log('\n=== WORKFLOW STEPS (Sheet Approval) ===');
        console.table(steps);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();
