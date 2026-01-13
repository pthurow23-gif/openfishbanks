# Step-by-Step Deployment Guide

Follow these steps to deploy OpenFishBanks to Render.com (free and easiest option).

---

## Prerequisites

- [ ] Your code is on GitHub (if not, we'll do this first)
- [ ] A Render.com account (free signup)

---

## Step 1: Push Code to GitHub (if not already done)

1. Go to https://github.com and sign in (or create account)
2. Click the "+" icon in top right → "New repository"
3. Name it: `openfishbanks`
4. Choose Public or Private
5. Click "Create repository"
6. In your terminal, run:

```bash
cd /Users/piercethurow/openfishbanks
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/openfishbanks.git
git push -u origin main
```

(Replace YOUR_USERNAME with your GitHub username)

---

## Step 2: Sign Up for Render

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (easiest option)
4. Authorize Render to access your GitHub repos

---

## Step 3: Deploy the Backend

1. In Render dashboard, click "New +" → "Web Service"
2. Connect your GitHub account (if not already connected)
3. Select your `openfishbanks` repository
4. Click "Connect"
5. Fill in the settings:
   - **Name**: `openfishbanks-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to you (e.g., "Oregon (US West)")
   - **Branch**: `main`
   - **Root Directory**: `backend` ⚠️ IMPORTANT
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

6. Click "Advanced" to add Environment Variables:
   - Click "Add Environment Variable" for each:
     - Key: `PORT`, Value: `10000`
     - Key: `NODE_ENV`, Value: `production`
     - Key: `SESSION_SECRET`, Value: (generate one - see below)
     - Key: `FRONTEND_URL`, Value: (leave blank for now, we'll update later)

7. To generate SESSION_SECRET, run in your terminal:
   ```bash
   openssl rand -hex 32
   ```
   Copy the output and paste it as the value.

8. Click "Create Web Service"
9. Wait 5-10 minutes for deployment
10. **Copy your backend URL** (will look like: `https://openfishbanks-backend.onrender.com`)

---

## Step 4: Deploy the Frontend

1. In Render dashboard, click "New +" → "Static Site"
2. Select your `openfishbanks` repository
3. Fill in the settings:
   - **Name**: `openfishbanks-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend` ⚠️ IMPORTANT
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. Click "Advanced" to add Environment Variable:
   - Key: `VITE_API_URL`, Value: `https://openfishbanks-backend.onrender.com/api`
   (Use your actual backend URL from Step 3)

5. Click "Create Static Site"
6. Wait 5-10 minutes for deployment
7. **Copy your frontend URL** (will look like: `https://openfishbanks-frontend.onrender.com`)

---

## Step 5: Update Backend Configuration

1. Go back to your backend service in Render
2. Click "Environment" tab
3. Find `FRONTEND_URL` and update it to your frontend URL (from Step 4)
4. Click "Save Changes"
5. Render will automatically redeploy

---

## Step 6: Update Frontend for WebSocket (IMPORTANT)

We need to update the frontend to use the correct WebSocket URL. I'll help you with this code change.

---

## Step 7: Test Your Deployment

1. Visit your frontend URL (e.g., `https://openfishbanks-frontend.onrender.com`)
2. You should see the login page
3. Create a new account
4. Test logging in
5. Check if the game loads correctly
6. Test admin panel (if you're the admin user)

---

## Troubleshooting

### If the site doesn't load:
- Check the logs in Render dashboard (click on your service → "Logs" tab)
- Make sure all environment variables are set correctly

### If you get CORS errors:
- Verify `FRONTEND_URL` in backend matches your frontend URL exactly
- Make sure both services are deployed

### If WebSocket doesn't work:
- We need to update the frontend code (see Step 6)

---

## What You'll Get

After deployment:
- ✅ Public URL for your frontend (e.g., `https://openfishbanks-frontend.onrender.com`)
- ✅ Anyone can access it from anywhere
- ✅ Free SSL/HTTPS (secure connection)
- ✅ Automatic deployments when you push to GitHub

**Note**: Free tier apps on Render "sleep" after 15 minutes of inactivity. First visit after sleep takes 30-60 seconds to wake up. Upgrade to paid ($7/month) for always-on.

---

## Next Steps After Deployment

1. Share your frontend URL with your family/friends
2. They can create accounts and play
3. You can continue developing and pushing updates to GitHub
4. Render will automatically redeploy when you push changes

---

## Need Help?

- Check Render logs for errors
- Review the DEPLOYMENT.md file for more details
- Common issues are covered in the troubleshooting section
