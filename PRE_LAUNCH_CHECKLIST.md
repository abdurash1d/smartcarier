# ✅ PRE-LAUNCH CHECKLIST

**Complete Before Going Live**  
**SmartCareer AI**

---

## 🎯 MISSION CRITICAL (MUST COMPLETE)

### 🔐 Security (100% Required)
- [ ] `DEBUG=False` in production .env
- [ ] New `SECRET_KEY` generated (64+ chars)
- [ ] `.env` not committed to Git
- [ ] `.env` in `.gitignore`
- [ ] No API keys in code
- [ ] CORS restricted to your domains
- [ ] HTTPS enabled
- [ ] SSL certificate valid (A+ grade)
- [ ] Rate limiting enabled
- [ ] Security headers configured

**Verification:**
```bash
cd backend
python scripts/security_scan.py
# Must pass with 0 high-severity issues
```

---

### 🗄️ Database (100% Required)
- [ ] PostgreSQL configured (NOT SQLite)
- [ ] Database connection tested
- [ ] All migrations applied
- [ ] Database backed up
- [ ] Backup script scheduled
- [ ] Connection pooling enabled

**Verification:**
```bash
cd backend
python scripts/validate_deployment.py
# Check "Database Connection" section
```

---

### 🔑 API Keys (100% Required)
- [ ] Gemini API key set
- [ ] Gemini API tested
- [ ] Stripe LIVE keys (not test)
- [ ] Stripe webhook secret set
- [ ] Email service configured (SendGrid/Mailgun)
- [ ] Email sending tested

**Verification:**
```bash
cd backend
python -c "from app.services.gemini_service import gemini_service; print(gemini_service.generate('Hello'))"
```

---

### 📊 Monitoring (100% Required)
- [ ] Sentry account created
- [ ] Sentry DSN configured
- [ ] Error tracking tested
- [ ] UptimeRobot configured
- [ ] Health check monitored
- [ ] Alert emails set

**Verification:**
1. Trigger test error, check Sentry dashboard
2. Check UptimeRobot status

---

## 🎖️ HIGHLY RECOMMENDED (90% Should Complete)

### ⚡ Performance
- [ ] Redis caching configured
- [ ] Database indexes added
- [ ] Response compression enabled
- [ ] Performance benchmarks run
- [ ] Average response < 500ms

**Verification:**
```bash
cd backend
python scripts/benchmark_performance.py
# Target: Grade B or better
```

---

### 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] API endpoints tested
- [ ] Critical user flows tested
- [ ] Payment flow tested

**Verification:**
```bash
cd backend
pytest
python scripts/test_api_endpoints.py
```

---

### 📧 Email Templates
- [ ] Welcome email template
- [ ] Verification email template
- [ ] Password reset template
- [ ] Application notification template
- [ ] All templates tested

---

### 💳 Payments
- [ ] Stripe products created
- [ ] Pricing configured ($4/mo, $40/yr)
- [ ] Webhook endpoint live
- [ ] Webhook signature verified
- [ ] Test payment completed
- [ ] Subscription flow tested

---

## 💡 NICE TO HAVE (Optional)

### 🎨 Frontend
- [ ] Favicon set
- [ ] OG meta tags
- [ ] Twitter cards
- [ ] Google Analytics
- [ ] Custom 404 page
- [ ] Loading states
- [ ] Error boundaries

---

### 📱 Mobile
- [ ] Responsive design tested
- [ ] Mobile menu works
- [ ] Touch interactions tested
- [ ] PWA manifest (optional)

---

### 📚 Documentation
- [ ] README updated
- [ ] API docs published
- [ ] User guide written
- [ ] FAQ created
- [ ] Support email set

---

### 🔄 Integrations
- [ ] Payme integration (if needed)
- [ ] OAuth providers (Google, etc)
- [ ] Analytics (GA, Mixpanel)
- [ ] Live chat (optional)

---

## 🚀 DEPLOYMENT STEPS

### 1. Pre-Deployment (30 min)
```bash
# Run all validation scripts
cd backend

# 1. Security scan
python scripts/security_scan.py

# 2. Deployment validation
python scripts/validate_deployment.py

# 3. API tests (start server first)
python -m uvicorn app.main:app --reload &
sleep 5
python scripts/test_api_endpoints.py

# 4. Performance benchmark
python scripts/benchmark_performance.py

# All must pass!
```

---

### 2. Deploy Backend (Railway - Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Production ready"
git push origin main

# 2. Railway Setup
# - Go to railway.app
# - New Project → Deploy from GitHub
# - Select repository
# - Add PostgreSQL service
# - Configure environment variables (from env.production.example)

# 3. Verify deployment
curl https://your-backend.railway.app/health
```

**Environment Variables to Set:**
- `DATABASE_URL` (auto-provided by Railway PostgreSQL)
- `SECRET_KEY` (generate new!)
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY` (sk_live_...)
- `STRIPE_WEBHOOK_SECRET`
- `SENDGRID_API_KEY`
- `SENTRY_DSN`
- `CORS_ORIGINS` (your frontend URL)
- `FRONTEND_URL` (your frontend URL)
- `DEBUG=False`

