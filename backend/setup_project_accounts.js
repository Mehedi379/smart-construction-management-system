require('dotenv').config();
const ProjectAccountService = require('./src/services/projectAccountService');

async function setupProjectAccounts() {
    try {
        console.log('========================================');
        console.log('🔧 SETTING UP PROJECT ACCOUNTS');
        console.log('========================================\n');

        const projectId = 1;
        const projectName = 'Test Construction Project';

        console.log(`📝 Setting up accounts for Project #${projectId}: ${projectName}\n`);

        // Create default accounts
        await ProjectAccountService.createDefaultAccounts(projectId, projectName);

        console.log('\n✅ Project accounts created successfully!\n');

        console.log('========================================');
        console.log('✅ SETUP COMPLETE');
        console.log('========================================\n');

        console.log('📋 Created:');
        console.log('   ✅ 6 Default Accounts (Labor, Material, Equipment, Misc, Income, Budget)');
        console.log('   ✅ Financial Summary Record');
        console.log('   ✅ Category Structure\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

setupProjectAccounts();
