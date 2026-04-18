# 🚀 Railway Free Deployment Guide
## Smart Construction Management System - M/S Khaza Bilkis Rabbi

---

## 📋 Overview

This guide will help you deploy your system to **Railway** for FREE:
- **Backend API** → Railway (Free tier: 500 hours/month)
- **Frontend** → Railway or Vercel (Free)
- **Database** → Railway MySQL or Zippy-Unity (Free)

---

## 🎯 Option 1: Full Deployment on Railway (Recommended)

### Step 1: Prepare Your GitHub Repository

Make sure your GitHub repo has this structure:
```
Smart Construction Management System/
├── backend/
│   ├── src/
│   ├── server.js
│   ├── package.json
│   ├── railway.json          ← Created for you
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── railway.json          ← Created for you
│   └── vercel.json
└── README.md
```

### Step 2: Connect GitHub to Railway

1. Go to **https://railway.app**
2. Click **"Login"** → Sign in with **GitHub**
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository: `Smart Construction Management System`

### Step 3: Deploy Backend

1. In Railway dashboard, click **"Add Service"** → **"GitHub Repo"**
2. Select your repository
3. Railway will auto-detect it's a Node.js app
4. **Configure the service:**
   - **Service Name:** `backend` or `smart-construction-api`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`

5. **Add Environment Variables** (Click on service → Variables tab):

```env
NODE_ENV=production
PORT=9000

# Database (Use Railway MySQL or Zippy-Unity)
DB_HOST=<your-mysql-host>
DB_USER=<your-mysql-user>
DB_PASSWORD=<your-mysql-password>
DB_NAME=construction_db

# JWT
JWT_SECRET=your-very-secure-random-string-here
JWT_EXPIRES_IN=7d

# CORS (Add your frontend URL after deployment)
CORS_ORIGINS=http://localhost:5173,https://your-frontend.railway.app

# Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Step 4: Add MySQL Database

**Option A: Railway MySQL (Easiest - Free)**

1. In your Railway project, click **"Add Service"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will create a MySQL database automatically
4. Copy the connection details:
   - `MYSQLHOST`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`

5. **Update Backend Environment Variables:**

```env
DB_HOST=${{MYSQLHOST}}
DB_USER=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}
DB_NAME=${{MYSQLDATABASE}}
```

**Option B: Use Zippy-Unity MySQL**

If you already have Zippy-Unity database:
```env
DB_HOST=<zippy-unity-host>
DB_USER=<zippy-unity-user>
DB_PASSWORD=<zippy-unity-password>
DB_NAME=construction_db
```

### Step 5: Deploy Frontend

**Option A: Deploy on Railway**

1. Click **"Add Service"** → **"GitHub Repo"**
2. Select your repository
3. **Configure:**
   - **Service Name:** `frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s dist -l $PORT`

4. **Add Environment Variables:**

```env
VITE_API_URL=https://your-backend.railway.app/api
NODE_ENV=production
PORT=3000
```

**Option B: Deploy on Vercel (Better for Frontend)**

1. Go to **https://vercel.com**
2. Login with GitHub
3. Click **"New Project"**
4. Import your repository
5. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   
6. **Add Environment Variable:**

```env
VITE_API_URL=https://your-backend.railway.app/api
```

7. Click **"Deploy"**

### Step 6: Update CORS

After frontend is deployed, update backend CORS:

```env
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.railway.app
```

---

## 🎯 Option 2: Backend on Railway + Frontend on Vercel

This is the **BEST combination for free deployment**:

### Railway (Backend + Database)
✅ 500 free hours/month  
✅ Free MySQL database  
✅ Auto-deploy from GitHub  
✅ Custom domains  

### Vercel (Frontend)
✅ Unlimited deployments  
✅ Free SSL  
✅ Custom domains  
✅ Faster CDN  

---

## 📝 Complete Deployment Steps

### 1️⃣ Deploy Backend to Railway

```bash
# Push your code to GitHub first
cd "c:\Users\MEHEDI HASAN\Desktop\Smart Construction Management System"
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

**Railway Setup:**
1. Go to https://railway.app
2. Login with GitHub
3. New Project → Deploy from GitHub
4. Select your repo
5. Set Root Directory: `backend`
6. Add environment variables (see above)
7. Railway will auto-deploy!

### 2️⃣ Add MySQL Database in Railway

1. In Railway project dashboard
2. Click **"Add Service"** → **"MySQL"**
3. Wait for database to be ready
4. Copy connection credentials
5. Add to backend environment variables

### 3️⃣ Initialize Database Schema

After MySQL is ready, you need to create tables:

**Method 1: Using Railway MySQL CLI**
```bash
# In Railway dashboard, click on MySQL service
# Click "Connect" → "MySQL CLI"
# Paste the SQL from database/schema.sql
```

