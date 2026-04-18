# Database Migration Guide

## Overview

The Smart Construction Management System now uses an organized migration system to manage database schema changes. This replaces the previous approach of having 30+ scattered SQL files.

---

## Migration System Features

✅ **Version Tracking** - All migrations are tracked in `schema_migrations` table  
✅ **Automatic Execution** - Run pending migrations in order  
✅ **Rollback Support** - Rollback failed or recent migrations  
✅ **Status Monitoring** - Check which migrations have been executed  
✅ **Template Generation** - Create new migration files with proper naming  

---

## Quick Start

### 1. Initialize Migration System

```bash
cd backend
node migrations.js init
```

This creates the `schema_migrations` tracking table and `migrations/` directory.

### 2. Check Migration Status

```bash
node migrations.js status
```

Shows executed and pending migrations.

### 3. Run Pending Migrations

```bash
node migrations.js run
```

Executes all pending migrations in order.

### 4. Create New Migration

```bash
node migrations.js create add_user_avatar_column
```

Creates a new migration file: `001-add_user_avatar_column.sql`

### 5. Rollback Last Migration

```bash
node migrations.js rollback
```

Reverts the last successful migration (if rollback file exists).

---

## Migration File Naming Convention

```
VERSION-description.sql
```

**Examples:**
- `001-initial_schema.sql`
- `002-add_workflow_tables.sql`
- `003-add_signature_support.sql`
- `004-add_project_financials.sql`

**Version Format:**
- 3-digit zero-padded number (001, 002, 003...)
- Sequential order matters - migrations run in version order

---

## Migration File Template

```sql
-- ============================================
-- Migration: Add User Avatar Column
-- Version: 001
-- Date: 2026-04-18
-- Description: Add avatar column to users table
-- ============================================

USE construction_db;

-- Migration SQL
ALTER TABLE users 
ADD COLUMN avatar VARCHAR(255) NULL COMMENT 'User profile image path';

-- Verification
SELECT 'Migration 001 executed successfully!' as status;
```

---

## Existing Migrations Consolidation

The following existing SQL files should be consolidated into the new migration system:

### Phase 1: Core Schema
```
001-base_schema.sql                    ← database/schema.sql
002-add_foreign_keys.sql              ← database/add_foreign_keys.sql
003-add_missing_indexes.sql           ← database/add_missing_indexes.sql
```

### Phase 2: Workflow System
```
004-workflow_system.sql               ← database/workflow_system_schema.sql
005-workflow_updates.sql              ← database/workflow_system_updates.sql
006-fix_workflow_steps.sql            ← database/fix_workflow_steps.sql
```

### Phase 3: Project Accounting
```
007-project_accounting.sql            ← database/project_accounting_system.sql
008-project_isolation.sql             ← database/project_isolation_migration.sql
```

### Phase 4: Daily Sheets
```
009-daily_sheet_schema.sql            ← database/daily_sheet_schema.sql
010-daily_sheet_enhancements.sql      ← database/daily_sheet_enhancements.sql
011-auto_sheet_trigger.sql            ← database/auto_sheet_creation_trigger.sql
```

### Phase 5: Purchases & Notifications
```
012-purchase_system.sql               ← database/purchase_system_schema.sql
013-notification_updates.sql          ← database/notification_system_updates.sql
```

### Phase 6: Fixes & Updates
```
014-add_rejection_columns.sql         ← database/add_rejection_columns.sql
015-fix_auth_columns.sql              ← database/fix_auth_columns.sql
016-fix_missing_created_by.sql        ← database/fix_missing_created_by_column.sql
```

---

## Migration Commands Reference

| Command | Description |
|---------|-------------|
| `node migrations.js init` | Initialize migration system |
| `node migrations.js status` | Show migration status |
| `node migrations.js run` | Execute pending migrations |
| `node migrations.js rollback` | Rollback last migration |
| `node migrations.js create <name>` | Create new migration |

---

## Maintenance CLI Tool

The maintenance CLI consolidates all diagnostic and fix scripts into a single command-line tool.

### Diagnostic Commands

