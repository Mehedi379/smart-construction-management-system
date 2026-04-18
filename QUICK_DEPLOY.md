# 🚀 Quick Vercel Deployment

## ⚡ Fastest Way (3 Steps)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
cd frontend
vercel
```

**That's it!** Follow the prompts and your app will be live! 🎉

---

## 📝 Detailed Instructions

See complete guide: **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)**

---

## 🎯 Quick Commands

### Build & Deploy
```bash
# Run the automated deployment script
DEPLOY_TO_VERCEL.bat
```

### Manual Deployment
```bash
cd frontend
npm install
npm run build
vercel
```

---

## ⚠️ Important: Backend Setup

Your frontend needs to connect to your backend. After deploying:

1. **Deploy your backend** to Render/Railway/other platform
2. **Set environment variable** in Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `VITE_API_URL = https://your-backend-url.com/api`
3. **Redeploy** the frontend

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Render (for backend)**: https://render.com
- **Railway (for backend)**: https://railway.app

---

## ❓ Need Help?

Check the full deployment guide or contact support.
