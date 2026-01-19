# ✅ Production Deployment Checklist

Quick checklist to ensure everything is ready for production deployment.

## 🔐 Phase 1: Security (CRITICAL!)

### Backend Security
- [ ] `DEBUG=false` in production environment
- [ ] Generate new `SECRET_KEY` (64+ characters, random)
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(64))"
  ```
- [ ] Update `ALGORITHM=HS256` (default is fine)
- [ ] Set `ACCESS_TOKEN_EXPIRE_MINUTES=30`
- [ ] Set `REFRESH_TOKEN_EXPIRE_DAYS=7`
- [ ] Never commit `.env` files to Git
- [ ] Use Railway/Vercel environment variables

### CORS Security
- [ ] Update `CORS_ORIGINS` with actual frontend URLs
- [ ] Remove `localhost` from production CORS
- [ ] Use HTTPS URLs only (no HTTP)

### Database Security
- [ ] Use PostgreSQL (not SQLite) in production
- [ ] Database password is strong
- [ ] Database URL is in environment variables (not hardcoded)

---

## 🤖 Phase 2: AI Services

### Gemini API (Recommended - FREE!)
- [ ] Get API key from https://ai.google.dev
- [ ] Set `GEMINI_API_KEY` in environment
- [ ] Set `AI_PROVIDER=gemini`
- [ ] Set `GEMINI_MODEL=gemini-1.5-flash`
- [ ] Test API works (check quota limits)

### OpenAI (Optional - Paid)
- [ ] Get API key from https://platform.openai.com
- [ ] Set `OPENAI_API_KEY` in environment
- [ ] Set `AI_PROVIDER=openai`
- [ ] Add billing method to OpenAI account
- [ ] Monitor usage to avoid surprise bills

---

## 📧 Phase 3: Email Configuration

### Gmail SMTP (Recommended)
- [ ] Enable 2-Step Verification on Google Account
- [ ] Generate App Password (Google Account > Security > App passwords)
- [ ] Set `SMTP_USER=your-email@gmail.com`
- [ ] Set `SMTP_PASSWORD=<16-char-app-password>`
- [ ] Set `SMTP_HOST=smtp.gmail.com`
- [ ] Set `SMTP_PORT=587`
- [ ] Set `SMTP_USE_TLS=true`
- [ ] Set `FRONTEND_URL=https://your-app.vercel.app`
- [ ] Test password reset email works

### Alternative: SendGrid (Optional)
- [ ] Create SendGrid account
- [ ] Get API key
- [ ] Set `SENDGRID_API_KEY`
- [ ] Verify sender email

---

## 🗄️ Phase 4: Database Setup

### PostgreSQL (Production)
- [ ] Provision PostgreSQL on Railway
- [ ] Verify `DATABASE_URL` is auto-set by Railway
- [ ] Run migrations: `alembic upgrade head`
- [ ] Seed universities: `python seed_universities.py`
- [ ] Seed test data (optional): `python seed_data.py`
- [ ] Verify data is in database: `python check_data.py`
- [ ] Setup automatic backups (Railway has this built-in)

### Redis (Optional but Recommended)
- [ ] Provision Redis on Railway
- [ ] Set `REDIS_ENABLED=true`
- [ ] Verify `REDIS_URL` is auto-set
- [ ] Test rate limiting works
- [ ] Test token blacklist (logout) works

---

## 🐛 Phase 5: Error Monitoring

### Sentry (Recommended)
- [ ] Create account at https://sentry.io
- [ ] Create new FastAPI project
- [ ] Copy DSN
- [ ] Set `SENTRY_DSN` in environment
- [ ] Deploy and trigger test error
- [ ] Verify error appears in Sentry
- [ ] Setup alert rules for critical errors
- [ ] Add team members (optional)

---

## 🚀 Phase 6: Backend Deployment (Railway)

### Railway Setup
- [ ] Create Railway account
- [ ] Connect GitHub repository
- [ ] Create new project from GitHub
- [ ] Set root directory to `backend`
- [ ] Provision PostgreSQL database
- [ ] Provision Redis (optional)
- [ ] Add all environment variables (see `env.production.template`)

### Environment Variables (Railway)
Copy values from `backend/env.production.template`:
- [ ] DEBUG
- [ ] SECRET_KEY
- [ ] GEMINI_API_KEY / OPENAI_API_KEY
- [ ] SMTP_* variables
- [ ] SENTRY_DSN
- [ ] CORS_ORIGINS
- [ ] FRONTEND_URL

### Deployment
- [ ] Click "Deploy" in Railway
- [ ] Wait for build to complete (3-5 min)
- [ ] Check deploy logs for errors
- [ ] Run migrations (auto-runs via railway.json)
- [ ] Get Railway URL: `https://your-app.up.railway.app`

### Testing Backend
- [ ] Test health check: `GET /health` returns 200
- [ ] Test universities: `GET /api/v1/universities?limit=5`
- [ ] Test registration: `POST /api/v1/auth/register`
- [ ] Test login: `POST /api/v1/auth/login`
- [ ] Check Railway logs for errors
- [ ] Check Sentry for errors