---

### 3. Deploy Frontend (Vercel - Recommended)

```bash
# 1. Push to GitHub (if not already)
git push origin main

# 2. Vercel Setup
# - Go to vercel.com
# - New Project → Import from GitHub
# - Select repository
# - Root directory: frontend
# - Framework: Next.js (auto-detected)
# - Configure environment variables

# 3. Verify deployment
# Visit your Vercel URL
```

**Environment Variables:**
- `NEXT_PUBLIC_API_URL` (your Railway backend URL)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_...)

---

### 4. Post-Deployment (15 min)

```bash
# 1. Run migrations on production database
# (Railway console or local with prod DATABASE_URL)
alembic upgrade head

# 2. Seed initial data (if needed)
python seed_universities.py

# 3. Test production endpoints
python scripts/test_api_endpoints.py https://your-backend.railway.app

# 4. Test frontend
# - Visit your Vercel URL
# - Register account
# - Login
# - Create resume
# - Search jobs
# - Apply to job
# - Test subscription (with test card)
```

---

### 5. Configure Webhooks

**Stripe Webhooks:**
```
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: https://your-backend.railway.app/api/v1/payments/stripe/webhook
3. Select events: 
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
4. Copy webhook secret
5. Add to Railway env: STRIPE_WEBHOOK_SECRET
```

**UptimeRobot:**
```
1. UptimeRobot Dashboard → Add Monitor
2. URL: https://your-backend.railway.app/health
3. Interval: 5 minutes
4. Alert: Email
```

---

## ✅ FINAL VERIFICATION

### Manual Testing Checklist:

**Authentication:**
- [ ] Can register new account
- [ ] Receive verification email
- [ ] Can login
- [ ] Can reset password

**Core Features:**
- [ ] Can search jobs
- [ ] Can view job details
- [ ] Can create resume
- [ ] Can edit resume
- [ ] Can apply to job
- [ ] Can search universities
- [ ] AI search works

**Payments:**
- [ ] Can view pricing page
- [ ] Can start checkout
- [ ] Can complete payment (test mode)
- [ ] Subscription activates
- [ ] Premium features unlock

**UI/UX:**
- [ ] All pages load correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Dark mode works (if implemented)
- [ ] Loading states work
- [ ] Error messages clear

---

## 📊 SUCCESS METRICS

### After 24 Hours:
- [ ] Zero downtime
- [ ] No critical errors in Sentry
- [ ] Average response time < 500ms
- [ ] Uptime 100%
- [ ] At least 1 test user registered

### After 1 Week:
- [ ] 10+ users registered
- [ ] 50+ jobs searched
- [ ] 10+ resumes created
- [ ] 1+ subscription (if launched publicly)
- [ ] Zero security incidents
- [ ] Uptime 99.9%+

---

## 🚨 ROLLBACK PLAN

**If critical issue found:**

### Option 1: Quick Fix
```bash
# Fix in code
git add .
git commit -m "Hotfix: ..."
git push
# Railway/Vercel auto-deploys
```

### Option 2: Rollback
```bash
# Railway: Dashboard → Deployments → Revert
# Vercel: Dashboard → Deployments → Revert
```

### Option 3: Maintenance Mode
```bash
# Set maintenance mode
# Railway env: MAINTENANCE_MODE=True
# Shows "Under maintenance" page
```

---

## 📞 SUPPORT CONTACTS

### If Issues:
- **Backend errors:** Check Sentry
- **Database issues:** Check Railway logs
- **Payment issues:** Check Stripe dashboard
- **Email issues:** Check SendGrid dashboard
- **Downtime:** Check UptimeRobot

### Emergency Contacts:
- Railway support: support@railway.app
- Vercel support: support@vercel.com
- Stripe support: Dashboard → Help

---

## 🎉 LAUNCH DAY TIMELINE

**T-24h:** Final code freeze, run all tests  
**T-12h:** Deploy to production, verify  
**T-6h:** Final testing, fix any issues  
**T-2h:** Team standby, monitor  
**T-0:** LAUNCH! 🚀  
**T+1h:** Monitor closely  
**T+6h:** Check metrics  
**T+24h:** Full review

---

## ✅ COMPLETION

**Sign off when 100% complete:**

- [ ] All "Mission Critical" items complete
- [ ] All scripts passing
- [ ] Production deployed and verified
- [ ] Monitoring configured
- [ ] Team notified
- [ ] Documentation updated
- [ ] Celebration planned 🎉

**Launched by:** _______________  
**Date:** _______________  
**Time:** _______________

---

**STATUS:** 📋 Ready to Use  
**Priority:** 🔴 CRITICAL

**USE THIS BEFORE LAUNCH!** ☑️