**Method 2: Using MySQL Workbench**
1. Connect to Railway MySQL using credentials
2. Open `database/schema.sql`
3. Execute the script

**Method 3: Using Backend Script**
```bash
# SSH into your Railway backend (or use Railway shell)
cd backend
node -e "require('./src/config/database').query(require('fs').readFileSync('../database/schema.sql', 'utf8'))"
```

### 4️⃣ Create Admin User

```bash
# In Railway backend shell
cd backend
node create_test_accounts.js
```

Or run SQL manually:
```sql
INSERT INTO users (name, email, password, role, is_active, is_approved) VALUES 
('Admin User', 'admin@khazabilkis.com', '$2a$10$X7Vwqz8qK5zQp6rJ9mYHFO6KjN3qL9vM2bP8wR5tY1cD4eF6gH7iJ', 'admin', TRUE, TRUE);
```

### 5️⃣ Deploy Frontend to Vercel

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

**Or use Vercel Dashboard:**
1. Go to https://vercel.com
2. New Project → Import GitHub repo
3. Root Directory: `frontend`
4. Add env: `VITE_API_URL=https://your-backend.railway.app/api`
5. Deploy!

### 6️⃣ Update Backend CORS

After frontend is deployed:
1. Go to Railway dashboard
2. Backend service → Variables
3. Update `CORS_ORIGINS`:

```env
CORS_ORIGINS=https://your-app.vercel.app
```

4. Railway will auto-redeploy

---

## 🔍 Verify Deployment

### Backend Health Check
```
https://your-backend.railway.app/api/health
```

Should return:
```json
{
  "success": true,
  "status": "OK",
  "message": "Smart Construction Management System API is running",
  "timestamp": "...",
  "environment": "production",
  "version": "2.0.0"
}
```

### Frontend
```
https://your-frontend.vercel.app
```

Should show login page.

---

## 🛠️ Railway Commands (CLI)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Deploy
railway up

# Open dashboard
railway open
```

---

## 💰 Railway Free Tier Limits

- **500 hours/month** execution time
- **$5 credit/month** (enough for small apps)
- **Free MySQL** database
- **Auto-sleep** after inactivity (wakes on request)
- **Custom domains** supported

**Tips to stay free:**
✅ Use efficient code  
✅ Enable auto-sleep  
✅ Monitor usage in dashboard  
✅ Use Vercel for frontend (saves Railway hours)  

---

## 🔄 Auto-Deploy from GitHub

Railway auto-deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Railway will automatically:
# 1. Pull latest code
# 2. Run npm install
# 3. Restart server
```

---

## 🐛 Troubleshooting

### Backend not starting
```bash
# Check logs in Railway dashboard
# Common issues:
# - Missing environment variables
# - Database connection failed
# - Port already in use
```

### Database connection error
1. Verify MySQL credentials
2. Check MySQL service is running
3. Ensure database name is correct
4. Check Railway MySQL is initialized

### CORS error
1. Add frontend URL to `CORS_ORIGINS`
2. Format: `https://frontend-url.vercel.app`
3. No trailing slash

### Frontend can't connect to API
1. Verify `VITE_API_URL` is correct
2. Must end with `/api`
3. Example: `https://backend.railway.app/api`

---

## 📊 Monitoring

### Railway Dashboard
- **Metrics:** CPU, Memory, Network
- **Logs:** Real-time application logs
- **Usage:** Track free hours remaining

### Health Check Endpoint
```
GET https://your-backend.railway.app/api/health
```

Set up uptime monitoring:
- UptimeRobot (free)
- Pingdom (free tier)
- Better Uptime (free)

---

## 🎉 Post-Deployment Checklist

- [ ] GitHub repository pushed
- [ ] Railway project created
- [ ] Backend deployed successfully
- [ ] MySQL database created
- [ ] Database schema initialized
- [ ] Admin user created
- [ ] Backend health check passes
- [ ] Frontend deployed (Vercel/Railway)
- [ ] CORS configured correctly
- [ ] Can login to application
- [ ] All features working
- [ ] Environment variables secured
- [ ] Custom domain added (optional)

---

## 🔐 Security Notes

✅ **Never commit `.env` file to GitHub**  
✅ **Use Railway environment variables**  
✅ **Change default JWT_SECRET**  
✅ **Enable HTTPS (automatic on Railway/Vercel)**  
✅ **Regular database backups**  
✅ **Monitor logs for errors**  

---

## 📞 Need Help?

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Support:** admin@khazabilkis.com

---

**Deployment Date:** April 18, 2026  
**System Version:** 2.0.0  
**Platform:** Railway + Vercel (Free)  
**Status:** Ready to Deploy 🚀
