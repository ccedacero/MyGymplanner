# 🚀 Deployment Guide for MyGymPlanner

Your app is now configured for cloud deployment! Follow these steps:

## Prerequisites
- GitHub account (for both deployments)
- Railway account (for backend) - https://railway.app
- Vercel account (for frontend) - https://vercel.com

Both are **FREE** for personal projects!

## Step 1: Push to GitHub

```bash
cd /Users/devtzi/dev/MyGymplanner
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## Step 2: Deploy Backend to Railway

1. Go to https://railway.app and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `MyGymplanner` repository
4. Railway will auto-detect and deploy the `/server` folder
5. Click on your deployment → "Settings" tab
6. Add environment variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3001` (Railway auto-assigns, but good to set)
   - `JWT_SECRET` = (create a random secret key)
   - `CLIENT_URL` = (leave blank for now, we'll add after frontend deployment)

7. Copy your Railway app URL (e.g., `https://your-app.up.railway.app`)

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project" → "Import Git Repository"
3. Select your `MyGymplanner` repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variable:
   - `VITE_API_URL` = (your Railway URL from step 2)

6. Click "Deploy"
7. Copy your Vercel app URL (e.g., `https://your-app.vercel.app`)

## Step 4: Update Backend with Frontend URL

1. Go back to Railway → Your Project → Settings
2. Update environment variable:
   - `CLIENT_URL` = (your Vercel URL from step 3)
3. Click "Redeploy"

## Step 5: Add App Icons

Create two PNG icons (or I can help you generate them):
- `client/public/icon-192.png` (192x192 pixels)
- `client/public/icon-512.png` (512x512 pixels)

Use any icon maker or upload a gym/workout themed icon.

## Step 6: Test on Your Phone

1. Open your Vercel URL on your phone browser
2. The app should load and work!

### Install as App (PWA):

**iPhone:**
1. Safari → Share button → "Add to Home Screen"
2. Icon appears on home screen
3. Opens full-screen like a native app!

**Android:**
1. Chrome → Menu (⋮) → "Install App" or "Add to Home Screen"
2. Icon appears on home screen
3. Works like a native app!

## Troubleshooting

### API Connection Issues:
1. Check Railway logs: Railway Dashboard → Deployments → View Logs
2. Verify `VITE_API_URL` in Vercel matches your Railway URL
3. Verify `CLIENT_URL` in Railway matches your Vercel URL

### Data Persistence:
- Railway provides persistent storage for your JSON files
- Your data will persist between deployments
- For backups, download `/server/data/` files regularly

## Updating Your App

After making changes:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Both Vercel and Railway will auto-deploy your changes!

## Cost

- **Railway Free Tier**: $5 credit/month, enough for personal use
- **Vercel Free Tier**: Unlimited deployments for personal projects
- **Total**: FREE for personal use! 🎉
