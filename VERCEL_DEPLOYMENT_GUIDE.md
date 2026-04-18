# 🚀 Vercel Deployment Guide
# Smart Construction Management System

## 📋 Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **GitHub Account**: Your code should be on GitHub
3. **Backend Deployed**: Your backend should be deployed (Render, Railway, etc.)

---

## 🎯 Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
# Navigate to your project folder
cd "c:\Users\MEHEDI HASAN\Desktop\Smart Construction Management System"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Vercel deployment"

# Add your GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy Frontend to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to frontend folder
cd frontend

# Deploy
vercel
```

**During deployment:**
- Set up and deploy? **Yes**
- Which scope? **Choose your account**
- Link to existing project? **No** (first time)
- Project name? **smart-construction** (or your choice)
- Directory? **./frontend**
- Override settings? **No** (we have vercel.json)

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Add Environment Variables:
   - `VITE_API_URL` = Your backend API URL
6. Click **"Deploy"**

---

### Step 3: Configure Environment Variables

After deployment on Vercel:

1. Go to your project on Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   ```
   VITE_API_URL = https://your-backend-url.com/api
   ```
4. Click **Save**
5. Redeploy the project

---

### Step 4: Update Backend URL

Edit `frontend/.env` for production:

```env
# Production API URL
VITE_API_URL=https://your-backend-url.onrender.com/api
```

**Important**: Replace `your-backend-url.onrender.com` with your actual backend URL.

---

## 🔧 Backend Deployment Options

Your backend needs to be deployed separately. Here are free options:

### Option 1: Render (Recommended)
https://render.com

1. Create account
2. New Web Service
3. Connect your GitHub repo
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `node server.js`
7. Add environment variables from `backend/.env`
8. Deploy

### Option 2: Railway
https://railway.app

1. Create account
2. New Project → Deploy from GitHub
3. Select your repo
4. Configure environment variables
5. Deploy

### Option 3: Vercel Serverless (Requires refactoring)
You can also deploy the backend to Vercel as serverless functions, but this requires code changes.

---

## 📝 Configuration Files Created

### 1. `frontend/vercel.json`
- Build configuration
- Routing rules
- API rewrites (optional)
- Cache headers

### 2. `frontend/.env.example`
- Environment variable template
- Documentation for required vars

---

## ✅ Post-Deployment Checklist

- [ ] Frontend deployed successfully
- [ ] Backend deployed and accessible
- [ ] `VITE_API_URL` set in Vercel
- [ ] CORS configured in backend to allow frontend URL
- [ ] Database connection working
- [ ] Login functionality tested
- [ ] All features working

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** to GitHub
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** (Vercel does this automatically)
4. **Configure CORS** in backend:
   ```javascript
   // backend/server.js
   app.use(cors({
     origin: ['https://your-app.vercel.app', 'http://localhost:3000'],
     credentials: true
   }));
   ```

---

## 🐛 Troubleshooting

### Issue: Build fails
**Solution**: Check build logs in Vercel dashboard. Ensure all dependencies are in `package.json`.

### Issue: API calls fail
**Solution**: 
1. Verify `VITE_API_URL` is set correctly
2. Check CORS settings in backend
3. Ensure backend is running

### Issue: 404 on refresh
**Solution**: The `vercel.json` already includes rewrite rules to handle SPA routing.

### Issue: Assets not loading
**Solution**: Check that the build output directory is `dist` in `vercel.json`.

---

## 🌐 Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Configure DNS records as instructed
5. SSL certificate is automatic

---

## 📊 Monitoring

After deployment:
- **Analytics**: Vercel provides basic analytics
- **Logs**: Check deployment logs in dashboard
- **Performance**: Use Vercel Speed Insights
- **Errors**: Monitor function logs

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to:
- `main` branch → Production
- Other branches → Preview deployments

---

## 💡 Tips

1. **Test locally first**: `npm run build` then `npm run preview`
2. **Use preview deployments**: Test changes before production
3. **Monitor bundle size**: Keep it under 250KB for best performance
4. **Enable analytics**: Add Vercel Analytics for insights
5. **Set up alerts**: Configure deployment notifications

---

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Vite Docs: https://vitejs.dev
- Vercel Community: https://github.com/vercel/vercel/discussions

---

**Good luck with your deployment! 🚀**
