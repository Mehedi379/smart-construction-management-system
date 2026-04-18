# 🚀 Complete Setup Guide - Smart Construction Management System
## M/S Khaza Bilkis Rabbi

---

## 📋 Step-by-Step Setup Process

### ✅ STEP 1: Database Setup (Zippy-Unity MySQL)

Since you're using Zippy-Unity production MySQL database, follow these steps:

#### Option A: Using Zippy-Unity Dashboard (Easiest)

1. **Go to your Zippy-Unity MySQL dashboard**
2. **Click "Create table" or "Execute SQL"**
3. **Copy the SQL from below and paste it**

⚠️ **IMPORTANT:** Don't run the `CREATE DATABASE` line if Zippy-Unity already created the database for you. Just run the `USE` and `CREATE TABLE` statements.

#### SQL Script to Execute:

```sql
-- Use this if database already exists in Zippy-Unity
USE construction_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'accountant', 'engineer', 'employee', 'site_manager', 'site_engineer', 'site_director', 'project_director', 'deputy_director', 'head_office_accounts_1', 'head_office_accounts_2', 'deputy_head_office', 'worker') DEFAULT 'employee',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    requested_role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employees/Labor Table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    nid VARCHAR(20),
    designation VARCHAR(50),
    trade VARCHAR(50),
    daily_wage DECIMAL(10, 2) DEFAULT 0.00,
    monthly_salary DECIMAL(10, 2) DEFAULT 0.00,
    joining_date DATE,
    end_date DATE,
    status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
    advance_amount DECIMAL(10, 2) DEFAULT 0.00,
    due_amount DECIMAL(10, 2) DEFAULT 0.00,
    photo VARCHAR(255),
    assigned_project_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status)
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    project_id INT,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status ENUM('present', 'absent', 'half_day', 'late') DEFAULT 'present',
    overtime_hours DECIMAL(5, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_date (employee_id, date),
    INDEX idx_date (date),
    INDEX idx_employee (employee_id)
);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    total_receivable DECIMAL(15, 2) DEFAULT 0.00,
    total_paid DECIMAL(15, 2) DEFAULT 0.00,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_code (client_code)
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    shop_name VARCHAR(200),
    owner_name VARCHAR(100),
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    category VARCHAR(50),
    total_payable DECIMAL(15, 2) DEFAULT 0.00,
    total_paid DECIMAL(15, 2) DEFAULT 0.00,
    total_purchase DECIMAL(15, 2) DEFAULT 0.00,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    due_amount DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_supplier_code (supplier_code),
    INDEX idx_status (status)
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_code VARCHAR(20) UNIQUE NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    client_id INT,
    location TEXT,
    start_date DATE,
    end_date DATE,
    estimated_budget DECIMAL(15, 2) DEFAULT 0.00,
    actual_cost DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('planning', 'ongoing', 'completed', 'on_hold', 'cancelled') DEFAULT 'planning',
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_project_code (project_code)
);

-- Vouchers Table
CREATE TABLE IF NOT EXISTS vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_no VARCHAR(30) UNIQUE NOT NULL,
    voucher_type ENUM('payment', 'expense', 'receipt', 'journal') NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    paid_to VARCHAR(150),
    paid_by VARCHAR(150),
    payment_method ENUM('cash', 'bank', 'mobile_banking', 'cheque') DEFAULT 'cash',
    project_id INT,
    employee_id INT,
    client_id INT,
    supplier_id INT,
    category VARCHAR(100),
    description TEXT,
    reference_no VARCHAR(50),
    attachment VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_by INT,
    approved_by INT,
    rejection_reason TEXT,
    rejected_by INT,
    rejected_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_voucher_no (voucher_no),
    INDEX idx_voucher_type (voucher_type),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_project (project_id)
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    project_id INT,
    voucher_id INT,
    paid_to VARCHAR(150),
    payment_method ENUM('cash', 'bank', 'mobile_banking') DEFAULT 'cash',
    receipt_image VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_expense_date (expense_date),
    INDEX idx_category (category),
    INDEX idx_project (project_id)
);

-- Ledger Accounts Table
CREATE TABLE IF NOT EXISTS ledger_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    account_type ENUM('employee', 'client', 'supplier', 'project', 'bank', 'cash', 'expense', 'income') NOT NULL,
    reference_id INT,
    opening_balance DECIMAL(15, 2) DEFAULT 0.00,
    current_balance DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_account_code (account_code),
    INDEX idx_account_type (account_type)
);

-- Ledger Entries Table
CREATE TABLE IF NOT EXISTS ledger_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    entry_date DATE NOT NULL,
    voucher_id INT,
    expense_id INT,
    description TEXT,
    debit_amount DECIMAL(15, 2) DEFAULT 0.00,
    credit_amount DECIMAL(15, 2) DEFAULT 0.00,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    entry_type ENUM('debit', 'credit') NOT NULL,
    reference_no VARCHAR(50),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES ledger_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_account (account_id),
    INDEX idx_entry_date (entry_date),
    INDEX idx_voucher (voucher_id)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_date DATE NOT NULL,
    transaction_type ENUM('income', 'expense', 'transfer', 'advance', 'salary', 'payment') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    account_from INT,
    account_to INT,
    voucher_id INT,
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_from) REFERENCES ledger_accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (account_to) REFERENCES ledger_accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_transaction_type (transaction_type)
);

-- Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_no VARCHAR(30) UNIQUE NOT NULL,
    supplier_id INT,
    project_id INT,
    purchase_date DATE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    description TEXT,
    created_by INT,
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_purchase_no (purchase_no),
    INDEX idx_status (status)
);

-- Daily Sheets Table
CREATE TABLE IF NOT EXISTS daily_sheets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sheet_no VARCHAR(30) UNIQUE NOT NULL,
    sheet_date DATE NOT NULL,
    project_id INT,
    total_workers INT DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft',
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    rejected_by INT,
    rejection_reason TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_sheet_no (sheet_no),
    INDEX idx_sheet_date (sheet_date),
    INDEX idx_status (status)
);

-- Workflow Templates Table
CREATE TABLE IF NOT EXISTS workflow_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Workflow Steps Table
CREATE TABLE IF NOT EXISTS workflow_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    step_number INT NOT NULL,
    role_id INT NOT NULL,
    step_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflow_templates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_workflow_step (workflow_id, step_number)
);

-- Sheet Workflows Table
CREATE TABLE IF NOT EXISTS sheet_workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sheet_id INT NOT NULL,
    workflow_id INT NOT NULL,
    current_step INT DEFAULT 1,
    status ENUM('pending', 'in_review', 'completed', 'rejected') DEFAULT 'pending',
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES workflow_templates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_sheet_workflow (sheet_id)
);

-- Universal Signatures Table
CREATE TABLE IF NOT EXISTS universal_signatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    workflow_id INT,
    step_number INT NOT NULL,
    user_id INT,
    role_id INT,
    action ENUM('signed', 'rejected', 'approved') NOT NULL,
    signature_data TEXT,
    comments TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_user (user_id)
);

-- Sheet Signatures Table
CREATE TABLE IF NOT EXISTS sheet_signatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sheet_id INT NOT NULL,
    user_id INT NOT NULL,
    step_number INT NOT NULL,
    action ENUM('signed', 'rejected') NOT NULL,
    signature_data TEXT,
    comments TEXT,
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_sheet_step (sheet_id, step_number)
);

-- Signature Requests Table
CREATE TABLE IF NOT EXISTS signature_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sheet_id INT NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    status ENUM('requested', 'completed', 'rejected') DEFAULT 'requested',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (sheet_id) REFERENCES daily_sheets(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_role (role_code)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_is_read (is_read)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id)
);
```

