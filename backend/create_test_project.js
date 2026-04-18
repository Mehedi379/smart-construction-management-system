require('dotenv').config();
const mysql = require('mysql2/promise');

async function createTestProject() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });
        
        console.log('========================================');
        console.log('🏗️  CREATING TEST PROJECT');
        console.log('========================================\n');

        // Check existing projects
        const [existingProjects] = await connection.query(
            'SELECT id, project_code, project_name FROM projects ORDER BY id'
        );

        console.log(`📊 Existing projects: ${existingProjects.length}`);
        existingProjects.forEach(p => {
            console.log(`   - ${p.project_code}: ${p.project_name}`);
        });
        console.log('');

        // Generate next project code
        let maxNumber = 0;
        existingProjects.forEach(project => {
            if (project.project_code) {
                const match = project.project_code.match(/PRJ(\d+)/i);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }
        });
        
        const nextCode = `PRJ${String(maxNumber + 1).padStart(3, '0')}`;
        console.log(`📝 Next project code: ${nextCode}\n`);

        // Create test project
        const projectData = {
            project_code: nextCode,
            project_name: 'Test Construction Project',
            location: 'Dhaka, Bangladesh',
            start_date: '2026-04-16',
            end_date: '2026-12-31',
            estimated_budget: 5000000,
            description: 'This is a test project to verify the system is working correctly',
            status: 'ongoing',
            created_by: 1 // Admin user ID
        };

        console.log('📋 Project Details:');
        console.log(`   Code: ${projectData.project_code}`);
        console.log(`   Name: ${projectData.project_name}`);
        console.log(`   Location: ${projectData.location}`);
        console.log(`   Start Date: ${projectData.start_date}`);
        console.log(`   End Date: ${projectData.end_date}`);
        console.log(`   Budget: ৳${projectData.estimated_budget.toLocaleString()}`);
        console.log(`   Status: ${projectData.status}`);
        console.log('');

        // Insert project
        const [result] = await connection.query(
            `INSERT INTO projects (
                project_code, project_name, location, 
                start_date, end_date, estimated_budget, description, 
                status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                projectData.project_code,
                projectData.project_name,
                projectData.location,
                projectData.start_date,
                projectData.end_date,
                projectData.estimated_budget,
                projectData.description,
                projectData.status,
                projectData.created_by
            ]
        );

        console.log('✅ Project created successfully!');
        console.log(`   Project ID: ${result.insertId}\n`);

        // Verify project was created
        const [verifyProject] = await connection.query(
            'SELECT * FROM projects WHERE id = ?',
            [result.insertId]
        );

        console.log('✅ Verification - Project in database:');
        console.log(`   ID: ${verifyProject[0].id}`);
        console.log(`   Code: ${verifyProject[0].project_code}`);
        console.log(`   Name: ${verifyProject[0].project_name}`);
        console.log(`   Status: ${verifyProject[0].status}`);
        console.log('');

        console.log('========================================');
        console.log('✅ PROJECT CREATION COMPLETE');
        console.log('========================================\n');

        console.log('🌐 You can now:');
        console.log('   1. Login to the system');
        console.log('   2. Go to Projects page');
        console.log('   3. See your new project listed');
        console.log('   4. Create more projects using the UI\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) await connection.end();
    }
}

createTestProject();
