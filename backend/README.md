# Backend System Documentation

## Overview

The backend is a Node.js + Express REST API that powers the Smart Construction Management System. It provides comprehensive project management, accounting, workflow automation, and reporting capabilities.

---

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize migration system (first time only)
npm run migrate:init

# Check system health
npm run diagnose:health

# Start development server
npm run dev
```

Server runs on: `http://localhost:9000`

---

## Project Structure

```
backend/
├── src/
│   ├── config/              # Database configuration
│   ├── controllers/         # Request handlers (12 modules)
│   ├── middleware/          # Auth, validation, project filtering
│   ├── models/              # Data models
│   ├── routes/              # API routes (12 route files)
│   └── services/            # Business logic (10 services)
├── migrations/              # Database migration files
├── uploads/                 # File uploads
├── server.js                # Express server entry point
├── migrations.js            # Migration system
├── maintenance-cli.js       # System maintenance CLI
├── package.json             # Dependencies and scripts
└── .env                     # Environment variables
```

---

## Available NPM Scripts

### Server Commands
```bash
npm start                   # Start production server
npm run dev                 # Start development server with auto-reload
```

### Migration Commands
```bash
npm run migrate:init        # Initialize migration system
npm run migrate:status      # Show migration status
npm run migrate:run         # Run pending migrations
npm run migrate:rollback    # Rollback last migration
npm run migrate:create      # Create new migration file
```

### Diagnostic Commands
```bash
npm run diagnose:health     # System health check
npm run diagnose:users      # Check users and roles
npm run diagnose:projects   # Check projects status
npm run diagnose:roles      # Check roles and workflow
npm run diagnose:sheets     # Check daily sheets
npm run diagnose:vouchers   # Check vouchers
```

### Fix Commands
```bash
npm run fix:roleEnum        # Fix role enum mismatches
npm run fix:orphaned        # Fix orphaned records
npm run fix:admin [pwd]     # Reset admin password
npm run fix:workflow        # Fix stuck workflows
npm run fix:recalculate     # Recalculate project financials
```

---

## Environment Variables

Create a `.env` file in the backend root:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=construction_db

# Server Configuration
PORT=9000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_secure_random_string
JWT_EXPIRES_IN=7d

# Upload Settings
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

---

## API Endpoints

Base URL: `http://localhost:9000/api`

| Module | Route | Description |
|--------|-------|-------------|
| Authentication | `/api/auth` | Login, register, profile |
| Employees | `/api/employees` | Employee CRUD, attendance |
| Projects | `/api/projects` | Project management |
| Vouchers | `/api/vouchers` | Voucher operations |
| Expenses | `/api/expenses` | Expense tracking |
| Ledger | `/api/ledger` | Ledger management |
| Daily Sheets | `/api/sheets` | Daily sheets & approvals |
| Workflow | `/api/workflow` | Workflow & signatures |
| Reports | `/api/reports` | Financial reports |
| Purchases | `/api/purchases` | Purchase management |
| Admin IDs | `/api/admin/ids` | System health |
| Audit | `/api/audit` | Audit logs |

Health Check: `GET /api/health`

---

## Database Migrations

The system uses a version-controlled migration system for database schema changes.

### Initialize (First Time)
```bash
npm run migrate:init
```

### Check Status
```bash
npm run migrate:status
```

### Run Migrations
```bash
npm run migrate:run
```

### Create New Migration
```bash
npm run migrate:add_user_avatar_column
```

This creates: `migrations/001-add_user_avatar_column.sql`

### Migration File Format
```sql
-- ============================================
-- Migration: Add User Avatar Column
-- Version: 001
-- Date: 2026-04-18
-- ============================================

USE construction_db;

ALTER TABLE users 
ADD COLUMN avatar VARCHAR(255) NULL;

SELECT 'Migration 001 completed!' as status;
```

For detailed migration documentation, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

## System Maintenance

### Health Check
```bash
npm run diagnose:health
```

This checks:
- Database connection
- Table integrity
- Orphaned records
- Pending approvals
- Workflow issues

### Common Fixes

**Reset Admin Password:**
```bash
npm run fix:admin newpassword123
```

**Fix Stuck Workflows:**
```bash
npm run fix:workflow
```

**Recalculate Financials:**
```bash
npm run fix:recalculate
```

