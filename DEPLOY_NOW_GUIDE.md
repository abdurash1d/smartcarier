# 🚀 DEPLOY NOW - COMPLETE GUIDE

**SmartCareer AI - Production Deployment**  
**Estimated Time:** 90 minutes  
**Goal:** LIVE PRODUCTION!

---

## 🎯 OVERVIEW

### What We're Deploying:
- ✅ Backend → Railway (with PostgreSQL)
- ✅ Frontend → Vercel
- ✅ Database → Railway PostgreSQL

### What You Need:
- GitHub account (for code)
- Railway account (backend + database) - FREE
- Vercel account (frontend) - FREE
- Email (Gmail) for accounts

---

## 📋 STEP-BY-STEP DEPLOYMENT

---

## 🔧 PHASE 1: PREPARE (15 min)

### Step 1.1: Push Code to GitHub

```bash
# If not already in Git
cd C:\Users\user\Desktop\stratUP

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Week 1 complete - Production ready"

# Push to GitHub
git push origin second
```

**✅ Checkpoint:** Code is on GitHub

---

### Step 1.2: Generate SECRET_KEY

```bash
# In PowerShell
cd backend
python -c "import secrets; print(secrets.token_hex(32))"
```

**Copy this key!** You'll need it for Railway.

**Example output:**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

## 🚂 PHASE 2: DEPLOY BACKEND TO RAILWAY (30 min)

### Step 2.1: Create Railway Account (5 min)

1. Go to: https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (easiest)
4. Verify email

**✅ Checkpoint:** Railway account created

---

### Step 2.2: Create New Project (5 min)

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select `stratUP` repository
5. Select `second` branch
6. Railway will detect it's a Python app

**✅ Checkpoint:** Project created

---

### Step 2.3: Add PostgreSQL (2 min)

1. In your Railway project
2. Click "+ New"
3. Select "Database"
4. Choose "PostgreSQL"
5. Railway creates database automatically

**✅ Checkpoint:** PostgreSQL added

---

### Step 2.4: Configure Backend Service (15 min)

1. Click on your backend service (not database)
2. Go to "Settings" tab
3. Set **Root Directory:** `backend`
4. Set **Start Command:** `gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

**✅ Checkpoint:** Service configured

---

### Step 2.5: Add Environment Variables (10 min)

Click "Variables" tab, add these:

```bash
# Core Settings
DEBUG=False
SECRET_KEY=<your-generated-secret-key-from-step-1.2>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database (Railway auto-provides this)
# DATABASE_URL is automatically set by Railway PostgreSQL

# AI Service
GEMINI_API_KEY=AIzaSyB0fOl77frnhsPzgpbsQ3Lly8oK22piSe8

# Frontend URL (we'll update this after Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app

# Stripe (use test keys for now)
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret

# Optional (add later)
# SENTRY_DSN=https://...
# SENDGRID_API_KEY=SG....
# REDIS_URL=redis://...
```

**Important:**
- Replace `SECRET_KEY` with your generated key
- We'll update `FRONTEND_URL` and `CORS_ORIGINS` after deploying frontend
- Stripe keys can be test keys initially

**✅ Checkpoint:** Environment variables added

---

### Step 2.6: Deploy & Run Migrations (5 min)

1. Railway will automatically deploy
2. Wait for build to complete (2-3 min)
3. Once deployed, go to "Deployments" tab
4. Click on latest deployment
5. Check logs for any errors

**Run Migrations:**
1. In Railway project, click on backend service
2. Go to "Settings" → "Service Variables"
3. Note your deployment URL (e.g., `https://your-app.up.railway.app`)

4. Open PowerShell locally:
```bash
cd C:\Users\user\Desktop\stratUP\backend

# Set DATABASE_URL temporarily (get from Railway Variables tab)
$env:DATABASE_URL="postgresql://user:pass@host.railway.internal:5432/railway"

# Run migrations
alembic upgrade head
```

**Alternative (easier):**
Railway will run migrations automatically if you add this to your `Procfile`:
```
release: alembic upgrade head
```

**✅ Checkpoint:** Backend deployed and running!

---

### Step 2.7: Test Backend (2 min)

Get your Railway URL (e.g., `https://smartcareer-production.up.railway.app`)

Test in browser:
```
https://your-backend-url.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-19..."
}
```

**✅ Checkpoint:** Backend is LIVE! 🎉

---

## ⚡ PHASE 3: DEPLOY FRONTEND TO VERCEL (20 min)

### Step 3.1: Create Vercel Account (3 min)

1. Go to: https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub
4. Verify email

**✅ Checkpoint:** Vercel account created

---

### Step 3.2: Import Project (5 min)

1. Click "Add New..." → "Project"
2. Select "Import Git Repository"
3. Find `stratUP` repository
4. Click "Import"

**Configure:**
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `frontend`
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)

**✅ Checkpoint:** Project imported

---

### Step 3.3: Add Environment Variables (5 min)

