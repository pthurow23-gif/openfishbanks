# Deployment Instructions - Step by Step

Follow these steps to deploy OpenFishBanks to Render.com (FREE and easiest option).

---

## ✅ Step 1: Push Your Code to GitHub

1. Go to https://github.com and sign in (or create account)
2. Click the **"+"** icon in top right → **"New repository"**
3. Name: `openfishbanks`
4. Choose **Public** or **Private** (your choice)
5. **DON'T** check "Initialize with README" (your code already has files)
6. Click **"Create repository"**

7. Open Terminal and run these commands:

```bash
cd /Users/piercethurow/openfishbanks

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Set main branch
git branch -M main

# Add your GitHub repo (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/openfishbanks.git

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

---

## ✅ Step 2: Sign Up for Render

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Choose **"Sign up with GitHub"** (easiest option)
4. Authorize Render to access your GitHub

---

## ✅ Step 3: Generate a Secret Key

In Terminal, run:

```bash
openssl rand -hex 32
```

**Copy the output** - you'll need it in the next step. It looks like: `a1b2c3d4e5f6...`

---

## ✅ Step 4: Deploy to Render

1. In Render dashboard, click **"New +"** → **"Web Service"**

2. Under "Public Git repository", paste your GitHub repo URL:
   ```
   https://github.com/YOUR_USERNAME/openfishbanks
   ```
   (Replace YOUR_USERNAME with your GitHub username)
   Click **"Connect"**

3. Fill in these settings:
   - **Name**: `openfishbanks` (or any name you like)
   - **Environment**: `Node`
   - **Region**: Choose closest to you (e.g., "Oregon (US West)")
   - **Branch**: `main`
   - **Root Directory**: `backend` ⚠️ **IMPORTANT - type exactly: `backend`**
   - **Build Command**: 
     ```
     cd ../frontend && npm install && npm run build && cd ../backend && npm install
     ```
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**

4. Click **"Advanced"** button

5. Click **"Add Environment Variable"** and add these one by one:

   | Key | Value |
   |-----|-------|
   | `PORT` | `10000` |
   | `NODE_ENV` | `production` |
   | `SESSION_SECRET` | (paste the secret you generated in Step 3) |
   
   **Leave `FRONTEND_URL` blank** - we don't need it when serving frontend from backend.

6. Click **"Create Web Service"**

7. **Wait 5-10 minutes** for deployment (you'll see logs scrolling)

8. When it says "Your service is live", **copy the URL** (looks like: `https://openfishbanks.onrender.com`)

---

## ✅ Step 5: Test Your Site!

1. Open the URL in your browser
2. You should see the login page
3. Try creating an account
4. Log in and test the game

**That's it! Your site is live! 🎉**

---

## 🔄 Making Updates

After you make changes to your code:

1. In Terminal:
   ```bash
   cd /Users/piercethurow/openfishbanks
   git add .
   git commit -m "Description of your changes"
   git push
   ```

2. Render will **automatically redeploy** (usually takes 3-5 minutes)

---

## ⚠️ Important Notes

- **Free Tier Limitation**: Free Render apps "sleep" after 15 minutes of no activity. First visit after sleep takes 30-60 seconds (cold start). Upgrade to paid ($7/month) for always-on.
- **Database**: Your SQLite database will persist, but consider backing it up if important.
- **Admin Account**: Make sure you remember your admin username/password!

---

## 🆘 Troubleshooting

### Deployment fails
- Check the "Logs" tab in Render dashboard
- Make sure "Root Directory" is set to `backend`
- Verify all environment variables are set correctly

### Site shows "Cannot GET /"
- Check that the build command completed successfully
- Make sure `frontend/dist` folder was created during build

### Can't log in / Session issues
- Make sure `SESSION_SECRET` is set
- Clear your browser cookies and try again

---

## 📝 Next Steps

- Share your URL with family/friends!
- Consider upgrading to paid plan for always-on ($7/month)
- Optional: Add a custom domain (see DEPLOYMENT.md)

---

## 🎯 Summary

1. Push code to GitHub ✅
2. Sign up for Render ✅
3. Deploy as Web Service ✅
4. Set environment variables ✅
5. Wait for deployment ✅
6. Share your URL! 🎉

**Your site URL will be**: `https://your-service-name.onrender.com`
