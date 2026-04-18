// ============================================
// ADD MISSING AUTH COLUMNS TO USERS TABLE
// Safe migration with error handling
// ============================================

const mysql = require('mysql2/promise');

async function addAuthColumns() {
    console.log('========================================');
    console.log('🔧 ADDING MISSING AUTH COLUMNS');
    console.log('========================================\n');

    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'construction_db'
        });

        console.log('✅ Database connected\n');

        // Check current columns
        const [currentCols] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND TABLE_NAME = 'users'
        `);

        const colNames = currentCols.map(c => c.COLUMN_NAME);
        console.log('Current columns:', colNames.join(', '));
        console.log('');

        // Add status column
        if (!colNames.includes('status')) {
            console.log('➕ Adding status column...');
            await connection.query(`
                ALTER TABLE users
                ADD COLUMN status ENUM('active', 'inactive', 'suspended', 'rejected') 
                DEFAULT 'inactive' 
                AFTER is_approved
            `);
            console.log('   ✅ status column added\n');
        } else {
            console.log('   ⏭️  status column already exists\n');
        }

        // Add approved_at column
        if (!colNames.includes('approved_at')) {
            console.log('➕ Adding approved_at column...');
            await connection.query(`
                ALTER TABLE users
                ADD COLUMN approved_at TIMESTAMP NULL 
                AFTER is_approved
            `);
            console.log('   ✅ approved_at column added\n');
        } else {
            console.log('   ⏭️  approved_at column already exists\n');
        }

        // Add approved_by column
        if (!colNames.includes('approved_by')) {
            console.log('➕ Adding approved_by column...');
            await connection.query(`
                ALTER TABLE users
                ADD COLUMN approved_by INT 
                AFTER approved_at
            `);
            console.log('   ✅ approved_by column added\n');
        } else {
            console.log('   ⏭️  approved_by column already exists\n');
        }

        // Add foreign key (if not exists)
        try {
            await connection.query(`
                ALTER TABLE users
                ADD CONSTRAINT fk_users_approved_by 
                FOREIGN KEY (approved_by) REFERENCES users(id) 
                ON DELETE SET NULL
            `);
            console.log('   ✅ Foreign key added\n');
        } catch (error) {
            if (error.code === 'ER_DUP_KEY') {
                console.log('   ⏭️  Foreign key already exists\n');
            } else {
                console.log('   ⚠️  Foreign key warning:', error.message, '\n');
            }
        }

        // Add indexes
        try {
            await connection.query(`ALTER TABLE users ADD INDEX idx_users_status (status)`);
            console.log('   ✅ Index on status added\n');
        } catch (error) {
            if (error.code === 'ER_DUP_KEY') {
                console.log('   ⏭️  Index on status already exists\n');
            }
        }

        try {
            await connection.query(`ALTER TABLE users ADD INDEX idx_users_approved (is_approved, is_active)`);
            console.log('   ✅ Index on approved/active added\n');
        } catch (error) {
            if (error.code === 'ER_DUP_KEY') {
                console.log('   ⏭️  Index on approved/active already exists\n');
            }
        }

        // Verify all columns
        const [finalCols] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'construction_db'
            AND TABLE_NAME = 'users'
            AND COLUMN_NAME IN ('status', 'approved_by', 'approved_at')
            ORDER BY ORDINAL_POSITION
        `);

        console.log('========================================');
        console.log('✅ VERIFICATION - Added Columns:');
        console.log('========================================');
        finalCols.forEach(col => {
            console.log(`   ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (Nullable: ${col.IS_NULLABLE}, Default: ${col.COLUMN_DEFAULT})`);
        });

        console.log('\n========================================');
        console.log('🎉 MIGRATION COMPLETE!');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addAuthColumns();