For all maintenance commands, see [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

---

## Security Features

- ✅ JWT Authentication with token expiry
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control
- ✅ Project-based data isolation
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ SQL injection prevention
- ✅ Input validation
- ✅ XSS protection

---

## Authentication

### Login
```bash
POST /api/auth/login
{
  "email": "admin@khazabilkis.com",
  "password": "admin123"
}
```

Response includes JWT token. Include in subsequent requests:
```
Authorization: Bearer <token>
```

### Default Admin Account
- **Email:** admin@khazabilkis.com
- **Password:** admin123 (change after first login!)

---

## Services Architecture

### Core Services

1. **Financial Engine** (`financialEngine.js`)
   - Real-time project financial calculations
   - Auto-calculates costs, profit/loss
   - Budget variance analysis

2. **Signature Workflow** (`signatureWorkflowService.js`)
   - Multi-step approval workflows
   - Sequential signature collection
   - Role-based signature assignment

3. **Project Account** (`projectAccountService.js`)
   - Auto-creates accounting structure
   - Project-specific ledger setup

4. **Auto ID Verification** (`autoIDVerificationService.js`)
   - System health checks
   - Automatic integrity verification
   - Auto-fix capabilities

5. **Notification** (`notificationService.js`)
   - Signature request alerts
   - Sheet creation notifications
   - Approval notifications

6. **PDF Service** (`pdfService.js`)
   - Voucher PDF generation
   - Report export
   - Document formatting

---

## Middleware

### Authentication (`auth.js`)
Verifies JWT tokens and attaches user to request.

### Project Filter (`projectFilter.js`)
Ensures users only access their assigned project data.

### Validation
Input validation using express-validator.

---

## Error Handling

All errors are caught and formatted consistently:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (Duplicate)
- `500` - Internal Server Error

---

## File Uploads

Files are stored in `uploads/` directory and served at:
`http://localhost:9000/uploads/<filename>`

Supported uploads:
- Voucher attachments
- Employee photos
- Receipt images
- Signature images

Max file size: 5MB (configurable in `.env`)

---

## Testing

### Manual Testing with Health Check
```bash
curl http://localhost:9000/api/health
```

### Using Maintenance CLI
```bash
npm run diagnose:health
npm run diagnose:users
npm run diagnose:projects
```

---

## Deployment

### Production Setup

1. **Set environment:**
```env
NODE_ENV=production
JWT_SECRET=<strong_random_string>
DB_PASSWORD=<secure_password>
```

2. **Run migrations:**
```bash
npm run migrate:run
```

3. **Check health:**
```bash
npm run diagnose:health
```

4. **Start server:**
```bash
npm start
```

### Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET
- [ ] Secure database password
- [ ] Enable rate limiting (uncomment in server.js)
- [ ] Configure CORS origins
- [ ] Set up HTTPS
- [ ] Enable logging
- [ ] Run all migrations
- [ ] Verify health check
- [ ] Backup database

---

## Troubleshooting

### Database Connection Error
```bash
# Check database is running
mysql -u root -p

# Verify .env credentials
cat .env

# Test connection
npm run diagnose:health
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=9001
```

### Migration Errors
```bash
# Check migration status
npm run migrate:status

# View failed migrations
npm run diagnose:health
```

### Reset Admin Access
```bash
npm run fix:admin admin123
```

---

## Documentation

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Database migration system
- [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md) - Recent improvements
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick command reference

---

## Dependencies

### Production
- `express` - Web framework
- `mysql2` - Database driver
- `jsonwebtoken` - Authentication
- `bcryptjs` - Password hashing
- `helmet` - Security headers
- `cors` - CORS support
- `multer` - File uploads
- `express-validator` - Input validation
- `puppeteer` - PDF generation
- `tesseract.js` - OCR
- `xlsx` - Excel export
- `jspdf` - PDF generation

### Development
- `nodemon` - Auto-restart on changes
- `morgan` - HTTP request logging
- `dotenv` - Environment variables

---

## Contributing

### Adding New Features

1. Create migration if schema changes needed:
```bash
npm run migrate:create feature_name
```

2. Add service in `src/services/`
3. Add controller in `src/controllers/`
4. Add route in `src/routes/`
5. Test with maintenance CLI
6. Update documentation

### Code Style
- Use async/await for async operations
- Return consistent JSON responses
- Use try/catch for error handling
- Add comments for complex logic
- Follow existing naming conventions

---

## Support

For issues or questions:
- Check documentation files
- Run `npm run diagnose:health`
- Review error logs
- Check migration status

---

**Version:** 2.0.0  
**Last Updated:** April 18, 2026  
**Status:** Production Ready
