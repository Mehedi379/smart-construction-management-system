# 🚀 RAILWAY BACKEND DEPLOYMENT - STEP BY STEP

## ⚠️ PROBLEM
Your Vercel frontend is deployed but backend is NOT deployed.
Frontend URL: https://smart-construction-management-syste.vercel.app/login
Backend URL: NOT AVAILABLE (needs Railway deployment)

---

## ✅ SOLUTION: Deploy Backend to Railway

### STEP 1: Go to Railway

1. Open: https://railway.app/
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub

---

### STEP 2: Create New Project

1. Click **"New Project"**
2. Click **"Deploy from GitHub repo"**
3. Select your repository: `Smart Construction Management System`
4. Railway will detect it's a Node.js app

---

### STEP 3: Configure Environment Variables

In Railway dashboard, click on your service → **"Variables"** tab

Add these environment variables one by one:

```
DB_HOST=roundhouse.proxy.rlwy.net
DB_PORT=17140
DB_USER=root
DB_PASSWORD=AcbXX3KgvqD7B8Y4WjCu6yNx1Prfu5cNHz
DB_NAME=railway
JWT_SECRET=a3f8b9c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2
JWT_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGINS=https://smart-construction-management-syste.vercel.app,http://localhost:5173
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

**How to add variables:**
- Click "+ New Variable"
- Paste the key (e.g., `DB_HOST`)
- Paste the value (e.g., `roundhouse.proxy.rlwy.net`)
- Click "Add"

---

### STEP 4: Configure Build & Deploy

In Railway dashboard:

1. Click on **"Settings"** tab
2. Find **"Build"** section:
   - Build Command: `npm install`
   
3. Find **"Deploy"** section:
   - Start Command: `node server.js`

4. Railway will automatically start deploying

---

### STEP 5: Get Your Backend URL

After deployment completes:

1. Go to Railway dashboard
2. Click on your service
3. Click on **"Deployments"** tab
4. Find the URL like: `https://your-app-name.up.railway.app`
5. **Copy this URL** - you'll need it!

**Test it works:**
Open: `https://your-app-name.up.railway.app/api/health`

You should see:
```json
{
  "success": true,
  "status": "OK",
  "message": "Smart Construction Management System API is running"
}
```

---

### STEP 6: Create Admin User

You need to run the admin setup script. Two options:

**Option A: Run Locally (Easier)**

On your computer, open terminal:
```bash
cd backend
npm install
npm run setup:admin
```

This will create the admin user in your Railway database.

**Option B: Use Railway Shell**

1. In Railway dashboard, click **"Shell"** tab
2. Run:
```bash
npm install
node setup_admin.js
```

---

### STEP 7: Update Vercel Frontend

Now connect your frontend to the deployed backend:

1. Go to: https://vercel.com/
2. Login and select your project
3. Click **"Settings"** → **"Environment Variables"**
4. Find `VITE_API_URL`
5. Update it to:
   ```
   VITE_API_URL=https://your-app-name.up.railway.app/api
   ```
   (Replace with YOUR Railway URL)
6. Click **"Save"**

---

### STEP 8: Redeploy Frontend on Vercel

1. Go to your Vercel project
2. Click **"Deployments"** tab
3. Click on the latest deployment
4. Click **"Redeploy"** (3 dots menu)
5. Wait for deployment to complete

---

### STEP 9: Test Login!

1. Go to: https://smart-construction-management-syste.vercel.app/login
2. Login with:
   - **Email:** `admin@khazabilkis.com`
   - **Password:** `admin123`
3. **SUCCESS!** 🎉

---

## 🔍 TROUBLESHOOTING

### Problem: Railway deployment fails
**Fix:** 
- Check the build logs in Railway
- Make sure all environment variables are set
- Verify `package.json` exists in backend folder

### Problem: `/api/health` shows error
**Fix:**
- Check database connection variables (DB_HOST, DB_PORT, etc.)
- Check Railway MySQL is running
- Look at deployment logs

### Problem: Login fails with CORS error
**Fix:**
- Make sure `CORS_ORIGINS` includes your Vercel URL
- Variable should be: `https://smart-construction-management-syste.vercel.app,http://localhost:5173`

### Problem: Login says "Invalid credentials"
**Fix:**
- Run `npm run setup:admin` to create admin user
- Check admin user exists in database

### Problem: Frontend still can't connect
**Fix:**
- Verify `VITE_API_URL` in Vercel is correct
- Redeploy frontend on Vercel
- Clear browser cache (Ctrl+Shift+Delete)

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Railway account created
- [ ] Backend deployed to Railway
- [ ] All environment variables added
- [ ] Backend health check works: `/api/health`
- [ ] Admin user created in database
- [ ] VITE_API_URL updated on Vercel
- [ ] Frontend redeployed on Vercel
- [ ] Can login at: https://smart-construction-management-syste.vercel.app/login

---

## 📞 NEED HELP?

If you get stuck, check:
- Railway deployment logs
- Vercel deployment logs
- Browser console (F12) for errors
- `BANGLA_LOGIN_GUIDE.md` for Bengali instructions

---

**🎯 Estimated Time: 15-20 minutes**

**Once deployed, your app will work 24/7 on the internet!**