In Vercel project settings, add:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
```

**Replace:**
- `your-backend-url.railway.app` with your actual Railway URL

**✅ Checkpoint:** Environment variables added

---

### Step 3.4: Deploy (5 min)

1. Click "Deploy"
2. Wait for build (2-3 min)
3. Vercel will provide a URL (e.g., `https://stratup.vercel.app`)

**✅ Checkpoint:** Frontend is LIVE! 🎉

---

### Step 3.5: Update Backend CORS (2 min)

1. Go back to Railway
2. Update these variables:
   ```bash
   FRONTEND_URL=https://your-app.vercel.app
   CORS_ORIGINS=https://your-app.vercel.app
   ```
3. Railway will auto-redeploy

**✅ Checkpoint:** CORS configured

---

## 🧪 PHASE 4: TEST PRODUCTION (15 min)

### Test Checklist:

Visit your Vercel URL: `https://your-app.vercel.app`

**Basic Tests:**
- [ ] Homepage loads
- [ ] Can view pricing
- [ ] Can register account
- [ ] Can login
- [ ] Dashboard loads
- [ ] Can search jobs
- [ ] Can view job details
- [ ] Can create resume
- [ ] AI features work (if API key set)

**Test in Browser Console:**
```javascript
// Check API connection
fetch('https://your-backend.railway.app/health')
  .then(r => r.json())
  .then(d => console.log('Backend:', d))
```

**✅ Checkpoint:** Everything works!

---

## 🎉 PHASE 5: YOU'RE LIVE! (10 min)

### Post-Deployment Tasks:

#### 1. Set Custom Domain (Optional)
**Vercel:**
- Go to Settings → Domains
- Add your domain (e.g., `smartcareer.uz`)

**Railway:**
- Go to Settings → Public Networking
- Add custom domain

#### 2. Setup Monitoring

**UptimeRobot:**
1. Go to: https://uptimerobot.com
2. Add monitor: `https://your-backend.railway.app/health`
3. Email alerts enabled

**Sentry (Optional):**
1. Go to: https://sentry.io
2. Create project
3. Get DSN
4. Add to Railway variables: `SENTRY_DSN=...`

#### 3. Configure Email (Optional but Recommended)

**SendGrid:**
1. Go to: https://sendgrid.com
2. Create account (free: 100 emails/day)
3. Get API key
4. Add to Railway: `SENDGRID_API_KEY=SG...`

---

## 📊 DEPLOYMENT COMPLETE!

### What You Have Now:

- ✅ **Backend:** Live on Railway with PostgreSQL
- ✅ **Frontend:** Live on Vercel
- ✅ **Database:** PostgreSQL on Railway
- ✅ **HTTPS:** Automatic SSL
- ✅ **CI/CD:** Auto-deploy on git push
- ✅ **Performance:** Optimized with indexes + caching
- ✅ **Security:** Production-grade

### URLs:
- **Frontend:** `https://your-app.vercel.app`
- **Backend:** `https://your-app.railway.app`
- **API Docs:** `https://your-app.railway.app/docs`

---

## 🔄 ITERATION PHASE

### Now That You're Live:

1. **Monitor:**
   - Check Railway logs
   - Watch Vercel analytics
   - Monitor UptimeRobot

2. **Get Feedback:**
   - Share with friends
   - Test with real users
   - Collect feature requests

3. **Iterate:**
   - Fix bugs
   - Add features
   - Improve based on feedback

4. **Update:**
   ```bash
   git add .
   git commit -m "New feature"
   git push
   # Auto-deploys!
   ```

---

## 🚨 TROUBLESHOOTING

### Backend Won't Start:
- Check Railway logs
- Verify environment variables
- Ensure PostgreSQL connected

### Frontend Can't Reach Backend:
- Check CORS_ORIGINS in Railway
- Verify API_URL in Vercel
- Test backend health endpoint

### Database Errors:
- Check DATABASE_URL
- Run migrations: `alembic upgrade head`
- Check Railway PostgreSQL logs

### Build Fails:
- Check build logs
- Verify dependencies in requirements.txt / package.json
- Ensure correct Python/Node version

---

## 💡 TIPS

### Free Tier Limits:

**Railway (Free):**
- $5 credit/month
- ~500 hours runtime
- PostgreSQL included

**Vercel (Free):**
- 100 GB bandwidth
- Unlimited sites
- Auto SSL

**Cost:** $0/month for MVP! 🎉

---

## 📞 SUPPORT

### If Stuck:

**Railway:**
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

**Vercel:**
- Docs: https://vercel.com/docs
- Support: support@vercel.com

**Your Tools:**
- Check: `TROUBLESHOOTING.md`
- Run: `python scripts/validate_deployment.py`
- Test: `python scripts/test_api_endpoints.py <url>`

---

## ✅ SUCCESS CRITERIA

You'll know it worked when:
- ✅ Frontend loads without errors
- ✅ Can register and login
- ✅ Dashboard shows data
- ✅ AI features work
- ✅ No errors in Railway logs
- ✅ Vercel shows successful deployment

---

**GO TIME!** 🚀

**Start with Phase 1, then work through each phase.**

**You got this!** 💪

---

**Questions at any step? Just ask!** 💬
