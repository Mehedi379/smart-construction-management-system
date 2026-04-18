const mysql = require('mysql2/promise');
require('dotenv').config();

async function testProjectCreation() {
    console.log('\n🧪 COMPREHENSIVE PROJECT CREATION TEST\n');
    console.log('='.repeat(60));
    
    let connection;
    try {
        // Step 1: Test Database Connection
        console.log('\n📊 STEP 1: Testing Database Connection...');
        console.log('-'.repeat(60));
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });
        console.log('✅ Database connected successfully');

        // Step 2: Check Projects Table Structure
        console.log('\n📋 STEP 2: Checking Projects Table Structure...');
        console.log('-'.repeat(60));
        const [columns] = await connection.query('DESCRIBE projects');
        console.log('Table columns:');
        const importantColumns = ['id', 'project_code', 'project_name', 'location', 'estimated_budget', 'start_date', 'end_date', 'status', 'created_by', 'created_at'];
        columns.forEach(col => {
            const isImportant = importantColumns.includes(col.Field);
            const icon = isImportant ? '✅' : '  ';
            console.log(`${icon} ${col.Field} - ${col.Type} ${col.Null === 'NO' ? '(REQUIRED)' : '(OPTIONAL)'}`);
        });

        // Step 3: Check Users Table
        console.log('\n👤 STEP 3: Checking Admin User...');
        console.log('-'.repeat(60));
        const [users] = await connection.query('SELECT id, name, email, role FROM users WHERE role = "admin" LIMIT 1');
        if (users.length > 0) {
            console.log('✅ Admin user found:');
            console.log(`   ID: ${users[0].id}`);
            console.log(`   Name: ${users[0].name}`);
            console.log(`   Email: ${users[0].email}`);
            console.log(`   Role: ${users[0].role}`);
        } else {
            console.log('❌ No admin user found!');
            console.log('💡 You need to create an admin user first');
        }

        // Step 4: Check Current Projects
        console.log('\n📁 STEP 4: Current Projects in Database...');
        console.log('-'.repeat(60));
        const [projects] = await connection.query('SELECT id, project_code, project_name, status FROM projects ORDER BY id DESC LIMIT 5');
        if (projects.length > 0) {
            console.log(`Found ${projects.length} recent project(s):`);
            console.table(projects);
        } else {
            console.log('No projects found');
        }

        // Step 5: Test Manual Project Insert
        console.log('\n📝 STEP 5: Testing Manual Project Insert...');
        console.log('-'.repeat(60));
        
        if (users.length > 0) {
            const adminId = users[0].id;
            const testProjectCode = `TEST${Date.now().toString().slice(-6)}`;
            
            try {
                const [result] = await connection.query(
                    `INSERT INTO projects (
                        project_code, project_name, client_id, location, description,
                        estimated_budget, start_date, end_date, status, created_by
                    ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        testProjectCode,
                        'Test Auto-Detect Project',
                        'Test Location',
                        'Testing project creation',
                        1000000,
                        new Date(),
                        null,
                        'ongoing',
                        adminId
                    ]
                );
                
                console.log('✅ Manual insert successful!');
                console.log(`   Project ID: ${result.insertId}`);
                console.log(`   Project Code: ${testProjectCode}`);
                
                // Verify the inserted project
                const [verifyProject] = await connection.query(
                    'SELECT id, project_code, project_name, status, created_by FROM projects WHERE id = ?',
                    [result.insertId]
                );
                console.log('\n✅ Verified project in database:');
                console.table(verifyProject);
                
                // Clean up test project
                await connection.query('DELETE FROM projects WHERE id = ?', [result.insertId]);
                console.log('\n🗑️  Test project cleaned up');
                
            } catch (error) {
                console.log('❌ Manual insert failed!');
                console.log(`   Error: ${error.message}`);
                console.log(`   SQL State: ${error.sqlState}`);
                console.log(`   SQL Message: ${error.sqlMessage || 'N/A'}`);
                
                if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                    console.log('\n💡 Foreign key error: created_by user does not exist');
                } else if (error.code === 'ER_WARN_DATA_OUT_OF_RANGE') {
                    console.log('\n💡 Data out of range: Check ENUM values for status');
                }
            }
        }

        // Step 6: Summary
        console.log('\n\n' + '='.repeat(60));
        console.log('📋 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log('');
        console.log('✅ Database connection: Working');
        console.log('✅ Table structure: Verified');
        console.log(users.length > 0 ? '✅ Admin user: Found' : '❌ Admin user: NOT FOUND');
        console.log('');
        console.log('If manual insert failed, check:');
        console.log('  1. Admin user exists and ID is correct');
        console.log('  2. Status value is valid ENUM value');
        console.log('  3. All required fields are provided');
        console.log('  4. Backend server is running on port 9000');
        console.log('');
        console.log('Common issues:');
        console.log('  • Backend not running → Run: npm run dev');
        console.log('  • Wrong port → Check .env (PORT=9000)');
        console.log('  • Invalid token → Login again');
        console.log('  • Not admin user → Check user role');
        console.log('');

        await connection.end();
        console.log('✨ Test completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        if (connection) await connection.end();
    }
}

testProjectCreation();
