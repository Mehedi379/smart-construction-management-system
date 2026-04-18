# 🚀 HOW TO RUN THE APPLICATION
## Quick Start Guide

---

## ✅ CURRENT STATUS

✓ Backend dependencies installed  
✓ Frontend dependencies installed  
✓ .env file created  

---

## ⚠️ BEFORE YOU CAN RUN

You need to set up the MySQL database first. Choose ONE method:

---

## 📋 METHOD 1: Easy (Recommended)

### Step 1: Setup Database
1. Open File Explorer
2. Navigate to: `database` folder
3. Double-click: **`setup_database.bat`**
4. Enter your MySQL password when asked
5. Wait for "Setup Complete" message

### Step 2: Start Application
1. Go back to main folder
2. Double-click: **`start.bat`**
3. Wait 5-10 seconds
4. Browser will open automatically
5. Login and enjoy!

---

## 📋 METHOD 2: Manual

### Step 1: Open MySQL
1. Search "MySQL Command Line Client" in Start Menu
2. Click to open it
3. Enter your MySQL root password

### Step 2: Create Database
In MySQL, type this command:
```
source C:/Users/MEHEDI HASAN/Desktop/Smart Construction Management System/database/schema.sql
```

Press Enter and wait for it to complete.

### Step 3: Create Admin User
1. Open Command Prompt
2. Run these commands:
```
cd "C:\Users\MEHEDI HASAN\Desktop\Smart Construction Management System\database"
node setup_admin.js
```

### Step 4: Edit .env File
1. Go to `backend` folder
2. Open `.env` file in Notepad
3. Find this line:
```
DB_PASSWORD=your_password
```
4. Replace `your_password` with your actual MySQL password
5. Save the file

### Step 5: Start Application
Double-click: **`start.bat`** in the main folder

---

## 🎯 LOGIN CREDENTIALS

After setup, login with:

- **URL:** http://localhost:3000
- **Email:** admin@khazabilkis.com
- **Password:** admin123

---

## ❗ TROUBLESHOOTING

### "mysql is not recognized"
**Solution:** MySQL is not in your PATH. Use Method 2 (Manual) instead.

### "Database connection failed"
**Solution:** 
1. Check MySQL is running
2. Verify password in `backend\.env`
3. Make sure database `construction_db` exists

### "Port 5000 already in use"
**Solution:** 
1. Open `backend\.env`
2. Change `PORT=5000` to `PORT=5001`
3. Restart the application

### Can't login
**Solution:**
1. Run `database\setup_admin.js` again
2. Check admin user exists in MySQL

---

## 📞 NEED HELP?

If you face any issues:
1. Read SETUP_GUIDE.md for detailed instructions
2. Read BANGLA_GUIDE.md for Bengali instructions
3. Check error messages in the console
4. Verify all steps were completed

---

## 🎉 ONCE SETUP IS COMPLETE

Every time you want to use the system:
1. Double-click **`start.bat`**
2. Wait for browser to open
3. Login and start using!

---

**Made for:** M/S Khaza Bilkis Rabbi  
**Version:** 1.0.0