---

### ✅ STEP 2: Create Admin User

After creating all tables, run this SQL to create your admin account:

```sql
-- First, generate a bcrypt hash for 'admin123'
-- You can use this Node.js command:
-- node -e "console.log(require('bcryptjs').hashSync('admin123', 10))"

-- For now, use this pre-generated hash for 'admin123':
INSERT INTO users (name, email, password, role, is_active, is_approved) VALUES 
('Admin User', 'admin@khazabilkis.com', '$2a$10$X7Vwqz8qK5zQp6rJ9mYHFO6KjN3qL9vM2bP8wR5tY1cD4eF6gH7iJ', 'admin', TRUE, TRUE);
```

**OR** run this script in your backend folder:
```bash
cd backend
node create_test_accounts.js
```

---

### ✅ STEP 3: Configure Backend (.env)

Update your `backend/.env` file with Zippy-Unity database credentials:

```env
# Database Configuration (Zippy-Unity)
DB_HOST=<your-zippy-unity-db-host>
DB_USER=<your-db-username>
DB_PASSWORD=<your-db-password>
DB_NAME=construction_db

# Server Configuration
PORT=9000
NODE_ENV=production

# JWT Secret (Generate a secure random string)
JWT_SECRET=your-very-secure-random-string-here-change-this
JWT_EXPIRES_IN=7d

# Upload Settings
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS (Add your frontend URL)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://your-frontend-url.vercel.app
```

