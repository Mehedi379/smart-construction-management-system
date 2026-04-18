# 🔐 Login Setup Guide for Deployed App

## Current Problem
✅ Frontend: Deployed on Vercel (https://smart-construction-management-syste.vercel.app)
❌ Backend: NOT deployed (frontend trying to connect to localhost:9000)

## Solution: Deploy Backend to Railway

### Step 1: Deploy Backend to Railway

1. Go to https://railway.app/
2. Login with your GitHub account
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. In Railway dashboard:
   - Click on your backend service
   - Go to "Variables" tab
   - Add these environment variables:
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
     ```
6. Railway will give you a public URL like: `https://your-backend.railway.app`

### Step 2: Update Frontend on Vercel

1. Go to https://vercel.com/
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add or update:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```
   (Replace with your actual Railway URL)
5. Redeploy your frontend

### Step 3: Test Login

1. Visit: https://smart-construction-management-syste.vercel.app/login
2. Use these credentials:
   - Email: `admin@khazabilkis.com`
   - Password: `admin123`

## Alternative: Quick Local Testing

If you just want to test right now without deploying backend:

1. Start backend locally:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. The backend will run on `http://localhost:9000`

3. Your deployed Vercel frontend still won't work because it can't reach localhost
   
4. **For local testing**, visit: `http://localhost:5173/login` (run frontend locally too)

## Important Notes

⚠️ **CORS Issue**: The backend must allow requests from your Vercel domain
- Add `CORS_ORIGINS` environment variable in backend
- Include both Vercel URL and localhost for development

⚠️ **Database**: Your Railway database is already configured and working

⚠️ **Security**: Change the default admin password after first login!

## Test Accounts

- **Admin**: admin@khazabilkis.com / admin123
- Check `TEST_ACCOUNTS.txt` for more accounts
