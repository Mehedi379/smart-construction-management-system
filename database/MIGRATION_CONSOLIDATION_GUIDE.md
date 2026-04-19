# 📋 Database Migration Consolidation Guide

## Overview
This document organizes all 35 SQL migration files into a logical execution order for production deployment.

---

## 🎯 Migration Execution Order

### Phase 1: Core Database Setup (REQUIRED)
**Execute in this order:**

1. **schema.sql** - Base schema with all core tables
   - Creates: users, employees, attendance, clients, suppliers, projects, vouchers, expenses, ledger_accounts, ledger_entries, transactions
   - ⚠️ NOTE: This creates the database too

2. **add_foreign_keys.sql** - Add foreign key relationships
   - Use this OR `add_foreign_keys_simple.sql` (choose one)
   - Recommendation: Use `add_foreign_keys.sql` (more comprehensive)

3. **add_missing_indexes.sql** - Performance optimization
   - Adds indexes for faster queries

---

### Phase 2: Workflow System
**Execute in this order:**

4. **workflow_system_schema.sql** - Core workflow tables
5. **workflow_system_updates.sql** - Workflow enhancements
6. **fix_workflow_steps.sql** - Bug fixes for workflow

---

### Phase 3: Project Accounting
**Execute in this order:**

7. **project_accounting_system.sql** - Project accounting features
8. **project_isolation_migration.sql** - Project data isolation
9. **projects_setup.sql** - Additional project configurations

---

### Phase 4: Daily Sheets
**Execute in this order:**

10. **daily_sheet_schema.sql** - Daily sheet tables
11. **daily_sheet_enhancements.sql** - Sheet enhancements
12. **auto_sheet_creation_trigger.sql** - Automated sheet creation

---

### Phase 5: Purchase System
**Execute in this order:**

13. **purchase_system_schema.sql** - Purchase management tables

---

### Phase 6: Role & Permission Updates
**Execute in this order:**

14. **add_engineer_role.sql** - Add engineer role
15. **complete_role_upgrade.sql** - Complete role hierarchy
    - OR use `FIX_ALL_ROLE_WORKFLOW_ISSUES.sql` (comprehensive fix)
16. **fix_auth_columns.sql** - Authentication column fixes

---

### Phase 7: Audit & Notifications
**Execute in this order:**

17. **create_audit_logs.sql** - Audit logging system
18. **notification_system_updates.sql** - Notification features

---

### Phase 8: Stored Procedures
**Execute last:**

19. **stored_procedures.sql** - Database stored procedures

---

## 🗑️ DUPLICATE/REDUNDANT FILES (DO NOT EXECUTE)

These files are duplicates or superseded by other files:

- ❌ **add_foreign_keys_simple.sql** - Use `add_foreign_keys.sql` instead
- ❌ **RUN_THIS_MIGRATION.sql** - Check content, may be outdated
- ❌ **simple_migration.sql** - Use the organized order above
- ❌ **schema_production_upgrade.sql** - Already covered by individual migrations
- ❌ **PRODUCTION_erp_automation.sql** - Legacy file
- ❌ **remove_duplicate_tables.sql** - Only if you have duplicate table issues
- ❌ **clean_all_test_data.sql** / **clean_all_test_data_updated.sql** - Only for cleaning test data
- ❌ **check_system_state.sql** - Diagnostic only, not a migration
- ❌ **create_test_users.sql** - For testing only
- ❌ **create_admin.sql** / **create_admin_xampp.sql** - Use backend setup script instead
- ❌ **add_rejection_columns.sql** - Already in main schema
- ❌ **fix_missing_created_by_column.sql** - Already in main schema

---

## 🚀 Quick Production Setup

### Option 1: Using Migration System (Recommended)

```bash
cd backend

# Initialize migration system
npm run migrate:init

# Check migration status
npm run migrate:status

# Run all migrations
npm run migrate:run
```

### Option 2: Manual SQL Execution

```bash
# Navigate to database folder
cd database

# Execute migrations in order (MySQL command line)
mysql -u root -p < schema.sql
mysql -u root -p construction_db < add_foreign_keys.sql
mysql -u root -p construction_db < add_missing_indexes.sql
mysql -u root -p construction_db < workflow_system_schema.sql
mysql -u root -p construction_db < workflow_system_updates.sql
mysql -u root -p construction_db < fix_workflow_steps.sql
mysql -u root -p construction_db < project_accounting_system.sql
mysql -u root -p construction_db < project_isolation_migration.sql
mysql -u root -p construction_db < projects_setup.sql
mysql -u root -p construction_db < daily_sheet_schema.sql
mysql -u root -p construction_db < daily_sheet_enhancements.sql
mysql -u root -p construction_db < auto_sheet_creation_trigger.sql
mysql -u root -p construction_db < purchase_system_schema.sql
mysql -u root -p construction_db < add_engineer_role.sql
mysql -u root -p construction_db < complete_role_upgrade.sql
mysql -u root -p construction_db < fix_auth_columns.sql
mysql -u root -p construction_db < create_audit_logs.sql
mysql -u root -p construction_db < notification_system_updates.sql
mysql -u root -p construction_db < stored_procedures.sql
```

### Option 3: Using Setup Script

```bash
# Run complete setup (creates database + tables + admin user)
node database/setup_complete.js
```

---

## ✅ Verification

After running migrations, verify setup:

```sql
-- Check all tables exist
SHOW TABLES;

-- Should show 20+ tables including:
-- users, employees, attendance, clients, suppliers, projects
-- vouchers, expenses, ledger_accounts, ledger_entries, transactions
-- workflow_tables, daily_sheets, purchases, audit_logs, etc.

-- Check admin user exists
SELECT id, name, email, role FROM users WHERE email = 'admin@khazabilkis.com';

-- Check foreign keys
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'construction_db' 
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## 🔧 Troubleshooting

### Migration Fails
- Check if tables already exist
- Run `npm run migrate:status` to see what's been executed
- Use `npm run migrate:rollback` to undo last migration

### Foreign Key Errors
- Ensure parent tables are created before child tables
- Check `add_foreign_keys.sql` for correct order

### Duplicate Column Errors
- Some migrations add columns that may already exist
- These errors can be safely ignored

---

## 📝 Notes

- All migrations are idempotent (safe to run multiple times)
- Always backup database before running migrations in production
- Test migrations in development first
- Keep this file updated when new migrations are added

---

**Last Updated:** April 2026  
**Status:** Production Ready
