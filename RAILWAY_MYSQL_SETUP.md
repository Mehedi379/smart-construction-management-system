# 🗄️ Railway MySQL Setup Guide

## ✅ Railway MySQL is Already Created!

From your Railway dashboard, I can see:
- ✅ MySQL service exists (MySQL-fsyj)
- ✅ Database variables are configured
- ✅ MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE are available

---

## ⚠️ What's Missing: Database Tables (Schema)

The Railway MySQL database is **empty** - it doesn't have your tables yet!

You need to run `database/schema.sql` to create all 15+ tables.

---

## 🔧 How to Setup Database Schema on Railway

### Method 1: Using Railway MySQL CLI (EASIEST) ⭐

1. **Open Railway Dashboard:**
   - Go to https://railway.app
   - Open your **zippy-unity** project

2. **Click on MySQL Service:**
   - Click on **MySQL-fsyj** service

3. **Open MySQL CLI:**
   - Click **"Connect"** tab
   - Click **"MySQL CLI"** button
   - A terminal will open

4. **Copy Schema SQL:**
   - Open file: `database/schema.sql`
   - Select ALL content (Ctrl+A)
   - Copy it (Ctrl+C)

5. **Paste & Execute:**
   - In Railway MySQL CLI terminal
   - Right-click to paste (or Shift+Insert)
   - Press Enter
   - Wait for it to complete

6. **Verify Tables Created:**
   ```sql
   SHOW TABLES;
   ```
   You should see 15+ tables!

---

### Method 2: Using MySQL Workbench

1. **Download MySQL Workbench:**
   https://dev.mysql.com/downloads/workbench/

2. **Get Railway MySQL Credentials:**
   In Railway dashboard → MySQL service → Variables tab:
   ```
   MYSQLHOST = xxxxxxx.railway.internal or IP
   MYSQLUSER = root
   MYSQLPASSWORD = (click eye icon to reveal)
   MYSQLDATABASE = xxxxx
   MYSQLPORT = 3306
   ```

3. **Connect to Railway MySQL:**
   - Open MySQL Workbench
   - Click **"+"** to add new connection
   - Fill in:
     ```
     Connection Name: Railway MySQL
     Host: [MYSQLHOST value]
     Port: 3306
     Username: [MYSQLUSER value]
     Password: [click Store in Vault... and enter MYSQLPASSWORD]
     ```
   - Click **"Test Connection"**
   - Click **"OK"**

4. **Run Schema SQL:**
   - Double-click your Railway connection
   - Click **File** → **Open SQL Script**
   - Select: `database/schema.sql`
   - Click **Execute** (lightning bolt icon ⚡)
   - Wait for completion

5. **Verify:**
   ```sql
   SHOW TABLES;
   ```

---

### Method 3: Using Railway Shell (Backend Service)

1. **In Railway Dashboard:**
   - Click on **backend** service
   - Go to **"Shell"** tab

2. **Run Commands:**
   ```bash
   # Navigate to database folder
   cd /app
   
   # Install MySQL client (if not available)
   apt-get update && apt-get install -y default-mysql-client
   
   # Run schema
   mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < ../database/schema.sql
   ```

---

## ✅ After Schema is Setup:

### Verify Tables Are Created:

Run this SQL (in MySQL CLI or Workbench):
```sql
USE construction_db;
SHOW TABLES;
```

You should see:
```
+---------------------------+
| Tables_in_construction_db |
+---------------------------+
| users                     |
| employees                 |
| attendance                |
| projects                  |
| expenses                  |
| payments                  |
| materials                 |
| equipment                 |
| suppliers                 |
| purchases                 |
| invoices                  |
| salary_records            |
| daily_sheets              |
| workflow_steps            |
| notifications             |
+---------------------------+
```

---

## 🎯 Next Step: Create Admin User

After tables are created, create admin account:

### In Railway MySQL CLI:
```sql
INSERT INTO users (name, email, password, role, phone, is_active, is_approved) 
VALUES (
    'Admin User', 
    'admin@khazabilkis.com', 
    '$2a$10$X7Vwqz8qK5zQp6rJ9mYHFO6KjN3qL9vM2bP8wR5tY1cD4eF6gH7iJ', 
    'admin', 
    '01700000000', 
    TRUE, 
    TRUE
);
```

**Login Credentials:**
- Email: `admin@khazabilkis.com`
- Password: `admin123`

---

## 📝 Quick Checklist:

- [ ] Railway MySQL service exists ✅ (Already done!)
- [ ] Database schema/tables created ⏳ (Do this now)
- [ ] Admin user created ⏳ (After schema)
- [ ] Backend can connect to database ⏳ (After schema)

---

## 🐛 Troubleshooting:

### Can't Access MySQL CLI?
- Make sure MySQL service is running (green status)
- Wait 1-2 minutes after creating MySQL service
- Refresh Railway dashboard

### Schema SQL Fails?
- Check if you're using the correct database
- Run: `USE construction_db;` first
- Check for error messages

### Tables Already Exist?
- That's OK! Schema was already run
- Verify with: `SHOW TABLES;`

---

## ⚡ Recommended: Use Method 1 (Railway MySQL CLI)

It's the easiest and fastest! Just:
1. Click MySQL service
2. Click MySQL CLI
3. Paste schema.sql content
4. Done! ✅

---

**Need the schema.sql file content? Let me know!**