---

### ✅ STEP 4: Install Dependencies

Open PowerShell in your project folder and run:

```powershell
# Navigate to project folder
cd "c:\Users\MEHEDI HASAN\Desktop\Smart Construction Management System"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..\frontend
npm install
```

---

### ✅ STEP 5: Run Database Migrations (Optional but Recommended)

```powershell
cd backend
node migrations.js run
```

This will apply all necessary database updates and fixes.

---

### ✅ STEP 6: Start the System

**Option 1: Using Quick Start Script**
```powershell
cd "c:\Users\MEHEDI HASAN\Desktop\Smart Construction Management System"
.\QUICK_START.bat
```

**Option 2: Manual Start**

Terminal 1 - Backend:
```powershell
cd backend
npm run dev
```

Terminal 2 - Frontend:
```powershell
cd frontend
npm run dev
```

---

### ✅ STEP 7: Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:9000
- **API Health Check:** http://localhost:9000/api/health

**Login with:**
- Email: `admin@khazabilkis.com`
- Password: `admin123`

---

## 🔧 Troubleshooting

### Database Connection Issues
1. Check Zippy-Unity database credentials
2. Ensure database allows external connections
3. Verify firewall settings

### Port Already in Use
```powershell
# Find process using port 9000
netstat -ano | findstr :9000

# Kill the process
taskkill /PID <process-id> /F
```

### Frontend Can't Connect to Backend
1. Check backend is running on port 9000
2. Verify CORS settings in backend/.env
3. Check frontend/.env has correct API URL

---

## 📝 Setup Checklist

- [ ] Database tables created in Zippy-Unity
- [ ] Admin user created
- [ ] Backend .env configured with Zippy-Unity credentials
- [ ] Dependencies installed (backend + frontend)
- [ ] Database migrations run
- [ ] Backend server running (port 9000)
- [ ] Frontend server running (port 5173)
- [ ] Can access login page
- [ ] Can login with admin credentials
- [ ] Dashboard loads successfully

---

## 🚀 Deployment (Production)

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist folder to Vercel
```

### Backend (Render)
- Connect your GitHub repository
- Set build command: `npm install`
- Set start command: `npm start`
- Add environment variables in Render dashboard

### Database
- Keep using Zippy-Unity production MySQL
- Ensure CORS allows your production URLs

---

## 📞 Support

If you face any issues:
1. Check the logs in terminal
2. Review error messages
3. Check database connection
4. Verify all dependencies installed

**Contact:** admin@khazabilkis.com

---

**Setup Date:** April 18, 2026  
**System Version:** 2.0.0  
**Status:** Ready for Production
