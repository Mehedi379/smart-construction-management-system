#!/usr/bin/env node

// ============================================
// DATABASE MIGRATION SYSTEM
// Smart Construction Management System
// Organized migration runner with version tracking
// ============================================

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// ============================================
// MIGRATION TRACKING TABLE
// ============================================

const CREATE_MIGRATIONS_TABLE = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version VARCHAR(50) UNIQUE NOT NULL,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INT,
        status ENUM('success', 'failed') DEFAULT 'success',
        error_message TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

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
// MIGRATION MANAGEMENT
// ============================================

class MigrationManager {
    constructor() {
        this.migrationsDir = path.join(__dirname, 'migrations');
    }

    // Initialize migrations directory and tracking table
    async initialize() {
        const conn = await getDBConnection();
        try {
            await conn.query(CREATE_MIGRATIONS_TABLE);
            console.log('✅ Migration system initialized');
            
            // Create migrations directory if not exists
            try {
                await fs.access(this.migrationsDir);
            } catch {
                await fs.mkdir(this.migrationsDir, { recursive: true });
                console.log('📁 Created migrations directory');
            }
        } finally {
            await conn.end();
        }
    }

    // Get list of executed migrations
    async getExecutedMigrations() {
        const conn = await getDBConnection();
        try {
            const [migrations] = await conn.query(`
                SELECT version, filename, executed_at, status
                FROM schema_migrations
                ORDER BY executed_at ASC
            `);
            return migrations;
        } finally {
            await conn.end();
        }
    }

    // Get list of pending migrations
    async getPendingMigrations() {
        const executed = await this.getExecutedMigrations();
        const executedVersions = new Set(executed.map(m => m.version));
        
        const files = await fs.readdir(this.migrationsDir);
        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
        
        const pending = [];
        for (const file of sqlFiles) {
            const version = file.split('-')[0]; // Extract version from filename (e.g., 001-xxx.sql)
            if (!executedVersions.has(version)) {
                pending.push({ version, filename: file });
            }
        }
        
        return pending;
    }

    // Execute a single migration file
    async executeMigration(migration) {
        const conn = await getDBConnection();
        const filePath = path.join(this.migrationsDir, migration.filename);
        const startTime = Date.now();
        
        try {
            console.log(`\n📦 Executing migration: ${migration.filename}`);
            
            // Read SQL file
            const sql = await fs.readFile(filePath, 'utf8');
            
            // Begin transaction
            await conn.beginTransaction();
            
            // Execute migration
            await conn.query(sql);
            
            // Record successful migration
            const executionTime = Date.now() - startTime;
            await conn.query(`
                INSERT INTO schema_migrations (version, filename, execution_time_ms, status)
                VALUES (?, ?, ?, 'success')
            `, [migration.version, migration.filename, executionTime]);
            
            await conn.commit();
            
            console.log(`✅ Migration ${migration.version} completed (${executionTime}ms)`);
            return { success: true, executionTime };
            
        } catch (error) {
            await conn.rollback();
            
            const executionTime = Date.now() - startTime;
            await conn.query(`
                INSERT INTO schema_migrations (version, filename, execution_time_ms, status, error_message)
                VALUES (?, ?, ?, 'failed', ?)
            `, [migration.version, migration.filename, executionTime, error.message]);
            
            console.error(`❌ Migration ${migration.version} failed:`, error.message);
            return { success: false, error: error.message };
        } finally {
            await conn.end();
        }
    }

    // Run all pending migrations
    async runMigrations() {
        await this.initialize();
        
        const pending = await this.getPendingMigrations();
        
        if (pending.length === 0) {
            console.log('\n✅ No pending migrations. Database is up to date.');
            return;
        }
        
        console.log(`\n🚀 Found ${pending.length} pending migration(s)`);
        
        const results = [];
        for (const migration of pending) {
            const result = await this.executeMigration(migration);
            results.push(result);
            
            // Stop on first failure
            if (!result.success) {
                console.error('\n⚠️  Migration stopped due to error');
                break;
            }
        }
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !result.success).length;
        
