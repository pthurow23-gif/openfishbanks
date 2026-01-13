# Quick Deployment Guide - Render.com

## The Easiest Way: Serve Frontend from Backend (Recommended)

This is simpler because WebSockets work automatically and you only deploy one service.

---

## Step 1: Push Code to GitHub

1. Go to https://github.com
2. Create a new repository named `openfishbanks`
3. In your terminal:

```bash
cd /Users/piercethurow/openfishbanks
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/openfishbanks.git
git push -u origin main
```

---

## Step 2: Update Backend to Serve Frontend

The backend code already has the setup to serve frontend files (I'll verify this), but we need to make sure it's configured correctly.

---

## Step 3: Deploy to Render

1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Connect GitHub → Select `openfishbanks` repository
4. Settings:
   - **Name**: `openfishbanks`
   - **Environment**: Node
   - **Root Directory**: `backend`
   - **Build Command**: `cd .. && cd frontend && npm install && npm run build && cd ../backend && npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. Environment Variables:
   - `PORT`: `10000`
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: (run `openssl rand -hex 32` to generate)
   - `FRONTEND_URL`: (leave blank, not needed when serving from backend)

6. Click "Create Web Service"
7. Wait 5-10 minutes
8. Your site will be at: `https://openfishbanks.onrender.com`

---

## That's It!

Your site is now live at the URL Render gives you. Share it with anyone!

**Note**: Free tier apps sleep after 15 minutes of inactivity (first visit takes 30-60 seconds to wake up).
