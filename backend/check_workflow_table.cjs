const mysql = require('mysql2/promise');
require('dotenv').config();

(async()=>{
    const c=await mysql.createConnection({
        host:process.env.DB_HOST,
        user:process.env.DB_USER,
        password:process.env.DB_PASSWORD,
        database:process.env.DB_NAME
    });
    
    console.log('\n📋 Sheet Workflows Table Structure:');
    const [cols]=await c.query('DESCRIBE sheet_workflows');
    cols.forEach(col=>console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key}`));
    
    console.log('\n📋 Active Workflow Templates:');
    const [templates]=await c.query('SELECT id, name FROM workflow_templates WHERE entity_type="sheet" AND is_active=TRUE');
    templates.forEach(t=>console.log(`  ID: ${t.id}, Name: ${t.name}`));
    
    await c.end();
})();
