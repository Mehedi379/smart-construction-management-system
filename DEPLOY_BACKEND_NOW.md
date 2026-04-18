# 🚀 Deploy Backend to Railway - Step by Step

## ✅ Prerequisites Ready:
- [x] Backend configured with `railway.json`
- [x] `Procfile` created
- [x] `package.json` ready
- [x] MySQL database exists on Railway

---

## 📋 **Deployment Steps:**

### **Step 1: Push Code to GitHub**

Open terminal and run:

```bash
cd "c:\Users\MEHEDI HASAN\Desktop\Smart Construction Management System"

# Add all files
git add .

# Commit changes
git commit -m "Deploy backend to Railway with MySQL integration"

# Push to GitHub
git push origin main
```

---

### **Step 2: Deploy Backend on Railway**

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Login with GitHub

2. **Open Your Project**
   - Click on your project (zippy-unity or project name)

3. **Add Backend Service**
   - Click **"+ New"** button
   - Select **"GitHub Repo"**
   - Choose: `Smart Construction Management System`

4. **Configure Backend Service**
   - Click on the newly created service
   - Go to **"Settings"** tab
   - Configure:
     ```
     Root Directory: backend
     Build Command: npm install
     Start Command: node server.js
     ```

5. **Link MySQL Database**
   - In Railway dashboard, click on your backend service
   - Go to **"Variables"** tab
   - Click **"Add Reference"**
   - Select your MySQL-fsyj service
   - Railway will automatically add:
     - `MYSQLHOST`
     - `MYSQLUSER`
     - `MYSQLPASSWORD`
     - `MYSQLDATABASE`
     - `MYSQLPORT`

6. **Add Additional Environment Variables**
   In backend service → Variables tab, add:

   ```env
   NODE_ENV=production
   PORT=9000
   JWT_SECRET=your_super_secure_random_string_here_change_this
   JWT_EXPIRES_IN=7d
   CORS_ORIGINS=http://localhost:5173,https://your-frontend-url.vercel.app
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   ```

   **OR use Railway's auto-generated JWT secret:**
   - Click **"Add Variable"**
   - Name: `JWT_SECRET`
   - Click the **dice icon 🎲** to generate random value

---

### **Step 3: Wait for Deployment**

- Railway will automatically:
  1. Pull your code from GitHub
  2. Run `npm install`
  3. Start the server with `node server.js`
  4. Connect to MySQL database

- **Watch the logs:**
  - Click on backend service
  - Go to **"Deployments"** tab
  - Click on latest deployment
  - Watch logs in real-time

---

### **Step 4: Verify Deployment**

1. **Check Health Endpoint**
   ```
   https://your-backend-url.railway.app/api/health
   ```

   Expected response:
   ```json
   {
     "success": true,
     "status": "OK",
     "message": "Smart Construction Management System API is running"
   }
   ```

2. **Check Database Connection**
   - In backend service logs, look for:
     ```
     ✓ Database connected successfully
     ```

---

### **Step 5: Create Admin User**

**Method 1: Using Railway MySQL CLI**

1. Click on **MySQL-fsyj** service
2. Click **"Connect"** → **"MySQL CLI"**
3. Run this SQL:

```sql
-- Create admin user
INSERT INTO users (name, email, password, role, phone, is_active, is_approved) 
VALUES (
    'Admin User', 
    'admin@test.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'admin', 
    '01700000000', 
    TRUE, 
    TRUE
);
```

**Method 2: Using Backend Service Shell**

1. Click on **backend** service
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd /app
   node -e "
   const mysql = require('mysql2/promise');
   const bcrypt = require('bcryptjs');
   
   async function createAdmin() {
     const conn = await mysql.createConnection({
       host: process.env.MYSQLHOST,
       user: process.env.MYSQLUSER,
       password: process.env.MYSQLPASSWORD,
       database: process.env.MYSQLDATABASE
     });
     
     const hash = bcrypt.hashSync('admin123', 10);
     
     await conn.query(
       'INSERT INTO users (name, email, password, role, phone, is_active, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)',
       ['Admin User', 'admin@test.com', hash, 'admin', '01700000000', true, true]
     );
     
     console.log('✓ Admin user created!');
     console.log('Email: admin@test.com');
     console.log('Password: admin123');
     
     await conn.end();
   }
   
   createAdmin().catch(console.error);
   "
   ```

---

### **Step 6: Initialize Database Schema** (If not done yet)

**Using Railway MySQL CLI:**

1. Open MySQL CLI (as shown above)
2. Copy content from `database/schema.sql`
3. Paste in MySQL CLI
4. Press Enter

**Verify tables created:**
```sql
USE railway;
SHOW TABLES;
```

You should see 15+ tables.

---

## 🎯 **Quick Commands:**

### Push to GitHub:
```bash
cd "c:\Users\MEHEDI HASAN\Desktop\Smart Construction Management System"
git add .
git commit -m "Update backend for Railway deployment"
git push origin main
```

### View Railway Logs:
```bash
railway login
railway link
railway logs
```

---

## 🐛 **Troubleshooting:**

### Backend not starting?
- Check logs in Railway dashboard
- Verify all environment variables are set
- Ensure MySQL service is linked

### Database connection failed?
- MySQL service must be in same Railway project
- Variables must be referenced correctly
- Check MySQL is running (green status)

### Port already in use?
- Railway automatically sets PORT variable
- Don't hardcode port number

---

## ✅ **Post-Deployment Checklist:**

- [ ] Code pushed to GitHub
- [ ] Backend service created on Railway
- [ ] Root directory set to `backend`
- [ ] MySQL service linked
- [ ] Environment variables configured
- [ ] Deployment successful (green checkmark)
- [ ] Health endpoint responds
- [ ] Database connected
- [ ] Schema initialized (tables created)
- [ ] Admin user created
- [ ] Can login to application

---

## 🔐 **Admin Login Credentials:**

**Email:** `admin@test.com`  
**Password:** `admin123`

---

## 📊 **Your Railway URLs:**

- **Backend API:** `https://your-backend.railway.app`
- **Health Check:** `https://your-backend.railway.app/api/health`
- **MySQL Internal:** `mysql-fsyj.railway.internal:3306`

---

**Ready to deploy? Start with Step 1!** 🚀
