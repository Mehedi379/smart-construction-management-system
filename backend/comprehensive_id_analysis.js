const mysql = require('mysql2/promise');
require('dotenv').config();

async function comprehensiveIDAnalysis() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'construction_db'
        });

        console.log('\n' + '='.repeat(70));
        console.log('🔍 COMPREHENSIVE ID-WISE SYSTEM ANALYSIS');
        console.log('='.repeat(70) + '\n');

        // 1. Check Users Table
        console.log('👥 USERS TABLE ANALYSIS:');
        const [users] = await connection.query('SELECT id, name, email, role, is_approved, is_active FROM users ORDER BY id');
        console.log(`   Total Users: ${users.length}`);
        users.forEach(user => {
            console.log(`   - ID: ${user.id} | ${user.name} | ${user.email} | Role: ${user.role} | Approved: ${user.is_approved} | Active: ${user.is_active}`);
        });

        // 2. Check Projects Table
        console.log('\n📁 PROJECTS TABLE ANALYSIS:');
        const [projects] = await connection.query('SELECT id, project_code, project_name, created_by, status FROM projects ORDER BY id');
        console.log(`   Total Projects: ${projects.length}`);
        projects.forEach(project => {
            console.log(`   - ID: ${project.id} | ${project.project_code} | ${project.project_name} | Created By: ${project.created_by} | Status: ${project.status}`);
        });

        // 3. Check Employees Table
        console.log('\n👷 EMPLOYEES TABLE ANALYSIS:');
        const [employees] = await connection.query(`
            SELECT e.id, e.employee_id, e.user_id, e.name, e.category, e.assigned_project_id, e.status 
            FROM employees e ORDER BY e.id
        `);
        console.log(`   Total Employees: ${employees.length}`);
        employees.forEach(emp => {
            console.log(`   - ID: ${emp.id} | ${emp.employee_id} | ${emp.name} | Category: ${emp.category} | Project ID: ${emp.assigned_project_id} | Status: ${emp.status}`);
        });

        // 4. Check Daily Sheets Table
        console.log('\n📄 DAILY SHEETS TABLE ANALYSIS:');
        const [sheets] = await connection.query(`
            SELECT id, sheet_no, project_id, created_by, sheet_date, today_expense, status 
            FROM daily_sheets ORDER BY id
        `);
        console.log(`   Total Daily Sheets: ${sheets.length}`);
        sheets.forEach(sheet => {
            console.log(`   - ID: ${sheet.id} | Sheet No: ${sheet.sheet_no} | Project ID: ${sheet.project_id} | Created By: ${sheet.created_by} | Date: ${sheet.sheet_date} | Expense: ৳${sheet.today_expense} | Status: ${sheet.status}`);
        });

        // 5. Check Vouchers Table
        console.log('\n🎫 VOUCHERS TABLE ANALYSIS:');
        const [vouchers] = await connection.query(`
            SELECT id, voucher_no, project_id, created_by, approved_by, amount, status 
            FROM vouchers ORDER BY id
        `);
        console.log(`   Total Vouchers: ${vouchers.length}`);
        vouchers.forEach(voucher => {
            console.log(`   - ID: ${voucher.id} | Voucher No: ${voucher.voucher_no} | Project ID: ${voucher.project_id} | Amount: ৳${voucher.amount} | Status: ${voucher.status}`);
        });

        // 6. Check Expenses Table
        console.log('\n💰 EXPENSES TABLE ANALYSIS:');
        const [expenses] = await connection.query(`
            SELECT id, voucher_id, project_id, created_by, amount, category 
            FROM expenses ORDER BY id
        `);
        console.log(`   Total Expenses: ${expenses.length}`);
        expenses.forEach(exp => {
            console.log(`   - ID: ${exp.id} | Voucher ID: ${exp.voucher_id} | Project ID: ${exp.project_id} | Amount: ৳${exp.amount} | Category: ${exp.category}`);
        });

        // 7. Check Purchases Table
        console.log('\n🛒 PURCHASES TABLE ANALYSIS:');
        const [purchases] = await connection.query(`
            SHOW COLUMNS FROM purchases LIKE 'status'
        `);
        const hasPurchaseStatus = purchases.length > 0;
        
        const [purchaseRows] = await connection.query(`
            SELECT id, purchase_no, project_id, created_by, supplier_id, total_amount 
            FROM purchases ORDER BY id
        `);
        console.log(`   Total Purchases: ${purchaseRows.length}`);
        purchaseRows.forEach(purchase => {
            console.log(`   - ID: ${purchase.id} | Purchase No: ${purchase.purchase_no} | Project ID: ${purchase.project_id} | Total: ৳${purchase.total_amount}`);
        });

        // 8. Check Signature Requests Table
        console.log('\n✍️  SIGNATURE REQUESTS TABLE ANALYSIS:');
        const [signatures] = await connection.query(`
            SELECT id, sheet_id, requested_by, signed_by, role_code, status 
            FROM signature_requests ORDER BY id
        `);
        console.log(`   Total Signature Requests: ${signatures.length}`);
        signatures.forEach(sig => {
            console.log(`   - ID: ${sig.id} | Sheet ID: ${sig.sheet_id} | Requested By: ${sig.requested_by} | Signed By: ${sig.signed_by} | Role: ${sig.role_code} | Status: ${sig.status}`);
        });

        // 9. Check Workflow Steps Table
        console.log('\n🔄 WORKFLOW STEPS TABLE ANALYSIS:');
        const [workflows] = await connection.query(`
            SELECT id, workflow_id, step_number, role_id, step_name, action_required 
            FROM workflow_steps ORDER BY id
        `);
        console.log(`   Total Workflow Steps: ${workflows.length}`);
        workflows.forEach(workflow => {
            console.log(`   - ID: ${workflow.id} | Workflow ID: ${workflow.workflow_id} | Step: ${workflow.step_number} | Role ID: ${workflow.role_id} | Step Name: ${workflow.step_name}`);
        });

        // 10. ID Relationship Analysis
        console.log('\n' + '='.repeat(70));
        console.log('🔗 ID RELATIONSHIP ANALYSIS:');
        console.log('='.repeat(70));

        // Check for orphaned records
        console.log('\n🔍 Checking for orphaned records...');
        
        // Employees with non-existent project IDs
        const [orphanedEmployees] = await connection.query(`
            SELECT e.id, e.name, e.assigned_project_id 
            FROM employees e 
            LEFT JOIN projects p ON e.assigned_project_id = p.id 
            WHERE e.assigned_project_id IS NOT NULL AND p.id IS NULL
        `);
        if (orphanedEmployees.length > 0) {
            console.log(`   ⚠️  Found ${orphanedEmployees.length} employees with non-existent project IDs:`);
            orphanedEmployees.forEach(emp => {
                console.log(`      - Employee ID: ${emp.id} (${emp.name}) references Project ID: ${emp.assigned_project_id}`);
            });
        } else {
            console.log('   ✅ No orphaned employee records found');
        }

        // Daily sheets with non-existent project IDs
        const [orphanedSheets] = await connection.query(`
            SELECT ds.id, ds.sheet_no, ds.project_id 
            FROM daily_sheets ds 
            LEFT JOIN projects p ON ds.project_id = p.id 
            WHERE ds.project_id IS NOT NULL AND p.id IS NULL
        `);
        if (orphanedSheets.length > 0) {
            console.log(`   ⚠️  Found ${orphanedSheets.length} daily sheets with non-existent project IDs:`);
            orphanedSheets.forEach(sheet => {
                console.log(`      - Sheet ID: ${sheet.id} (${sheet.sheet_no}) references Project ID: ${sheet.project_id}`);
            });
        } else {
            console.log('   ✅ No orphaned daily sheet records found');
        }

        // Vouchers with non-existent project IDs
        const [orphanedVouchers] = await connection.query(`
            SELECT v.id, v.voucher_no, v.project_id 
            FROM vouchers v 
            LEFT JOIN projects p ON v.project_id = p.id 
            WHERE v.project_id IS NOT NULL AND p.id IS NULL
        `);
        if (orphanedVouchers.length > 0) {
            console.log(`   ⚠️  Found ${orphanedVouchers.length} vouchers with non-existent project IDs:`);
            orphanedVouchers.forEach(voucher => {
                console.log(`      - Voucher ID: ${voucher.id} (${voucher.voucher_no}) references Project ID: ${voucher.project_id}`);
            });
        } else {
            console.log('   ✅ No orphaned voucher records found');
        }

        // 11. Project-wise Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 PROJECT-WISE SUMMARY:');
        console.log('='.repeat(70));

        for (const project of projects) {
            console.log(`\n📁 Project #${project.id}: ${project.project_name} (${project.project_code})`);
            console.log('-'.repeat(50));

            // Count employees for this project
            const [empCount] = await connection.query(
                `SELECT COUNT(*) as count FROM employees WHERE assigned_project_id = ?`,
                [project.id]
            );
            console.log(`   👥 Employees: ${empCount[0].count}`);

            // Count daily sheets for this project
            const [sheetCount] = await connection.query(
                `SELECT COUNT(*) as count FROM daily_sheets WHERE project_id = ?`,
                [project.id]
            );
            console.log(`   📄 Daily Sheets: ${sheetCount[0].count}`);

            // Calculate total expense from sheets for this project
            const [sheetExpenses] = await connection.query(
                `SELECT COALESCE(SUM(today_expense), 0) as total FROM daily_sheets WHERE project_id = ?`,
                [project.id]
            );
            console.log(`   💰 Sheet Expenses: ৳${parseFloat(sheetExpenses[0].total).toLocaleString()}`);

            // Count vouchers for this project
            const [voucherCount] = await connection.query(
                `SELECT COUNT(*) as count FROM vouchers WHERE project_id = ?`,
                [project.id]
            );
            console.log(`   🎫 Vouchers: ${voucherCount[0].count}`);

            // Count purchases for this project
            const [purchaseCount] = await connection.query(
                `SELECT COUNT(*) as count FROM purchases WHERE project_id = ?`,
                [project.id]
            );
            console.log(`   🛒 Purchases: ${purchaseCount[0].count}`);
        }

        if (projects.length === 0) {
            console.log('\n   ⚠️  No projects found in database');
        }

        // 12. System Health Check
        console.log('\n' + '='.repeat(70));
        console.log('🏥 SYSTEM HEALTH CHECK:');
        console.log('='.repeat(70));

        const totalRecords = users.length + projects.length + employees.length + 
                           sheets.length + vouchers.length + expenses.length + 
                           purchases.length + signatures.length + workflows.length;
        
        const totalIssues = orphanedEmployees.length + orphanedSheets.length + orphanedVouchers.length;
        const healthScore = totalRecords > 0 ? Math.max(0, 100 - (totalIssues / totalRecords * 100)) : 100;

        console.log(`   📊 Total Records: ${totalRecords}`);
        console.log(`   ⚠️  Total Issues: ${totalIssues}`);
        console.log(`   🎯 Health Score: ${Math.round(healthScore * 10) / 10}%`);
        console.log(`   📈 Status: ${healthScore >= 90 ? 'EXCELLENT' : healthScore >= 70 ? 'GOOD' : healthScore >= 50 ? 'FAIR' : 'POOR'}`);

        console.log('\n' + '='.repeat(70));
        console.log('✅ COMPREHENSIVE ID-WISE ANALYSIS COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

comprehensiveIDAnalysis();
