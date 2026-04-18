const mysql = require('mysql2/promise');
require('dotenv').config();

async function testProjectDetection() {
    console.log('\n🧪 TESTING PROJECT AUTO-DETECTION FILTER\n');
    console.log('='.repeat(60));
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        // Step 1: Show all projects
        console.log('\n📊 ALL PROJECTS IN DATABASE:');
        console.log('-'.repeat(60));
        const [allProjects] = await connection.query(
            'SELECT id, project_code, project_name, status FROM projects ORDER BY id ASC'
        );
        console.table(allProjects);

        // Step 2: Test what registration form will see
        console.log('\n🎯 PROJECTS VISIBLE IN REGISTRATION FORM:');
        console.log('-'.repeat(60));
        console.log('✅ Only projects with status: "ongoing" or "planning"\n');
        
        const [visibleProjects] = await connection.query(
            `SELECT id, project_code, project_name, status 
             FROM projects 
             WHERE status IN ('ongoing', 'planning')
             ORDER BY project_name ASC`
        );

        if (visibleProjects.length > 0) {
            console.table(visibleProjects);
            console.log(`\n✅ Total: ${visibleProjects.length} project(s) will auto-detect`);
        } else {
            console.log('⚠️  No projects with ongoing/planning status');
            console.log('💡 Registration form will show "No projects available"');
        }

        // Step 3: Show hidden projects
        console.log('\n\n🚫 PROJECTS HIDDEN FROM REGISTRATION:');
        console.log('-'.repeat(60));
        console.log('❌ Projects with status: "completed", "on_hold", "cancelled"\n');
        
        const [hiddenProjects] = await connection.query(
            `SELECT id, project_code, project_name, status 
             FROM projects 
             WHERE status IN ('completed', 'on_hold', 'cancelled')
             ORDER BY project_name ASC`
        );

        if (hiddenProjects.length > 0) {
            console.table(hiddenProjects);
            console.log(`\n🚫 Total: ${hiddenProjects.length} project(s) hidden`);
        } else {
            console.log('✅ No hidden projects (all are visible)');
        }

        // Step 4: Summary
        console.log('\n\n' + '='.repeat(60));
        console.log('📋 REGISTRATION AUTO-DETECTION RULES:');
        console.log('='.repeat(60));
        console.log('');
        console.log('✅ WILL AUTO-DECT (Visible in dropdown):');
        console.log('   • status = "ongoing"');
        console.log('   • status = "planning"');
        console.log('');
        console.log('🚫 WILL NOT AUTO-DETECT (Hidden from dropdown):');
        console.log('   • status = "completed"');
        console.log('   • status = "on_hold"');
        console.log('   • status = "cancelled"');
        console.log('');
        console.log('💡 DYNAMIC DETECTION:');
        console.log('   • If status changes from "ongoing" → "completed" = HIDDEN');
        console.log('   • If status changes from "completed" → "ongoing" = VISIBLE');
        console.log('   • Auto-detect updates instantly on page refresh');
        console.log('');

        console.log('='.repeat(60));
        console.log('✨ Test completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) await connection.end();
    }
}

testProjectDetection();
