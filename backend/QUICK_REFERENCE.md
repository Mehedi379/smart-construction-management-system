# Quick Reference Card - Maintenance & Migrations

## 🔧 Maintenance CLI Commands

### Diagnostics
```bash
npm run diagnose:health       # System health check
npm run diagnose:users        # Check users & roles
npm run diagnose:projects     # Check projects
npm run diagnose:roles        # Check roles
npm run diagnose:sheets       # Check daily sheets
npm run diagnose:vouchers     # Check vouchers
```

### Fixes
```bash
npm run fix:roleEnum          # Fix role enum
npm run fix:orphaned          # Fix orphaned records
npm run fix:admin [password]  # Reset admin password
npm run fix:workflow          # Fix stuck workflows
npm run fix:recalculate       # Recalculate financials
```

---

## 🗄️ Migration Commands

```bash
npm run migrate:init          # Initialize system
npm run migrate:status        # Check status
npm run migrate:run           # Run pending migrations
npm run migrate:rollback      # Rollback last
npm run migrate:create name   # Create new migration
```

---

## 📋 Quick Workflows

### New Developer Setup
```bash
cd backend
npm install
npm run migrate:init
npm run migrate:status
npm run dev
```

### Daily Development
```bash
# Check system health
npm run diagnose:health

# Run new migrations
npm run migrate:run

# Start development server
npm run dev
```

### Deploy to Production
```bash
# Backup database first!
npm run migrate:status
npm run migrate:run
npm run diagnose:health
npm start
```

### Troubleshooting
```bash
# System acting up?
npm run diagnose:health
npm run diagnose:users

# Login issues?
npm run fix:admin newpassword123

# Data inconsistencies?
npm run fix:recalculate
```

---

## 🎯 Common Tasks

| Task | Command |
|------|---------|
| Check if system is healthy | `npm run diagnose:health` |
| Reset admin password | `npm run fix:admin admin123` |
| Update database schema | `npm run migrate:run` |
| Create schema change | `npm run migrate:add_column_name` |
| See all users | `npm run diagnose:users` |
| Check projects | `npm run diagnose:projects` |

---

## 📁 File Locations

```
backend/
├── maintenance-cli.js          # Maintenance CLI
├── migrations.js               # Migration system
├── migrations/                 # SQL migration files
├── MIGRATION_GUIDE.md          # Full migration docs
├── IMPROVEMENTS_SUMMARY.md     # Changes summary
└── QUICK_REFERENCE.md          # This file
```

---

## ⚡ Pro Tips

1. **Always check health** before and after migrations
2. **Backup database** before running migrations in production
3. **Use npm scripts** instead of running node commands directly
4. **Read MIGRATION_GUIDE.md** for detailed documentation
5. **Test migrations** in development before production

---

**Print this page for quick access!** 🖨️