```bash
# Check system health
node maintenance-cli.js diagnose health

# Check users and roles
node maintenance-cli.js diagnose users

# Check projects
node maintenance-cli.js diagnose projects

# Check roles
node maintenance-cli.js diagnose roles

# Check daily sheets
node maintenance-cli.js diagnose sheets

# Check vouchers
node maintenance-cli.js diagnose vouchers
```

### Fix Commands

```bash
# Fix role enum mismatches
node maintenance-cli.js fix roleEnum

# Fix orphaned employee records
node maintenance-cli.js fix orphanedRecords

# Reset admin password
node maintenance-cli.js fix adminPassword [new_password]

# Fix stuck workflow sheets
node maintenance-cli.js fix workflowSteps

# Recalculate project financials
node maintenance-cli.js fix recalculateProjects
```

---

## Best Practices

### Creating Migrations

1. **Always create migrations** for schema changes (don't run SQL directly)
2. **Test migrations** in development before running in production
3. **Use transactions** - wrap changes in BEGIN/COMMIT for safety
4. **Add verification queries** - confirm migration succeeded
5. **Create rollback files** - for complex migrations, create `rollback-XXX-name.sql`

### Migration Checklist

- [ ] Migration file follows naming convention
- [ ] SQL is tested and verified
- [ ] Includes verification query
- [ ] Rollback file created (if needed)
- [ ] Documented in this guide

### Common Migration Patterns

#### Add Column
```sql
ALTER TABLE table_name 
ADD COLUMN column_name VARCHAR(100) DEFAULT 'value' COMMENT 'Description';
```

#### Add Index
```sql
CREATE INDEX idx_column_name ON table_name(column_name);
```

#### Modify Column
```sql
ALTER TABLE table_name 
MODIFY COLUMN column_name NEW_TYPE DEFAULT 'value';
```

#### Create Table
```sql
CREATE TABLE IF NOT EXISTS new_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    column1 VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## Troubleshooting

### Migration Failed

1. Check error message in `schema_migrations` table:
```sql
SELECT * FROM schema_migrations WHERE status = 'failed' ORDER BY executed_at DESC;
```

2. Manually fix the issue
3. Delete failed migration record:
```sql
DELETE FROM schema_migrations WHERE version = 'XXX';
```

4. Re-run migration:
```bash
node migrations.js run
```

### Rollback Without File

If no rollback file exists:
1. Check migration file to see what it did
2. Manually reverse the changes
3. Delete migration record:
```sql
DELETE FROM schema_migrations WHERE version = 'XXX';
```

### Database Out of Sync

Reset migration tracking:
```sql
TRUNCATE TABLE schema_migrations;
```

Then re-run all migrations:
```bash
node migrations.js run
```

---

## Migration from Old System

To migrate from the old scattered SQL files:

1. **Initialize new system:**
```bash
node migrations.js init
```

2. **Consolidate existing SQL files** into numbered migrations in `migrations/` directory

3. **Mark existing migrations as executed** (if already applied):
```sql
INSERT INTO schema_migrations (version, filename, status) VALUES
('001', '001-base_schema.sql', 'success'),
('002', '002-add_foreign_keys.sql', 'success');
-- ... add all existing migrations
```

4. **Verify status:**
```bash
node migrations.js status
```

---

## Scripts Organization

### Old Structure (❌ Deprecated)
```
backend/
├── check_admin.js
├── fix_roles.js
├── verify_system.js
└── ... (100+ scattered scripts)
```

### New Structure (✅ Recommended)
```
backend/
├── maintenance-cli.js          # All diagnostics and fixes
├── migrations.js                # Migration system
├── migrations/                  # Organized migration files
│   ├── 001-base_schema.sql
│   ├── 002-workflow_system.sql
│   └── ...
└── scripts/                     # One-time utility scripts (if needed)
```

---

## Support

For migration issues or questions:
- Check this guide
- Review `schema_migrations` table for execution history
- Use `node maintenance-cli.js diagnose health` for system health

---

**Last Updated:** April 18, 2026  
**Version:** 2.0.0