        console.log(`\n📊 Migration Summary:`);
        console.log(`   ✅ Successful: ${successful}`);
        console.log(`   ❌ Failed: ${failed}`);
    }

    // Show migration status
    async status() {
        await this.initialize();
        
        const executed = await this.getExecutedMigrations();
        const pending = await this.getPendingMigrations();
        
        console.log('\n📊 Migration Status:');
        console.log('='.repeat(80));
        
        console.log('\n✅ Executed Migrations:');
        if (executed.length === 0) {
            console.log('   None');
        } else {
            executed.forEach(m => {
                console.log(`   [${m.status === 'success' ? '✓' : '✗'}] ${m.version} - ${m.filename}`);
                console.log(`      Executed: ${m.executed_at}`);
            });
        }
        
        console.log('\n⏳ Pending Migrations:');
        if (pending.length === 0) {
            console.log('   None (Database is up to date)');
        } else {
            pending.forEach(m => {
                console.log(`   [ ] ${m.version} - ${m.filename}`);
            });
        }
        
        console.log('\n' + '='.repeat(80));
        console.log(`Total: ${executed.length} executed, ${pending.length} pending`);
    }

    // Rollback last migration
    async rollback() {
        const conn = await getDBConnection();
        try {
            const [lastMigration] = await conn.query(`
                SELECT * FROM schema_migrations 
                WHERE status = 'success'
                ORDER BY executed_at DESC 
                LIMIT 1
            `);
            
            if (lastMigration.length === 0) {
                console.log('⚠️  No migrations to rollback');
                return;
            }
            
            const migration = lastMigration[0];
            
            // Look for rollback file
            const rollbackFile = path.join(
                this.migrationsDir,
                `rollback-${migration.filename}`
            );
            
            try {
                await fs.access(rollbackFile);
                const rollbackSql = await fs.readFile(rollbackFile, 'utf8');
                
                await conn.beginTransaction();
                await conn.query(rollbackSql);
                await conn.query(`DELETE FROM schema_migrations WHERE version = ?`, [migration.version]);
                await conn.commit();
                
                console.log(`✅ Rolled back migration: ${migration.version}`);
            } catch {
                console.log('⚠️  No rollback file found. Manual rollback required.');
                console.log(`   Migration: ${migration.filename}`);
            }
        } finally {
            await conn.end();
        }
    }

    // Create new migration template
    async createMigration(name) {
        if (!name) {
            console.error('❌ Migration name required');
            console.log('Usage: node migrations.js create <name>');
            return;
        }
        
        await this.initialize();
        
        // Get next version number
        const executed = await this.getExecutedMigrations();
        const nextVersion = String(executed.length + 1).padStart(3, '0');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `${nextVersion}-${name.replace(/\s+/g, '_')}.sql`;
        const filePath = path.join(this.migrationsDir, filename);
        
        const template = `-- ============================================
-- Migration: ${name}
-- Version: ${nextVersion}
-- Date: ${timestamp}
-- Description: Add description here
-- ============================================

USE construction_db;

-- Your SQL migration here
-- Example: ALTER TABLE users ADD COLUMN new_column VARCHAR(100);

-- Verification query (optional)
SELECT 'Migration ${nextVersion} executed successfully!' as status;
`;
        
        await fs.writeFile(filePath, template, 'utf8');
        console.log(`✅ Created migration: ${filename}`);
        console.log(`📁 Location: ${filePath}`);
    }
}

// ============================================
// CLI INTERFACE
// ============================================

async function main() {
    const manager = new MigrationManager();
    const [command, ...args] = process.argv.slice(2);
    
    switch (command) {
        case 'run':
            await manager.runMigrations();
            break;
        case 'status':
            await manager.status();
            break;
        case 'rollback':
            await manager.rollback();
            break;
        case 'create':
            await manager.createMigration(args[0]);
            break;
        case 'init':
            await manager.initialize();
            break;
        default:
            console.log('\n🗄️  Database Migration System');
            console.log('='.repeat(80));
            console.log('\nUsage: node migrations.js <command> [args]');
            console.log('\nCommands:');
            console.log('  init                  - Initialize migration system');
            console.log('  run                   - Run all pending migrations');
            console.log('  status                - Show migration status');
            console.log('  rollback              - Rollback last migration');
            console.log('  create <name>         - Create new migration file');
            console.log('\nExamples:');
            console.log('  node migrations.js init');
            console.log('  node migrations.js create add_user_avatar_column');
            console.log('  node migrations.js status');
            console.log('  node migrations.js run');
            console.log('='.repeat(80));
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Migration system error:', error);
        process.exit(1);
    });
}

module.exports = MigrationManager;
