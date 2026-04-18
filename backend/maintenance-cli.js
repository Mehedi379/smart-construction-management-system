#!/usr/bin/env node

// ============================================
// SYSTEM MAINTENANCE CLI TOOL
// Smart Construction Management System
// Consolidates all diagnostic and fix scripts
// ============================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ============================================
// DATABASE CONNECTION
// ============================================

async function getDBConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'construction_db',
        multipleStatements: true
    });
}

// ============================================
// DIAGNOSTIC COMMANDS
// ============================================

const diagnostics = {
    // Check all users and their roles
    checkUsers: async () => {
        const conn = await getDBConnection();
        try {
            const [users] = await conn.query(`
                SELECT u.id, u.name, u.email, u.role, u.is_active, u.is_approved,
                       e.employee_id, e.designation, e.assigned_project_id,
                       p.project_name
                FROM users u
                LEFT JOIN employees e ON u.id = e.user_id
                LEFT JOIN projects p ON e.assigned_project_id = p.id
                ORDER BY u.id
            `);
            
            console.log('\n📋 Users Overview:');
            console.log('='.repeat(80));
            users.forEach(u => {
                console.log(`ID: ${u.id} | ${u.name} (${u.email})`);
                console.log(`   Role: ${u.role} | Active: ${u.is_active} | Approved: ${u.is_approved}`);
                if (u.employee_id) {
                    console.log(`   Employee: ${u.employee_id} | ${u.designation}`);
                    console.log(`   Project: ${u.project_name || 'Not Assigned'}`);
                }
                console.log('-'.repeat(80));
            });
            console.log(`\nTotal Users: ${users.length}`);
        } finally {
            await conn.end();
        }
    },

    // Check projects status
    checkProjects: async () => {
        const conn = await getDBConnection();
        try {
            const [projects] = await conn.query(`
                SELECT id, project_code, project_name, status, estimated_budget,
                       total_cost, remaining_budget, created_at
                FROM projects
                ORDER BY id
            `);
            
            console.log('\n🏗️  Projects Overview:');
            console.log('='.repeat(80));
            projects.forEach(p => {
                console.log(`${p.project_code} - ${p.project_name}`);
                console.log(`   Status: ${p.status} | Budget: ৳${p.estimated_budget.toLocaleString()}`);
                console.log(`   Spent: ৳${p.total_cost?.toLocaleString() || 0} | Remaining: ৳${p.remaining_budget?.toLocaleString() || p.estimated_budget.toLocaleString()}`);
                console.log('-'.repeat(80));
            });
            console.log(`\nTotal Projects: ${projects.length}`);
        } finally {
            await conn.end();
        }
    },

    // Check roles and workflow
    checkRoles: async () => {
        const conn = await getDBConnection();
        try {
            const [roles] = await conn.query(`
                SELECT r.*, p.project_name
                FROM roles r
                LEFT JOIN projects p ON r.project_id = p.id
                ORDER BY r.level, r.id
            `);
            
            console.log('\n👥 Roles Overview:');
            console.log('='.repeat(80));
            roles.forEach(r => {
                console.log(`${r.role_code} - ${r.role_name}`);
                console.log(`   Level: ${r.level} | Project: ${r.project_name || 'Global'}`);
                console.log(`   Active: ${r.is_active} | System Role: ${r.is_system_role}`);
                console.log('-'.repeat(80));
            });
            console.log(`\nTotal Roles: ${roles.length}`);
        } finally {
            await conn.end();
        }
    },

    // Check daily sheets
    checkDailySheets: async () => {
        const conn = await getDBConnection();
        try {
            const [sheets] = await conn.query(`
                SELECT ds.*, p.project_name, u.name as created_by_name
                FROM daily_sheets ds
                LEFT JOIN projects p ON ds.project_id = p.id
                LEFT JOIN users u ON ds.created_by = u.id
                ORDER BY ds.sheet_date DESC
                LIMIT 20
            `);
            
            console.log('\n📄 Recent Daily Sheets:');
            console.log('='.repeat(80));
            sheets.forEach(s => {
                console.log(`Sheet Date: ${s.sheet_date} | Project: ${s.project_name}`);
                console.log(`   Status: ${s.status} | Total: ৳${s.grand_total?.toLocaleString() || 0}`);
                console.log(`   Created by: ${s.created_by_name} | Current Step: ${s.current_step}`);
                console.log('-'.repeat(80));
            });
            console.log(`\nShowing last 20 sheets`);
        } finally {
            await conn.end();
        }
    },

    // Check vouchers
    checkVouchers: async () => {
        const conn = await getDBConnection();
        try {
            const [vouchers] = await conn.query(`
                SELECT v.*, p.project_name, u.name as created_by_name
                FROM vouchers v
                LEFT JOIN projects p ON v.project_id = p.id
                LEFT JOIN users u ON v.created_by = u.id
                ORDER BY v.date DESC
                LIMIT 20
            `);
            
            console.log('\n🧾 Recent Vouchers:');
            console.log('='.repeat(80));
            vouchers.forEach(v => {
                console.log(`${v.voucher_no} - ${v.voucher_type.toUpperCase()}`);
                console.log(`   Date: ${v.date} | Amount: ৳${v.amount.toLocaleString()}`);
                console.log(`   Status: ${v.status} | Project: ${v.project_name || 'N/A'}`);
                console.log(`   Created by: ${v.created_by_name}`);
                console.log('-'.repeat(80));
            });
            console.log(`\nShowing last 20 vouchers`);
        } finally {
            await conn.end();
        }
    },

    // System health check
    healthCheck: async () => {
        const conn = await getDBConnection();
        try {
            console.log('\n🔍 System Health Check:');
            console.log('='.repeat(80));
            
            // Check database connection
            console.log('✅ Database Connection: OK');
            
            // Check tables existence
            const [tables] = await conn.query('SHOW TABLES');
            console.log(`✅ Database Tables: ${tables.length} tables found`);
            
            // Check for orphaned records
            const [orphans] = await conn.query(`
                SELECT COUNT(*) as count
                FROM employees e
                LEFT JOIN users u ON e.user_id = u.id
                WHERE u.id IS NULL
            `);
            console.log(`⚠️  Orphaned Employee Records: ${orphans[0].count}`);
            
            // Check pending approvals
            const [pending] = await conn.query(`
                SELECT COUNT(*) as count FROM users WHERE is_approved = FALSE
            `);
            console.log(`⏳ Pending User Approvals: ${pending[0].count}`);
            
            // Check workflow issues
            const [workflow] = await conn.query(`
                SELECT COUNT(*) as count 
                FROM daily_sheets 
                WHERE status = 'pending' AND current_step > 1
            `);
            console.log(`📋 Stuck Workflow Sheets: ${workflow[0].count}`);
            
            console.log('\n✅ Health check completed');
        } finally {
            await conn.end();
        }
    }
};

