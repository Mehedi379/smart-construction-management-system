# 🏗️ Smart Construction Management System
## M/S Khaza Bilkis Rabbi

A complete **All-in-One Construction Management & Accounting System** for managing employees, expenses, vouchers, ledger accounts, and profit/loss analysis - all automated and controlled from one place.

---

## 🎯 Features

### ✅ Phase 1 - Core Accounting System (Completed)

1. **Voucher Management System**
   - Payment & Expense vouchers
   - Auto voucher number generation
   - Smart scan feature (OCR)
   - Print & export vouchers

2. **Expense Tracking**
   - Daily expense management
   - Category-wise tracking (Rickshaw, Restaurant, Material, etc.)
   - Auto calculations
   - Summary reports

3. **Ledger Book (হিসাব খাতা)**
   - Employee Ledger
   - Client Ledger
   - Supplier Ledger
   - Project Ledger
   - Auto balance calculation
   - Running balance display

4. **Accounting & Reports**
   - Profit/Loss auto calculation
   - Daily/Monthly/Yearly reports
   - Excel export
   - PDF export
   - Dashboard with live stats

5. **Admin Dashboard**
   - Today's expenses
   - Monthly income & expenses
   - Profit/Loss indicator
   - Pending payments
   - Recent transactions

---

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MySQL
- **Desktop App**: Electron
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

---

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v5.7 or higher) - [Download](https://dev.mysql.com/downloads/)
- **npm** or **yarn** package manager

---

## 🚀 Installation Guide

### Step 1: Install MySQL Database

1. Download and install MySQL from [MySQL Official Site](https://dev.mysql.com/downloads/)
2. During installation, set a root password (remember this!)
3. Complete the installation

### Step 2: Setup Database

1. Open MySQL Command Line Client or phpMyAdmin
2. Run the database schema file:

```bash
mysql -u root -p < "database/schema.sql"
```

Or manually:
- Open MySQL Workbench or phpMyAdmin
- Open the file `database/schema.sql`
- Execute the entire script

### Step 3: Configure Backend

1. Navigate to the backend folder:
```bash
cd "backend"
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
copy .env.example .env
```

4. Edit `.env` file with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=construction_db
PORT=5000
JWT_SECRET=your_secret_key_here
```

### Step 4: Configure Frontend

1. Navigate to the frontend folder:
```bash
cd "frontend"
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create `.env` file if needed:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## ▶️ Running the Application

### Option 1: Development Mode (Recommended for testing)

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```
Backend will start on: `http://localhost:5000`

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will start on: `http://localhost:3000`

Open your browser and go to: `http://localhost:3000`

### Option 2: Desktop Application

1. Build the frontend first:
```bash
cd frontend
npm run build
```

2. Run the Electron app:
```bash
cd electron
npm install
npm start
```

---

## 👤 Default Login Credentials

**Admin Account:**
- Email: `admin@khazabilkis.com`
- Password: `admin123`

*Note: You need to create this user in the database with a hashed password. Use bcrypt to hash "admin123"*

### Creating Admin User:

Run this SQL query in MySQL:

```sql
-- First, generate a bcrypt hash for 'admin123'
-- You can use online tools or Node.js:
-- node -e "console.log(require('bcryptjs').hashSync('admin123', 10))"

INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@khazabilkis.com', '$2a$10$YourBcryptHashHere', 'admin');
```

---

## 📱 Using the System

### 1. Dashboard
- View overall business statistics
- Monitor today's expenses
- Track monthly profit/loss
- See pending vouchers

### 2. Vouchers
- Create Payment/Expense/Receipt vouchers
- Auto-generated voucher numbers
- Filter by date, type, status
- Edit and delete vouchers

### 3. Expenses
- Add daily expenses
- Categorize expenses (Rickshaw, Restaurant, Material, etc.)
- View expense summaries
- Track spending patterns

### 4. Ledger Book
- Create ledger accounts (Employee, Client, Supplier, Project)
- View complete transaction history
- Auto-running balance
- Debit/Credit tracking

### 5. Reports
- Profit & Loss statement
- Date range filtering
- Export to Excel
- Export to PDF

---

## 🔒 Security Features

- JWT Authentication
- Password hashing with bcrypt
- Role-based access control (Admin, Accountant, Employee)
- SQL injection prevention
- XSS protection
- Input validation

---

## 📊 Database Structure

### Core Tables:
- `users` - System users (Admin, Accountant, Employee)
- `employees` - Employee/Labor master data
- `attendance` - Daily attendance records
- `projects` - Project information
- `clients` - Client details
- `suppliers` - Supplier details

### Accounting Tables:
- `vouchers` - Payment & Expense vouchers
- `expenses` - Daily expense tracking
- `ledger_accounts` - Ledger account master
- `ledger_entries` - All ledger transactions
- `transactions` - Financial transactions

---

## 🔧 Troubleshooting

### Database Connection Error:
- Check MySQL is running
- Verify credentials in `.env` file
- Ensure database `construction_db` exists

### Port Already in Use:
- Change PORT in `.env` file (backend)
- Change port in `vite.config.js` (frontend)

### Frontend Can't Connect to Backend:
- Ensure backend is running on port 5000
- Check CORS settings in `server.js`
- Verify API URL in frontend services

---

## 📈 Future Enhancements (Phase 2)

- [ ] Employee & Attendance module
- [ ] Project Management
- [ ] Client & Supplier Management
- [ ] Mobile App (Flutter)
- [ ] AI/ML for expense prediction
- [ ] Cloud sync capability
- [ ] Multi-language support (Bangla/English)
- [ ] Advanced analytics & charts
- [ ] Email notifications
- [ ] SMS alerts

---

## 📞 Support

For support or customization:
- Email: admin@khazabilkis.com
- Company: M/S Khaza Bilkis Rabbi

---

## 📝 License

This software is proprietary and developed exclusively for M/S Khaza Bilkis Rabbi.

---

## 🎉 Credits

Developed with ❤️ for Smart Construction Management

---

**Version**: 1.0.0  
**Last Updated**: April 2026  
**Status**: Production Ready (Phase 1)
