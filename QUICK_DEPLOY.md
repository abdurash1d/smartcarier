# ⚡ Quick Deploy Guide (30 Minutes)

The fastest way to get SmartCareer AI live in production!

## ⏱️ Time Estimate: 30 minutes

- 📝 Step 1: Generate Keys (5 min)
- 🚂 Step 2: Railway Backend (10 min)
- ⚡ Step 3: Vercel Frontend (5 min)
- ✅ Step 4: Test Everything (10 min)

---

## 📝 Step 1: Generate Keys (5 min)

### 1.1 SECRET_KEY
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```
**Save this!** You'll need it in Railway.

### 1.2 Gemini API Key (FREE!)
1. Go to https://ai.google.dev
2. Click "Get API key" → Create
3. Copy key (starts with `AIza...`)

### 1.3 Gmail App Password
1. https://myaccount.google.com/security
2. Enable 2-Step Verification
3. App passwords → Mail → Generate
4. Copy 16-character password

---

## 🚂 Step 2: Deploy Backend on Railway (10 min)

### 2.1 Create Project
1. Go to https://railway.app
2. **"New Project"** → **"Deploy from GitHub"**
3. Select your repository
4. Railway will auto-detect the project

### 2.2 Configure Service
1. Click on your service
2. **Settings** → **Root Directory**: `backend`

### 2.3 Add PostgreSQL
1. **"New"** → **"Database"** → **"PostgreSQL"**
2. Done! `DATABASE_URL` auto-set ✅

### 2.4 Add Redis (Optional)
1. **"New"** → **"Database"** → **"Redis"**
2. Done! `REDIS_URL` auto-set ✅

### 2.5 Add Environment Variables
Click **"Variables"** and paste:

```env
DEBUG=false
SECRET_KEY=<paste-your-generated-key-from-step-1.1>
GEMINI_API_KEY=<paste-your-gemini-key-from-step-1.2>
GEMINI_MODEL=gemini-1.5-flash
AI_PROVIDER=gemini
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email@gmail.com>
SMTP_PASSWORD=<your-gmail-app-password-from-step-1.3>
SMTP_FROM_EMAIL=noreply@smartcareer.uz
SMTP_FROM_NAME=SmartCareer AI
SMTP_USE_TLS=true
REDIS_ENABLED=true
CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
APP_NAME=SmartCareer AI
APP_VERSION=1.0.0
```

**Note:** We'll update `CORS_ORIGINS` and `FRONTEND_URL` after Vercel deploy.

### 2.6 Deploy!
Railway auto-deploys. Wait 3-5 minutes.

### 2.7 Get Your Backend URL
Railway will show: `https://your-app.up.railway.app`

**Copy this URL!** You need it for Vercel.

### 2.8 Test Backend
Open in browser: `https://your-app.up.railway.app/health`

Should see:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0"
}
```

✅ **Backend is live!**

---

## ⚡ Step 3: Deploy Frontend on Vercel (5 min)

### 3.1 Create Project
1. Go to https://vercel.com
2. **"New Project"** → Import from GitHub
3. Select your repository

### 3.2 Configure
1. **Root Directory**: `frontend`
2. **Framework**: Next.js (auto-detected)

### 3.3 Add Environment Variable
**Only ONE variable needed:**

```env
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
```

**⚠️ Use YOUR Railway URL from Step 2.7!**

### 3.4 Deploy!
Click **"Deploy"**. Wait 2-3 minutes.

### 3.5 Get Your Frontend URL
Vercel will show: `https://your-app.vercel.app`

**Copy this URL!**

✅ **Frontend is live!**

---

## 🔄 Step 3.5: Update Backend CORS (2 min)

Go back to Railway and update these variables:

```env
CORS_ORIGINS=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

Railway will auto-redeploy (1-2 min).

---

## ✅ Step 4: Test Everything (10 min)

### 4.1 Open Your App
Go to: `https://your-app.vercel.app`

### 4.2 Test Registration
1. Click "Register"
2. Enter your details
3. Submit
4. Check your email for welcome message

### 4.3 Test Login
1. Login with your credentials
2. Should redirect to dashboard

### 4.4 Test Universities
1. Go to "Universities" page
2. Should see 24 universities
3. Try AI search:
   - Enter: "Computer Science, USA, Budget: $30,000"
   - Click "AI Search"
   - Should get AI recommendations

### 4.5 Test Motivation Letter
1. Click on a university
2. Click "Generate Motivation Letter"
3. AI should generate a letter
4. Verify content makes sense

### 4.6 Check Backend Health
Open: `https://your-backend.railway.app/health`

Verify:
```json
{
  "status": "healthy",
  "database": "connected",
  "ai_service": {
    "provider": "gemini",
    "configured": true
  }
}
```

---

## 🎉 SUCCESS!

Your SmartCareer AI is now LIVE! 🚀

**Your URLs:**
- 🌐 Frontend: `https://your-app.vercel.app`
- 🔧 Backend: `https://your-app.up.railway.app`

**Costs:**
- Railway: FREE ($5 credit/month)
- Vercel: FREE (hobby plan)
- PostgreSQL: FREE (included)
- Redis: FREE (included)
- Gemini API: FREE (60 req/min)
- **Total: $0/month** ✨

---

## 🐛 Troubleshooting

### Frontend shows "Network Error"
**Fix:**
1. Check `NEXT_PUBLIC_API_URL` in Vercel
2. Check `CORS_ORIGINS` in Railway
3. Make sure both use `https://` (not `http://`)

### Backend health check fails
**Fix:**
1. Check Railway logs (click on service → Logs)
2. Verify PostgreSQL is running
3. Check environment variables are set

### AI search doesn't work
**Fix:**
1. Check `GEMINI_API_KEY` in Railway
2. Verify Gemini quota: https://ai.google.dev
3. Check Railway logs for errors

### Email not sending
**Fix:**
1. Check Gmail app password (no spaces!)
2. Verify 2-Step Verification is ON
3. Check SMTP settings in Railway

---

## 📈 Next Steps

### Optional Improvements:
1. **Add Sentry** (error monitoring)
   - Sign up: https://sentry.io
   - Add `SENTRY_DSN` to Railway

2. **Custom Domain**
   - Purchase domain (~$10/year)
   - Add to Vercel & Railway

3. **Seed Universities**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login & link project
   railway login
   railway link
   
   # Seed data
   railway run python seed_universities.py
   ```

4. **Monitor Usage**
   - Railway dashboard
   - Vercel analytics
   - Gemini API console

---

## 📞 Help

**Full Guide:** See `PRODUCTION_DEPLOYMENT.md`  
**Checklist:** See `PRODUCTION_CHECKLIST.md`

**Documentation:**
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Gemini: https://ai.google.dev/docs

---

## 🎊 Congratulations!

You just deployed a full-stack AI application to production in 30 minutes!

**Share your app and get feedback!** 🚀

**Remember:**
- ✅ Start with FREE tier
- ✅ Monitor usage
- ✅ Upgrade when needed
- ✅ Keep improving based on feedback

**Good luck!** 💪
