# ✅ Vercel Deployment Checklist

## Pre-Deployment

- [ ] Code is pushed to GitHub
- [ ] All tests pass locally
- [ ] Build works locally: `npm run build`
- [ ] No console errors in browser
- [ ] All brand colors updated (Green #5B7E3C, Red #C44545)
- [ ] `.env` files are in `.gitignore`
- [ ] Backend is deployed (Render/Railway/etc.)
- [ ] Backend URL is accessible

## Vercel Account Setup

- [ ] Vercel account created: https://vercel.com
- [ ] Vercel CLI installed: `npm install -g vercel`
- [ ] Logged in to Vercel: `vercel login`
- [ ] GitHub account connected to Vercel

## Frontend Deployment

- [ ] `frontend/vercel.json` created ✅
- [ ] `frontend/.env.example` created ✅
- [ ] Navigate to frontend folder
- [ ] Run: `vercel`
- [ ] Follow deployment prompts
- [ ] Deployment successful
- [ ] Note the deployment URL

## Environment Variables

- [ ] Go to Vercel Dashboard → Project → Settings → Environment Variables
- [ ] Add `VITE_API_URL` with your backend URL
- [ ] Save environment variables
- [ ] Redeploy project

## Backend Configuration

- [ ] CORS configured to allow frontend URL
- [ ] Database connection working
- [ ] All environment variables set in backend
- [ ] Backend health check endpoint works
- [ ] File uploads working (if applicable)

## Testing

- [ ] Visit deployed frontend URL
- [ ] Login functionality works
- [ ] Can access dashboard
- [ ] All navigation links work
- [ ] API calls successful (check browser console)
- [ ] Data loads correctly
- [ ] Forms submit properly
- [ ] File uploads work (if applicable)
- [ ] Brand colors display correctly (Green/Red theme)

## Post-Deployment

- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic)
- [ ] Analytics enabled (optional)
- [ ] Deployment notifications set up
- [ ] Documentation updated
- [ ] Team members informed (if applicable)

## Troubleshooting

If something doesn't work:

1. **Check Vercel Logs**
   - Go to Dashboard → Project → Deployments
   - Click on latest deployment
   - Check build logs

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Check for errors in Console tab
   - Check Network tab for failed requests

3. **Common Issues**
   - ❌ API calls fail → Check `VITE_API_URL` environment variable
   - ❌ 404 on refresh → Check `vercel.json` rewrites
   - ❌ Build fails → Check build logs, ensure all dependencies installed
   - ❌ CORS errors → Update backend CORS allowed origins

## Maintenance

- [ ] Monitor deployment logs regularly
- [ ] Check for dependency updates
- [ ] Review performance metrics
- [ ] Update environment variables as needed
- [ ] Backup database regularly

---

## Quick Reference

**Vercel Dashboard**: https://vercel.com/dashboard
**Project Settings**: Dashboard → Project → Settings
**Environment Variables**: Dashboard → Project → Settings → Environment Variables
**Deployments**: Dashboard → Project → Deployments tab

---

**Status**: Ready for Deployment ✅
**Date**: 2026-04-18
**Version**: 1.0.0
