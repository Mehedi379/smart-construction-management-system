# 🚨 URGENT: Backend Service is DOWN - Complete Fix Guide

## ❌ Current Status (সমস্যার ধরন)

**502 Bad Gateway Error** - Your Railway backend service is completely down/crashed.

Test Results:
- ❌ Backend Health: 502 (Application failed to respond)
- ❌ Login: 502 
- ❌ Registration: 502

**This means:** The backend application on Railway is not running at all.

---

## 🔧 SOLUTION - Step by Step Solutions (ধাপে ধাপে সমাধান)

### STEP 1: Check Railway Backend Service Status

1. Go to: https://railway.app/dashboard
2. Find your project
3. Check if **Backend service** is running (should be green)
4. If it's **red** or **stopped**, click **Restart**

**If the service is running but showing 502:**
- Click on Backend service
- Go to **Deployments** tab
- Check the latest deployment status
- Click on **Logs** to see error messages

---

### STEP 2: Check Railway MySQL Database Service

1. In Railway dashboard, find **MySQL service**
2. Check if it's **RUNNING** (green status)
3. If it's **STOPPED**, click **Start**

**Important:** If MySQL is stopped, the backend will crash on startup because it tries to connect to the database.

---

### STEP 3: Fix Database Credentials (Most Common Issue)

The database credentials in your backend might be outdated or wrong.

#### Option A: Update via Railway Dashboard (RECOMMENDED)

1. **Get MySQL Credentials:**
   - Click on **MySQL service** in Railway
   - Go to **Variables** tab
   - Copy these values:
     ```
     MYSQLHOST
     MYSQLPORT
     MYSQLUSER
     MYSQLPASSWORD
     MYSQLDATABASE
     ```

2. **Update Backend Variables:**
   - Go to **Backend service**
   - Click **Variables** tab
   - Update these variables:
     ```
     DB_HOST = (paste MYSQLHOST value)
     DB_PORT = (paste MYSQLPORT value)
     DB_USER = (paste MYSQLUSER value)
     DB_PASSWORD = (paste MYSQLPASSWORD value)
     DB_NAME = (paste MYSQLDATABASE value)
     ```

3. **Add Required Variables:**
   Make sure these are also set:
   ```
   JWT_SECRET = a3f8b9c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2
   NODE_ENV = production
   PORT = 9000
   CORS_ORIGINS = https://smart-construction-management-syste.vercel.app,http://localhost:5173,http://localhost:3000
   ```

4. Railway will **automatically redeploy** after saving

---

### STEP 4: Check Backend Logs for Errors

1. Go to Railway dashboard
2. Click **Backend service**
3. Click **Deployments** tab
4. Click on the **latest deployment**
5. Click **Logs** button
6. Look for errors like:
   - `Database connection failed`
   - `ECONNREFUSED`
   - `ER_ACCESS_DENIED_ERROR`
   - `Cannot find module`
   - `PORT already in use`

**Share the error message if you need help fixing it.**

---

### STEP 5: Redeploy Backend Service

If the backend is crashed and won't restart:

#### Option A: Redeploy from Railway Dashboard

1. Go to Backend service
2. Click **Deployments** tab
3. Click **Redeploy** button on the latest deployment
4. Wait for deployment to complete (2-3 minutes)

#### Option B: Trigger New Deployment via GitHub

1. Make a small change to your backend code
2. Commit and push to GitHub:
   ```bash
   cd backend
   git add .
   git commit -m "Trigger redeployment"
   git push origin main
   ```
3. Railway will automatically deploy

---

### STEP 6: Verify Database Tables Exist

After backend starts successfully, check if database tables exist:

```bash
node test-comprehensive-diagnostic.js
```

If you see `ER_NO_SUCH_TABLE` error, you need to create the database schema.

#### How to Create Database Tables:

1. **Get MySQL Connection Details:**
   - Go to Railway → MySQL service
   - Click **Connect** tab
   - Copy **External Connection** details:
     ```
     Host: roundhouse.proxy.rlwy.net
     Port: 17140 (your port may differ)
     User: root
     Password: (your password)
     Database: railway
     ```

2. **Connect using MySQL Client:**
   - Download: MySQL Workbench, HeidiSQL, or DBeaver
   - Create new connection with above details
   - Connect to database

3. **Run Schema File:**
   - Open file: `database/schema.sql`
   - Execute all SQL commands
   - This will create all tables

4. **Create Admin User:**
   Run this SQL:
   ```sql
   -- First, generate a bcrypt hash for 'admin123'
   -- Use: https://bcrypt-generator.com/
   -- Enter: admin123, Rounds: 10
   
   INSERT INTO users (name, email, password, role, phone, is_approved, is_active)
   VALUES (
     'Admin User',
     'admin@khazabilkis.com',
     '$2a$10$YOUR_GENERATED_HASH_HERE',
     'admin',
     '01700000000',
     true,
     true
   );
   ```

---

## 🎯 QUICK FIX CHECKLIST

Follow this checklist in order:

- [ ] 1. Check if MySQL service is RUNNING on Railway
- [ ] 2. Check if Backend service is RUNNING on Railway
- [ ] 3. Verify database credentials are correct
- [ ] 4. Check backend logs for error messages
- [ ] 5. Redeploy backend service
- [ ] 6. Wait 2-3 minutes for deployment
- [ ] 7. Test: `node test-comprehensive-diagnostic.js`
- [ ] 8. If tables missing, run database/schema.sql
- [ ] 9. Create admin user
- [ ] 10. Test login on Vercel frontend

---

## 🔍 Diagnostic Commands

### Test Backend Health
```bash
node test-comprehensive-diagnostic.js
```

### Test Login Only
```bash
node test-login-simple.js
```

### Test Backend Health Endpoint
```bash
node test-backend-health.js
```

---

## 📊 Expected Results After Fix

When everything is working:

```
✅ Backend Health: 200 OK
✅ Login (correct creds): 200 OK with token
✅ Login (wrong password): 401 Unauthorized
✅ Registration: 200/201 Success
```

Then you can login at:
**https://smart-construction-management-syste.vercel.app/login**

Credentials:
- Email: `admin@khazabilkis.com`
- Password: `admin123`

---

## 🆘 Common Errors and Fixes

### Error: "ECONNREFUSED"
**Fix:** MySQL service is stopped. Start it from Railway dashboard.

### Error: "ER_ACCESS_DENIED_ERROR"
**Fix:** Database credentials are wrong. Update them from MySQL Variables.

### Error: "ER_NO_SUCH_TABLE"
**Fix:** Database tables don't exist. Run `database/schema.sql`.

### Error: "Cannot find module"
**Fix:** Dependencies not installed. Railway should run `npm install` automatically.

### Error: "PORT already in use"
**Fix:** Change PORT variable to 9000 or another available port.

### Error: "JWT_SECRET is not defined"
**Fix:** Add JWT_SECRET variable to Railway backend service.

---

## 📞 Still Need Help?

1. Run diagnostic: `node test-comprehensive-diagnostic.js`
2. Check Railway backend logs
3. Share the error messages
4. I'll help you fix the specific issue

---

**Created:** April 19, 2026  
**Issue:** 502 Bad Gateway - Backend service down  
**Frontend:** https://smart-construction-management-syste.vercel.app  
**Backend:** Railway (smart-construction-backend-production)