// ============================================
// FIX COMMANDS
// ============================================

const fixes = {
    // Fix role enum mismatches
    fixRoleEnum: async () => {
        const conn = await getDBConnection();
        try {
            console.log('\n🔧 Fixing Role Enum...');
            
            // Get current enum values
            const [enumInfo] = await conn.query(`
                SHOW COLUMNS FROM users LIKE 'role'
            `);
            
            if (enumInfo.length > 0) {
                console.log(`Current role enum: ${enumInfo[0].Type}`);
            }
            
            // Update to new enum if needed
            await conn.query(`
                ALTER TABLE users 
                MODIFY COLUMN role ENUM('admin', 'engineer', 'accountant', 'employee') 
                DEFAULT 'employee'
            `);
            
            console.log('✅ Role enum updated successfully');
        } catch (error) {
            console.error('❌ Error fixing role enum:', error.message);
        } finally {
            await conn.end();
        }
    },

    // Fix orphaned employee records
    fixOrphanedRecords: async () => {
        const conn = await getDBConnection();
        try {
            console.log('\n🔧 Fixing Orphaned Records...');
            
            const [orphans] = await conn.query(`
                SELECT e.id, e.name, e.employee_id
                FROM employees e
                LEFT JOIN users u ON e.user_id = u.id
                WHERE u.id IS NULL
            `);
            
            if (orphans.length === 0) {
                console.log('✅ No orphaned records found');
                return;
            }
            
            console.log(`Found ${orphans.length} orphaned employee records`);
            
            // Option 1: Delete orphans
            // await conn.query('DELETE e FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE u.id IS NULL');
            
            // Option 2: Keep them (user_id can be NULL)
            console.log('ℹ️  Orphaned records retained (user_id is nullable)');
            console.log('✅ Orphaned records check completed');
        } finally {
            await conn.end();
        }
    },

    // Reset admin password
    resetAdminPassword: async (newPassword = 'admin123') => {
        const conn = await getDBConnection();
        try {
            console.log('\n🔧 Resetting Admin Password...');
            
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            const [result] = await conn.query(`
                UPDATE users 
                SET password = ?, is_active = TRUE, is_approved = TRUE
                WHERE email = 'admin@khazabilkis.com'
            `, [hashedPassword]);
            
            if (result.affectedRows > 0) {
                console.log(`✅ Admin password reset to: ${newPassword}`);
            } else {
                console.log('⚠️  Admin account not found. Creating...');
                await conn.query(`
                    INSERT INTO users (name, email, password, role, is_active, is_approved)
                    VALUES ('Admin User', 'admin@khazabilkis.com', ?, 'admin', TRUE, TRUE)
                `, [hashedPassword]);
                console.log('✅ Admin account created');
            }
        } finally {
            await conn.end();
        }
    },

    // Fix workflow steps
    fixWorkflowSteps: async () => {
        const conn = await getDBConnection();
        try {
            console.log('\n🔧 Fixing Workflow Steps...');
            
            // Reset stuck sheets
            const [result] = await conn.query(`
                UPDATE daily_sheets 
                SET current_step = 1, status = 'draft'
                WHERE status = 'pending' AND current_step > 1
            `);
            
            console.log(`✅ Fixed ${result.affectedRows} stuck workflow sheets`);
        } finally {
            await conn.end();
        }
    },

    // Recalculate project financials
    recalculateProjects: async () => {
        const conn = await getDBConnection();
        try {
            console.log('\n🔧 Recalculating Project Financials...');
            
            const [projects] = await conn.query('SELECT id FROM projects');
            
            for (const project of projects) {
                // Recalculate total costs from approved sheets
                await conn.query(`
                    UPDATE projects p
                    SET total_cost = (
                        SELECT COALESCE(SUM(grand_total), 0)
                        FROM daily_sheets
                        WHERE project_id = p.id AND status = 'approved'
                    )
                    WHERE p.id = ?
                `, [project.id]);
            }
            
            console.log(`✅ Recalculated financials for ${projects.length} projects`);
        } finally {
            await conn.end();
        }
    }
};

