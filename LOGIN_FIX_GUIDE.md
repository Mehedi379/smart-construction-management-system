# 🔧 LOGIN FIX GUIDE - Railway Backend Database Connection

## ❌ Current Problem
Login is failing with 500 error because the backend cannot connect to the Railway MySQL database.

## 🔍 Root Cause
The database credentials in `backend/.env` are either:
1. **Outdated** - Railway rotates credentials periodically
2. **Database service not running** - MySQL service on Railway might be stopped
3. **Wrong credentials** - The credentials don't match the actual database

## ✅ SOLUTION - Step by Step

### Step 1: Check Railway Dashboard

1. Go to https://railway.app/dashboard
2. Find your project: "Smart Construction Backend"
3. Click on the **MySQL database service**
4. Check if it's **running** (should show green status)
5. If it's stopped, **start it**

### Step 2: Get Fresh Database Credentials

1. In Railway dashboard, click on your **MySQL service**
2. Go to **Variables** tab
3. You should see these variables:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

4. **Copy all these values**

### Step 3: Update Backend Environment Variables

**Option A: Update via Railway Dashboard (RECOMMENDED)**

1. Go to your **Backend service** on Railway
2. Click on **Variables** tab
3. Update these variables with the values from Step 2:
   ```
   DB_HOST = (value of MYSQLHOST)
   DB_PORT = (value of MYSQLPORT)
   DB_USER = (value of MYSQLUSER)
   DB_PASSWORD = (value of MYSQLPASSWORD)
   DB_NAME = (value of MYSQLDATABASE)
   ```

4. Also make sure these are set:
   ```
   JWT_SECRET = a3f8b9c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2
   NODE_ENV = production
   PORT = 9000
   CORS_ORIGINS = https://smart-construction-management-syste.vercel.app,http://localhost:5173
   ```

5. Railway will **automatically redeploy** after you save the variables

**Option B: Update Local .env File and Redeploy**

1. Open `backend/.env`
2. Update the database credentials:
   ```env
   DB_HOST=roundhouse.proxy.rlwy.net
   DB_PORT=17140
   DB_USER=root
   DB_PASSWORD=YOUR_NEW_PASSWORD_HERE
   DB_NAME=railway
   ```
3. Commit and push to GitHub:
   ```bash
   cd backend
   git add .env
   git commit -m "Update database credentials"
   git push origin main
   ```
4. Railway will auto-deploy

### Step 4: Verify Database Schema Exists

After the backend redeploys, we need to make sure the database tables exist.

1. Wait for Railway deployment to complete (check the **Deployments** tab)
2. Test the backend:
   ```bash
   node test-backend-health.js
   ```

3. If you get a 500 error on login, the database tables might not exist.
   You need to run the database migration.

### Step 5: Run Database Migration (If Needed)

If the database is new or empty, you need to create the tables:

1. Find the SQL schema file in the `database/` folder:
   - Look for files like `schema.sql`, `migration.sql`, or `init.sql`

2. Connect to your Railway MySQL database:
   - In Railway dashboard, click on MySQL service
   - Click **Connect** tab
   - Copy the **External Connection** details
   - Use a MySQL client (MySQL Workbench, HeidiSQL, etc.) to connect

3. Run the SQL schema file to create all tables

4. After creating tables, create an admin user:
   ```sql
   INSERT INTO users (name, email, password, role, is_approved, is_active, created_at)
   VALUES (
     'Admin User',
     'admin@khazabilkis.com',
     '$2b$10$YourHashedPasswordHere',
     'admin',
     true,
     true,
     NOW()
   );
   ```

   **To generate password hash:**
   - Use this online tool: https://bcrypt-generator.com/
   - Enter: `admin123`
   - Rounds: 10
   - Copy the hash and replace in the SQL above

### Step 6: Test Login

After completing all steps:

1. Wait 2-3 minutes for Railway deployment
2. Test login:
   ```bash
   node test-login-simple.js
   ```

3. Try logging in on your Vercel frontend:
   - URL: https://smart-construction-management-syste.vercel.app/login
   - Email: `admin@khazabilkis.com`
   - Password: `admin123`

## 🔥 QUICK FIX - If Database is Completely Broken

If the database is corrupted or you can't fix it, here's a nuclear option:

### Option 1: Create New MySQL Service on Railway

1. Go to Railway dashboard
2. Delete the old MySQL service
3. Create a **new MySQL service**
4. Copy the new credentials
5. Update backend variables (Step 3)
6. Run database migration (Step 5)

### Option 2: Use SQLite for Testing (Temporary)

For quick testing without MySQL:

1. Install sqlite3:
   ```bash
   cd backend
   npm install sqlite3 better-sqlite3
   ```

2. Create a SQLite database configuration
3. This is only for **local testing**, not for production

## 📊 Debugging Commands

### Check Backend Logs on Railway
1. Go to Railway dashboard
2. Click on Backend service
3. Click **Deployments** tab
4. Click on the latest deployment
5. Click **Logs** - look for database connection errors

### Test Database Connection Locally
```bash
cd backend
node -e "
const pool = require('./src/config/database');
pool.query('SELECT 1 as test')
  .then(([result]) => console.log('DB OK:', result))
  .catch(err => console.error('DB ERROR:', err.message));
"
```

### Check What Error Backend is Returning
```bash
node test-backend-health.js
```

## ⚠️ Important Notes

1. **NEVER commit `.env` files to GitHub** - They contain secrets!
2. Railway environment variables are **secure** - Use them instead
3. Database credentials **rotate periodically** - Update when needed
4. Always test after updating credentials
5. Keep a backup of your database schema

## 🎯 Expected Results

After fixing:
- ✅ Backend health check: 200 OK
- ✅ Login with correct credentials: 200 OK with token
- ✅ Login with wrong password: 401 Unauthorized
- ✅ Frontend can login successfully

## 📞 Need Help?

If you're still stuck:
1. Check Railway backend logs for the exact error message
2. Run `node test-backend-health.js` and share the output
3. Verify database credentials are correct
4. Make sure database tables exist

---

**Last Updated:** April 19, 2026
**Issue:** Backend 500 error on login due to database connection failure
