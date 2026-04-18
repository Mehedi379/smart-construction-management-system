const pool = require('./src/config/database');

async function createWorkflowTables() {
    console.log('🔧 Creating workflow tables...\n');

    try {
        // 1. Create workflow_templates table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS workflow_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Created: workflow_templates');

        // 2. Create workflow_steps table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS workflow_steps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                workflow_id INT NOT NULL,
                step_number INT NOT NULL,
                step_name VARCHAR(100) NOT NULL,
                role_id INT NOT NULL,
                action_required VARCHAR(50) DEFAULT 'sign',
                is_mandatory BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (workflow_id) REFERENCES workflow_templates(id) ON DELETE CASCADE,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
                UNIQUE KEY unique_workflow_step (workflow_id, step_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Created: workflow_steps');

        // 3. Create sheet_workflows table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sheet_workflows (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sheet_id INT NOT NULL,
                workflow_id INT NOT NULL,
                current_step INT DEFAULT 1,
                status ENUM('pending', 'in_review', 'approved', 'rejected', 'completed') DEFAULT 'pending',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
                FOREIGN KEY (workflow_id) REFERENCES workflow_templates(id) ON DELETE RESTRICT,
                INDEX idx_sheet_id (sheet_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Created: sheet_workflows');

        // 4. Create sheet_signatures table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sheet_signatures (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sheet_id INT NOT NULL,
                step_id INT NOT NULL,
                role_id INT NOT NULL,
                user_id INT NOT NULL,
                signature_data TEXT,
                comments TEXT,
                status ENUM('pending', 'signed', 'rejected') DEFAULT 'pending',
                signed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
                FOREIGN KEY (step_id) REFERENCES workflow_steps(id) ON DELETE CASCADE,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
                UNIQUE KEY unique_sheet_step (sheet_id, step_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Created: sheet_signatures');

        // 5. Create universal_signatures table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS universal_signatures (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                signature_name VARCHAR(100) NOT NULL,
                signature_data LONGTEXT NOT NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Created: universal_signatures');

        // 6. Create notifications table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                notification_type VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50),
                entity_id INT,
                title VARCHAR(200) NOT NULL,
                message TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                action_url VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                read_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_is_read (is_read),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Created: notifications');

        console.log('\n🎉 All workflow tables created successfully!');

        // 7. Insert default workflow template for sheets
        const [existingTemplate] = await pool.query(
            'SELECT id FROM workflow_templates WHERE entity_type = "sheet" LIMIT 1'
        );

        if (existingTemplate.length === 0) {
            console.log('\n📝 Creating default sheet workflow template...');
            
            const [result] = await pool.query(`
                INSERT INTO workflow_templates (name, entity_type, description)
                VALUES ('Daily Sheet Approval Workflow', 'sheet', 'Standard 6-step approval workflow for daily expense sheets')
            `);
            
            const workflowId = result.insertId;

            // Get role IDs for the workflow steps
            const [roles] = await pool.query(`
                SELECT id, role_code, role_name FROM roles 
                WHERE role_code IN ('manager', 'engineer', 'director', 'deputy_director', 'accountant', 'admin')
                ORDER BY FIELD(role_code, 'manager', 'engineer', 'director', 'deputy_director', 'accountant', 'admin')
            `);

            if (roles.length === 6) {
                await pool.query(`
                    INSERT INTO workflow_steps (workflow_id, step_number, step_name, role_id) VALUES
                    (?, 1, 'Site Manager Verification', ?),
                    (?, 2, 'Engineer Approval', ?),
                    (?, 3, 'Project Director Review', ?),
                    (?, 4, 'Deputy Director Review', ?),
                    (?, 5, 'Accountant Verification', ?),
                    (?, 6, 'Admin Final Approval', ?)
                `, [
                    workflowId, roles[0].id,
                    workflowId, roles[1].id,
                    workflowId, roles[2].id,
                    workflowId, roles[3].id,
                    workflowId, roles[4].id,
                    workflowId, roles[5].id
                ]);

                console.log(`✅ Created workflow template with ${roles.length} steps`);
            } else {
                console.log('⚠️  Warning: Not all required roles found. Workflow template created but may be incomplete.');
            }
        } else {
            console.log('✅ Workflow template already exists');
        }

        console.log('\n✨ Database setup complete!');
        
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

createWorkflowTables();