---

## 🌐 Phase 7: Frontend Deployment (Vercel)

### Vercel Setup
- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Set root directory to `frontend`
- [ ] Framework preset: Next.js (auto-detected)

### Environment Variable (Vercel)
Only ONE variable needed:
- [ ] `NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app`

### Deployment
- [ ] Click "Deploy"
- [ ] Wait for build (2-3 min)
- [ ] Check build logs for errors
- [ ] Get Vercel URL: `https://your-app.vercel.app`

### Update Backend CORS
- [ ] Go back to Railway
- [ ] Update `CORS_ORIGINS=https://your-app.vercel.app`
- [ ] Update `FRONTEND_URL=https://your-app.vercel.app`
- [ ] Railway will auto-redeploy

### Testing Frontend
- [ ] Open site in browser
- [ ] Check console for errors (F12)
- [ ] Test registration
- [ ] Test login
- [ ] Navigate to universities page
- [ ] Test AI search
- [ ] Generate motivation letter
- [ ] Test on mobile (responsive design)

---

## 🔍 Phase 8: Final Verification

### Backend Health
- [ ] `/health` endpoint returns healthy status
- [ ] Database connection: `"database": "connected"`
- [ ] AI service configured: `"ai_service": { "configured": true }`
- [ ] Redis connection (if enabled)
- [ ] No errors in Railway logs
- [ ] No errors in Sentry

### Frontend Functionality
- [ ] Homepage loads correctly
- [ ] Can register new account
- [ ] Receive welcome email
- [ ] Can login with credentials
- [ ] JWT token stored correctly
- [ ] Dashboard displays user info
- [ ] Universities page shows data from API
- [ ] AI university search works
- [ ] Motivation letter generation works
- [ ] Can logout
- [ ] Password reset flow works

### Security Headers
Test at: https://securityheaders.com/
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security (HSTS)
- [ ] Content-Security-Policy

### Performance
Test at: https://pagespeed.web.dev/
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 5s
- [ ] Lighthouse score > 80

---

## 📊 Phase 9: Monitoring Setup

### Daily Monitoring
- [ ] Check Railway dashboard for service health
- [ ] Check Vercel analytics
- [ ] Check Sentry for new errors
- [ ] Monitor AI API usage (Gemini/OpenAI)
- [ ] Check email sending status

### Alerts Setup
- [ ] Sentry: Alert on critical errors
- [ ] Railway: Alert on service down
- [ ] Vercel: Alert on build failures
- [ ] Gmail: Monitor daily send limit

---

## 📈 Phase 10: Post-Launch (Optional)

### Custom Domain
- [ ] Purchase domain (~$10-15/year)
- [ ] Add to Vercel (frontend)
- [ ] Add to Railway (backend as subdomain)
- [ ] Update CORS_ORIGINS
- [ ] Update FRONTEND_URL
- [ ] Verify SSL certificate

### Analytics (Optional)
- [ ] Add Google Analytics
- [ ] Add Plausible (privacy-friendly)
- [ ] Track user journeys
- [ ] Monitor conversion rates

### Backups
- [ ] Railway auto-backups enabled
- [ ] Manual database backup script
- [ ] Test restore process

### Scaling (When Needed)
- [ ] Upgrade Railway plan if needed
- [ ] Upgrade Vercel plan if needed
- [ ] Add CDN for static files
- [ ] Add caching layer (Redis)
- [ ] Consider load balancing

---

## 💰 Cost Summary

### FREE Tier (MVP/Demo)
- Railway: $5 credit/month
- Vercel: Free hobby plan
- PostgreSQL: Included
- Redis: Included
- Gemini API: FREE
- Sentry: 5K errors/month free
- **Total: $0/month** ✨

### Paid (Production)
- Railway Pro: $20/month
- Vercel Pro: $20/month (optional)
- Custom domain: $10-15/year
- Sentry Team: $26/month (optional)
- **Total: $20-50/month**

---

## 🎉 Success Criteria

Your app is production-ready when:

✅ All security measures implemented  
✅ Backend health check returns 200  
✅ Frontend connects to backend  
✅ Can register, login, logout  
✅ Universities API works  
✅ AI features work (search + motivation letters)  
✅ Email sending works  
✅ No errors in logs  
✅ HTTPS enabled  
✅ CORS properly configured  
✅ Error monitoring active  
✅ Tested on multiple devices  

---

## 📞 Need Help?

**Documentation:**
- This guide: `PRODUCTION_DEPLOYMENT.md`
- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs

**Troubleshooting:**
- Check Railway logs
- Check Vercel logs  
- Check Sentry errors
- Review environment variables

**Emergency Checklist:**
1. ⚠️ Site down? Check Railway service status
2. ⚠️ API errors? Check Railway logs + Sentry
3. ⚠️ Frontend errors? Check browser console + Vercel logs
4. ⚠️ Database errors? Check Railway PostgreSQL status
5. ⚠️ Email not sending? Check Gmail quotas + SMTP settings

---

**Good luck with your launch!** 🚀

**Remember:** Start with FREE tier, upgrade when you get users!
