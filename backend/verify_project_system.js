require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifySystem() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });
        
        console.log('========================================');
        console.log('🔍 VERIFYING PROJECT-BASED SYSTEM');
        console.log('========================================\n');

        // Check tables
        const [tables] = await connection.query("SHOW TABLES");
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        console.log('📊 DATABASE TABLES:');
        const requiredTables = [
            'users', 'projects', 'employees', 'daily_sheets', 
            'vouchers', 'expenses', 'project_accounts', 
            'project_financial_summary', 'categories',
            'audit_logs', 'sheet_entries'
        ];
        
        requiredTables.forEach(table => {
            const exists = tableNames.includes(table);
            console.log(`   ${exists ? '✅' : '❌'} ${table}`);
        });
        console.log('');

        // Check triggers
        const [triggers] = await connection.query("SHOW TRIGGERS");
        console.log(`⚡ TRIGGERS: ${triggers.length} found`);
        triggers.forEach(t => {
            console.log(`   ✅ ${t.Trigger} (${t.Event} on ${t.Table})`);
        });
        console.log('');

        // Check stored procedures
        const [procedures] = await connection.query(
            "SHOW PROCEDURE STATUS WHERE Db = 'construction_db'"
        );
        console.log(`🔧 STORED PROCEDURES: ${procedures.length} found`);
        procedures.forEach(p => {
            console.log(`   ✅ ${p.Name}`);
        });
        console.log('');

        // Check projects
        const [projects] = await connection.query(
            'SELECT id, project_code, project_name, status, estimated_budget FROM projects'
        );
        console.log(`🏗️  PROJECTS: ${projects.length} found`);
        projects.forEach(p => {
            console.log(`   ✅ ${p.project_code}: ${p.project_name} (${p.status}) - ৳${p.estimated_budget.toLocaleString()}`);
        });
        console.log('');

        // Check project accounts
        const [accounts] = await connection.query(
            'SELECT COUNT(*) as count FROM project_accounts'
        );
        console.log(`💼 PROJECT ACCOUNTS: ${accounts[0].count} created`);
        console.log('');

        // Check project financial summary
        const [financials] = await connection.query(
            'SELECT COUNT(*) as count FROM project_financial_summary'
        );
        console.log(`📊 FINANCIAL SUMMARIES: ${financials[0].count} created`);
        console.log('');

        console.log('========================================');
        console.log('✅ VERIFICATION COMPLETE');
        console.log('========================================\n');

        // Missing components
        const missingTables = requiredTables.filter(t => !tableNames.includes(t));
        if (missingTables.length > 0) {
            console.log('⚠️  MISSING TABLES:');
            missingTables.forEach(t => console.log(`   ❌ ${t}`));
            console.log('\n📝 Run database migration:');
            console.log('   mysql -u root -p construction_db < database/project_accounting_system.sql\n');
        } else {
            console.log('✅ All required tables exist!\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

verifySystem();
