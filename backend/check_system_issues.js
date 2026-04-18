// ============================================
// COMPREHENSIVE SYSTEM ISSUE CHECKER
// Check for any remaining issues
// ============================================

const pool = require('./src/config/database');

const issues = [];
const warnings = [];
const successes = [];

async function checkSystem() {
    console.log('\n🔍 COMPREHENSIVE SYSTEM CHECK');
    console.log('================================\n');

    // 1. Check database connection
    console.log('1️⃣  Database Connection...');
    try {
        await pool.query('SELECT 1');
        successes.push('✅ Database connected');
    } catch (error) {
        issues.push('❌ Database connection failed: ' + error.message);
    }

    // 2. Check for duplicate controllers
    console.log('2️⃣  Checking for duplicate controllers...');
    const fs = require('fs');
    const path = require('path');
    const controllersDir = path.join(__dirname, 'src/controllers');
    const controllers = fs.readdirSync(controllersDir);
    
    if (controllers.includes('sheetController.js')) {
        issues.push('❌ Duplicate controller exists: sheetController.js');
    } else {
        successes.push('✅ No duplicate controllers');
    }

    // 3. Check for constants file
    console.log('3️⃣  Checking constants file...');
    if (fs.existsSync(path.join(__dirname, 'src/config/constants.js'))) {
        successes.push('✅ Constants file exists');
    } else {
        issues.push('❌ Constants file missing');
    }

    // 4. Check for audit service
    console.log('4️⃣  Checking audit service...');
    if (fs.existsSync(path.join(__dirname, 'src/services/auditService.js'))) {
        successes.push('✅ Audit service exists');
    } else {
        issues.push('❌ Audit service missing');
    }

    // 5. Check database tables
    console.log('5️⃣  Checking database tables...');
    try {
        const [tables] = await pool.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        const requiredTables = [
            'users', 'roles', 'projects', 'employees', 'vouchers', 
            'expenses', 'daily_sheets', 'audit_logs', 'notifications',
            'workflow_templates', 'workflow_steps', 'sheet_signatures'
        ];

        const missingTables = requiredTables.filter(t => !tableNames.includes(t));
        
        if (missingTables.length > 0) {
            issues.push(`❌ Missing tables: ${missingTables.join(', ')}`);
        } else {
            successes.push(`✅ All required tables exist (${tableNames.length} total)`);
        }

        // Check for duplicate tables
        const duplicateTables = [
            'daily_sheet_signatures', 'sheet_workflows', 'voucher_workflows',
            'workflow_signatures', 'universal_signatures', 'signature_templates'
        ];
        const foundDuplicates = duplicateTables.filter(t => tableNames.includes(t));
        
        if (foundDuplicates.length > 0) {
            warnings.push(`⚠️  Duplicate tables still exist: ${foundDuplicates.join(', ')}`);
        } else {
            successes.push('✅ No duplicate tables');
        }
    } catch (error) {
        issues.push('❌ Failed to check tables: ' + error.message);
    }

    // 6. Check indexes
    console.log('6️⃣  Checking database indexes...');
    try {
        const [indexes] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM information_schema.statistics 
            WHERE table_schema = 'construction_db'
        `);
        
        if (indexes[0].total >= 40) {
            successes.push(`✅ Good index count: ${indexes[0].total} indexes`);
        } else {
            warnings.push(`⚠️  Low index count: ${indexes[0].total} (should be 40+)`);
        }
    } catch (error) {
        issues.push('❌ Failed to check indexes: ' + error.message);
    }

    // 7. Check foreign keys
    console.log('7️⃣  Checking foreign keys...');
    try {
        const [fks] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = 'construction_db' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        
        if (fks[0].total >= 15) {
            successes.push(`✅ Good FK count: ${fks[0].total} foreign keys`);
        } else {
            warnings.push(`⚠️  Low FK count: ${fks[0].total} (should be 15+)`);
        }
    } catch (error) {
        issues.push('❌ Failed to check FKs: ' + error.message);
    }

    // 8. Check stored procedures
    console.log('8️⃣  Checking stored procedures...');
    try {
        const [procedures] = await pool.query(`
            SHOW PROCEDURE STATUS 
            WHERE Db = 'construction_db'
        `);
        
        const requiredProcedures = [
            'create_or_add_to_sheet',
            'validate_signature_order',
            'add_signature_to_sheet',
            'generate_sheet_pdf_data'
        ];

        const procNames = procedures.map(p => p.Name);
        const missingProcs = requiredProcedures.filter(p => !procNames.includes(p));
        
        if (missingProcs.length > 0) {
            issues.push(`❌ Missing procedures: ${missingProcs.join(', ')}`);
        } else {
            successes.push(`✅ All stored procedures exist (${procedures.length} total)`);
        }
    } catch (error) {
        issues.push('❌ Failed to check procedures: ' + error.message);
    }

    // 9. Check for hardcoded values in controllers
    console.log('9️⃣  Checking for hardcoded values...');
    try {
        const controllerFiles = controllers.filter(f => f.endsWith('.js'));
        let hardcodedCount = 0;
        
        for (const file of controllerFiles) {
            const content = fs.readFileSync(path.join(controllersDir, file), 'utf8');
            // Check for common hardcoded role names
            const patterns = [
                /['"]admin['"]/g,
                /['"]employee['"]/g,
                /['"]engineer['"]/g,
                /['"]approved['"]/g,
                /['"]pending['"]/g
            ];
            
            for (const pattern of patterns) {
                const matches = content.match(pattern);
                if (matches) hardcodedCount += matches.length;
            }
        }
        
        if (hardcodedCount > 50) {
            warnings.push(`⚠️  Many hardcoded values found: ${hardcodedCount} occurrences`);
        } else {
            successes.push(`✅ Low hardcoded values: ${hardcodedCount} (acceptable)`);
        }
    } catch (error) {
        warnings.push('⚠️  Could not check hardcoded values: ' + error.message);
    }

    // 10. Check API routes
    console.log('🔟 Checking API routes...');
    const routesDir = path.join(__dirname, 'src/routes');
    const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
    
    const requiredRoutes = [
        'auth.js', 'employees.js', 'projects.js', 'vouchers.js',
        'expenses.js', 'ledger.js', 'reports.js', 'purchases.js',
        'dailySheets.js', 'audit.js'
    ];

    const missingRoutes = requiredRoutes.filter(r => !routeFiles.includes(r));
    
    if (missingRoutes.length > 0) {
        issues.push(`❌ Missing routes: ${missingRoutes.join(', ')}`);
    } else {
        successes.push(`✅ All route files exist (${routeFiles.length} total)`);
    }

    // 11. Check server.js for route registration
    console.log('1️⃣1️⃣  Checking server.js...');
    try {
        const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        
        if (serverContent.includes("require('./src/routes/audit')")) {
            successes.push('✅ Audit route registered in server.js');
        } else {
            issues.push('❌ Audit route not registered in server.js');
        }

        if (serverContent.includes("app.use('/api/")) {
            const apiRoutes = serverContent.match(/app\.use\('\/api\/[^']+'/g);
            successes.push(`✅ ${apiRoutes ? apiRoutes.length : 0} API routes registered`);
        }
    } catch (error) {
        issues.push('❌ Failed to check server.js: ' + error.message);
    }

    // 12. Check package.json dependencies
    console.log('1️⃣2️⃣  Checking dependencies...');
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        const requiredDeps = ['express', 'mysql2', 'bcryptjs', 'jsonwebtoken', 'cors', 'helmet'];
        
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const missingDeps = requiredDeps.filter(d => !allDeps[d]);
        
        if (missingDeps.length > 0) {
            warnings.push(`⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
        } else {
            successes.push('✅ All required dependencies installed');
        }
    } catch (error) {
        issues.push('❌ Failed to check dependencies: ' + error.message);
    }

    // Print results
    console.log('\n\n================================');
    console.log('📊 SYSTEM CHECK RESULTS');
    console.log('================================\n');

    if (successes.length > 0) {
        console.log('✅ SUCCESSES (' + successes.length + '):');
        successes.forEach(s => console.log('  ' + s));
        console.log('');
    }

    if (warnings.length > 0) {
        console.log('⚠️  WARNINGS (' + warnings.length + '):');
        warnings.forEach(w => console.log('  ' + w));
        console.log('');
    }

    if (issues.length > 0) {
        console.log('❌ ISSUES (' + issues.length + '):');
        issues.forEach(i => console.log('  ' + i));
        console.log('');
    }

    console.log('================================');
    console.log('FINAL STATUS:');
    console.log('================================');
    console.log(`✅ Passed: ${successes.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`❌ Issues: ${issues.length}`);
    console.log('');

    if (issues.length === 0 && warnings.length === 0) {
        console.log('🎉 PERFECT! No issues found!');
        console.log('⭐ SYSTEM SCORE: 10/10');
    } else if (issues.length === 0) {
        console.log('✅ GOOD! No critical issues, only warnings.');
        console.log('⭐ SYSTEM SCORE: 9.5/10');
    } else {
        console.log('⚠️  ' + issues.length + ' issue(s) need attention!');
        console.log('⭐ SYSTEM SCORE: ' + Math.max(5, 10 - issues.length) + '/10');
    }

    console.log('\n');

    await pool.end();
    process.exit(issues.length > 0 ? 1 : 0);
}

checkSystem().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