// ============================================
// CLI INTERFACE
// ============================================

async function runCommand(category, command, ...args) {
    try {
        if (category === 'diagnose' && diagnostics[command]) {
            await diagnostics[command](...args);
        } else if (category === 'fix' && fixes[command]) {
            await fixes[command](...args);
        } else {
            console.log(`\n❌ Unknown command: ${category} ${command}`);
            showHelp();
        }
    } catch (error) {
        console.error('\n❌ Command failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

function showHelp() {
    console.log('\n🏗️  Smart Construction Management System - Maintenance CLI');
    console.log('='.repeat(80));
    console.log('\nUsage: node maintenance-cli.js <category> <command> [args]');
    console.log('\n📋 Diagnostic Commands:');
    console.log('  node maintenance-cli.js diagnose users          - Check all users and roles');
    console.log('  node maintenance-cli.js diagnose projects       - Check projects status');
    console.log('  node maintenance-cli.js diagnose roles          - Check roles and workflow');
    console.log('  node maintenance-cli.js diagnose sheets         - Check recent daily sheets');
    console.log('  node maintenance-cli.js diagnose vouchers       - Check recent vouchers');
    console.log('  node maintenance-cli.js diagnose health         - System health check');
    console.log('\n🔧 Fix Commands:');
    console.log('  node maintenance-cli.js fix roleEnum            - Fix role enum mismatches');
    console.log('  node maintenance-cli.js fix orphanedRecords     - Fix orphaned employee records');
    console.log('  node maintenance-cli.js fix adminPassword [pwd] - Reset admin password');
    console.log('  node maintenance-cli.js fix workflowSteps       - Fix stuck workflow sheets');
    console.log('  node maintenance-cli.js fix recalculateProjects - Recalculate project financials');
    console.log('\n💡 Examples:');
    console.log('  node maintenance-cli.js diagnose health');
    console.log('  node maintenance-cli.js diagnose users');
    console.log('  node maintenance-cli.js fix adminPassword newpass123');
    console.log('='.repeat(80));
}

// ============================================
// MAIN EXECUTION
// ============================================

const [category, command, ...args] = process.argv.slice(2);

if (!category || !command) {
    showHelp();
    process.exit(0);
}

runCommand(category, command, ...args);
