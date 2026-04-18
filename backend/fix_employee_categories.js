const pool = require('./src/config/database');

(async () => {
    try {
        console.log('\n🔧 FIXING EMPLOYEE CATEGORIES TO MATCH REGISTRATION FORM...\n');
        
        // Check current categories
        console.log('📋 Step 1: Current employee categories...\n');
        
        const [currentCategories] = await pool.query(
            `SELECT category, COUNT(*) as count
             FROM employees
             WHERE status = 'active'
             GROUP BY category
             ORDER BY count DESC`
        );
        
        console.log('Current categories:\n');
        currentCategories.forEach(cat => {
            console.log(`   ${cat.category}: ${cat.count} employees`);
        });
        
        // Update old categories to new ones
        console.log('\n📋 Step 2: Updating employee categories...\n');
        
        const categoryUpdates = [
            {
                oldCategory: 'Management',
                newCategory: 'Site Manager',
                condition: "e.user_id IN (SELECT id FROM users WHERE role = 'site_manager') OR e.designation LIKE '%Site Manager%'"
            },
            {
                oldCategory: 'Management',
                newCategory: 'Site Director',
                condition: "e.user_id IN (SELECT id FROM users WHERE role = 'site_director') OR e.designation LIKE '%Site Director%'"
            },
            {
                oldCategory: 'Management',
                newCategory: 'Site Manager',
                condition: "e.user_id IN (SELECT id FROM users WHERE role IN ('deputy_director', 'project_director', 'deputy_head_office')) AND e.designation NOT LIKE '%Director%'"
            },
            {
                oldCategory: 'Head Office Accounts',
                newCategory: 'Accounts',
                condition: "e.user_id IN (SELECT id FROM users WHERE role IN ('accountant', 'head_office_accounts')) OR e.designation LIKE '%Account%'"
            }
        ];
        
        let totalUpdated = 0;
        
        for (const update of categoryUpdates) {
            const [result] = await pool.query(
                `UPDATE employees e
                 SET e.category = ? 
                 WHERE e.category = ? AND (${update.condition})`,
                [update.newCategory, update.oldCategory]
            );
            
            if (result.affectedRows > 0) {
                console.log(`   ✅ ${update.oldCategory} → ${update.newCategory}: ${result.affectedRows} employee(s) updated`);
                totalUpdated += result.affectedRows;
            }
        }
        
        console.log(`\n   Total employees updated: ${totalUpdated}\n`);
        
        // Verify final categories
        console.log('📋 Step 3: Final employee categories...\n');
        
        const [finalCategories] = await pool.query(
            `SELECT category, COUNT(*) as count
             FROM employees
             WHERE status = 'active'
             GROUP BY category
             ORDER BY count DESC`
        );
        
        console.log('Final categories:\n');
        finalCategories.forEach(cat => {
            console.log(`   ${cat.category}: ${cat.count} employees`);
        });
        
        console.log('\n✅ Category fix complete!\n');
        console.log('Valid Categories (matching registration form):');
        console.log('   - Site Manager');
        console.log('   - Site Engineer');
        console.log('   - Site Director');
        console.log('   - Accounts');
        console.log('   - Engineering');
        console.log('   - Employee\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
