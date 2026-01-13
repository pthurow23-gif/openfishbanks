# Deployment Guide - OpenFishBanks

This guide covers deploying OpenFishBanks to make it accessible as a public website.

## Important Considerations

1. **WebSockets**: Your app uses WebSockets for real-time updates. Not all hosting platforms support WebSockets well.
2. **Database**: Currently using SQLite. For production with multiple users, consider PostgreSQL.
3. **Frontend + Backend**: You need to deploy both the React frontend and Express backend.

---

## Recommended Deployment Options

### Option 1: Render.com (Easiest for Full-Stack)

**Pros**: Free tier, supports WebSockets, easy setup, automatic HTTPS
**Cons**: Free tier apps "sleep" after 15 minutes of inactivity (they wake up on first request)

#### Step 1: Prepare Your Code

1. Make sure your code is in a GitHub repository
2. Create a `.env` file template (don't commit actual secrets):
   ```
   PORT=3001
   SESSION_SECRET=generate-a-random-string-here
   FRONTEND_URL=https://your-frontend-name.onrender.com
   NODE_ENV=production
   ```

#### Step 2: Deploy Backend

1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `openfishbanks-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your main branch)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for always-on)
5. Add Environment Variables:
   - `PORT`: `10000` (Render sets this automatically, but good to specify)
   - `SESSION_SECRET`: Generate a random string (you can use: `openssl rand -hex 32`)
   - `FRONTEND_URL`: Leave blank for now, we'll update after frontend deploys
   - `NODE_ENV`: `production`
6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. **Copy your backend URL** (e.g., `https://openfishbanks-backend.onrender.com`)

#### Step 3: Deploy Frontend

1. In Render, click "New +" → "Static Site"
2. Connect the same GitHub repository
3. Configure:
   - **Name**: `openfishbanks-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variables (if you need to set API URL):
   - `VITE_API_URL`: Your backend URL (optional, if using proxy)
5. Click "Create Static Site"
6. Wait for deployment
7. **Copy your frontend URL** (e.g., `https://openfishbanks-frontend.onrender.com`)

#### Step 4: Update Configuration

1. Go back to your **Backend** service settings
2. Update Environment Variables:
   - `FRONTEND_URL`: Set to your frontend URL (e.g., `https://openfishbanks-frontend.onrender.com`)
3. Save changes (this will trigger a redeploy)

#### Step 5: Update Frontend API Configuration

The frontend needs to know where the backend is. You have two options:

**Option A: Update vite.config.js to proxy in production** (More complex)

**Option B: Update frontend/src/api.js** (Recommended for Render)

If your frontend and backend are on different domains, update `frontend/src/api.js`:

```javascript
const api = axios.create({
  baseURL: process.env.VITE_API_URL || '/api',  // Use env variable or relative
  withCredentials: true,
  // ...
});
```

Then in Render frontend environment variables, add:
- `VITE_API_URL`: `https://openfishbanks-backend.onrender.com/api`

And for WebSocket connections, update `Dashboard.jsx` to use the backend URL from env.

---

### Option 2: Railway.app (Recommended for Always-On)

**Pros**: $5/month for always-on, supports WebSockets, easy deployment
**Cons**: Costs money (but free $5 credit monthly for trial)

1. Go to https://railway.app
2. Sign up (get $5 free credit)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add two services:

**Backend Service:**
- Root Directory: `backend`
- Build Command: (auto-detected)
- Start Command: `npm start`
- Environment Variables:
  - `PORT`: (auto-set)
  - `SESSION_SECRET`: (generate random string)
  - `FRONTEND_URL`: (set after frontend deploys)
  - `NODE_ENV`: `production`

**Frontend Service:**
- Root Directory: `frontend`
- Build Command: `npm run build`
- Start Command: `npx serve -s dist -l 3000`
- Add `serve` to package.json devDependencies if needed
- Or use Railway's static site option

6. Railway automatically provides URLs and handles HTTPS

---

### Option 3: Fly.io (Good WebSocket Support)

**Pros**: Free tier, good WebSocket support, global deployment
**Cons**: Slightly more complex setup

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up: `fly auth signup`
3. Create `fly.toml` in backend directory
4. Deploy: `fly deploy`
5. See Fly.io docs for full setup

---

### Option 4: Combined Deployment (Backend Serves Frontend)

This is simpler but requires code changes. The backend serves the built frontend files.

#### Backend Changes Needed:

1. Add this to `backend/server.js` (before API routes):

```javascript
// Serve static files from frontend dist directory
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    }
  });
}
```

2. Build frontend: `cd frontend && npm run build`
3. Deploy only the backend service
4. The backend serves both API and frontend

This approach works well with Render, Railway, or Fly.io.

---

## Database Considerations

### Current: SQLite (File-based)

- **Pros**: Simple, no setup needed
- **Cons**: 
  - Not ideal for production with many users
  - File persistence issues on some platforms
  - Single-writer limitations

### Production: PostgreSQL (Recommended)

If you want to use PostgreSQL:

1. **Render**: Add a PostgreSQL database in the dashboard (free tier available)
2. **Railway**: Add PostgreSQL service
3. Update your code to use `pg` instead of `better-sqlite3`
4. Update database connection in `database.js`

For now, SQLite works fine for small-scale deployments.

---

## Environment Variables Checklist

### Backend (.env or platform settings):

```env
PORT=3001                    # Or platform-assigned port
SESSION_SECRET=your-random-secret-here  # Generate with: openssl rand -hex 32
FRONTEND_URL=https://your-frontend-url.com
NODE_ENV=production
TICK_INTERVAL_MINUTES=15     # Optional, defaults to 15
```

### Frontend (if using separate deployment):

```env
VITE_API_URL=https://your-backend-url.com/api
```

---

## Security Checklist

- [ ] Change `SESSION_SECRET` to a random string (don't use the default)
- [ ] Use HTTPS (most platforms provide this automatically)
- [ ] Set `NODE_ENV=production`
- [ ] Update CORS settings to only allow your frontend domain
- [ ] Change default admin password if you have one
- [ ] Consider rate limiting for production
- [ ] Keep dependencies updated

---

## Domain Setup (Optional)

If you want a custom domain (e.g., `openfishbanks.com`):

1. Purchase a domain (Namecheap, Google Domains, etc.)
2. In your hosting platform (Render/Railway), add custom domain
3. Update DNS settings at your domain registrar:
   - Add CNAME record pointing to your platform URL
4. Update `FRONTEND_URL` environment variable to your custom domain
5. Wait for SSL certificate (automatic on most platforms)

---

## Testing Your Deployment

1. **Backend Health**: Visit `https://your-backend-url.com/api/game/stats` (should return JSON)
2. **Frontend**: Visit your frontend URL, should load the login page
3. **WebSocket**: Login and check if real-time updates work (tick countdown, etc.)
4. **Create Account**: Test registration and login
5. **Admin Panel**: Test admin functions

---

## Troubleshooting

### WebSocket Connection Failed
- Check if your platform supports WebSockets (Render and Railway do)
- Verify WebSocket URL in frontend code uses the correct backend URL
- Check browser console for errors

### CORS Errors
- Ensure `FRONTEND_URL` in backend matches your actual frontend URL exactly
- Check that credentials are enabled in CORS settings

### Database Errors
- SQLite files need to persist. Check platform's file system persistence
- Consider switching to PostgreSQL for production

### App Goes to Sleep (Render Free Tier)
- Free tier apps sleep after 15 min of inactivity
- First request after sleep takes 30-60 seconds (cold start)
- Upgrade to paid plan for always-on

---

## Quick Start: Render (Recommended for Beginners)

1. **Push code to GitHub**
2. **Deploy Backend**:
   - Render → New Web Service
   - Connect GitHub repo
   - Root: `backend`
   - Build: `npm install`
   - Start: `npm start`
   - Add env vars (PORT, SESSION_SECRET, NODE_ENV)
3. **Deploy Frontend**:
   - Render → New Static Site
   - Connect GitHub repo
   - Root: `frontend`
   - Build: `npm install && npm run build`
   - Publish: `dist`
4. **Update Backend env**: Set `FRONTEND_URL` to frontend URL
5. **Update Frontend env**: Set `VITE_API_URL` to backend URL + `/api`
6. **Test and share!**

---

## Cost Estimates

- **Render Free Tier**: Free (apps sleep after inactivity)
- **Render Paid**: $7/month per service (always-on)
- **Railway**: $5/month (includes $5 credit, good for small apps)
- **Fly.io Free Tier**: Free (limited resources)
- **Domain**: ~$10-15/year (optional)

For a family project, the free tier on Render is perfect to start!

---

## Need Help?

- Check platform documentation (Render, Railway, etc.)
- Review error logs in platform dashboard
- Check browser console for frontend errors
- Verify all environment variables are set correctly
