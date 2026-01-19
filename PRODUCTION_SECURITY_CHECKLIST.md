# 🔒 PRODUCTION SECURITY CHECKLIST

**Complete Security Audit Before Launch**  
**Generated:** 2026-01-19

---

## 🎯 PRE-LAUNCH SECURITY

**Complete ALL items before going live!**

---

## ✅ CATEGORY 1: ENVIRONMENT & SECRETS

### Critical:
- [ ] `DEBUG=False` in production
- [ ] New `SECRET_KEY` generated (64+ chars)
- [ ] No secrets in Git history
- [ ] `.env` in `.gitignore`
- [ ] `.env` NOT committed
- [ ] All API keys rotated from development
- [ ] Database passwords strong (16+ chars, random)
- [ ] Admin credentials changed from defaults

### Verification:
```bash
# Check DEBUG is False
grep "DEBUG" backend/.env

# Verify .env not in Git
git ls-files | grep ".env"
# Should return nothing!

# Check Git history for secrets
git log --all --full-history --source -- "*env*"
```

---

## ✅ CATEGORY 2: DATABASE SECURITY

### Critical:
- [ ] PostgreSQL (NOT SQLite) in production
- [ ] Database password strong & unique
- [ ] Database on private network
- [ ] No public database access
- [ ] SSL/TLS for database connections
- [ ] Backup encryption enabled
- [ ] Database user permissions minimal (not root)

### Configuration:
```python
# backend/app/config.py
DATABASE_URL=postgresql://user:pass@private-host/db?sslmode=require
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10
```

### Test:
```bash
# Verify SSL connection
psql $DATABASE_URL -c "SHOW ssl;"
# Should show: on
```

---

## ✅ CATEGORY 3: API SECURITY

### Critical:
- [ ] CORS restricted to your domains only
- [ ] Rate limiting enabled
- [ ] JWT tokens expire (30 min recommended)
- [ ] Password hashing (bcrypt)
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (SQLAlchemy)
- [ ] XSS protection headers
- [ ] CSRF tokens where needed

### Check CORS:
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # NO wildcards!
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### Rate Limiting:
```python
# Already implemented in:
# backend/app/core/rate_limiter.py
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=120
```

---

## ✅ CATEGORY 4: HTTPS & SSL

### Critical:
- [ ] HTTPS enforced (no HTTP)
- [ ] SSL certificate valid
- [ ] SSL certificate auto-renewal
- [ ] HSTS header enabled
- [ ] Secure cookies (Secure flag)
- [ ] HTTPOnly cookies
- [ ] SameSite cookies

### Headers:
```python
# backend/app/main.py - Already added!
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response
```

### Test SSL:
```bash
# Check SSL grade
curl https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# Should be A or A+
```

---

## ✅ CATEGORY 5: AUTHENTICATION & AUTHORIZATION

### Critical:
- [ ] Password min length: 8 characters
- [ ] Password requirements enforced
- [ ] Email verification required
- [ ] Account lockout after failed attempts
- [ ] Session timeout implemented
- [ ] Refresh token rotation
- [ ] OAuth tokens secured
- [ ] Admin routes protected

### Password Policy:
```python
# backend/app/schemas/user.py
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must have uppercase')
        if not any(c.islower() for c in v):
            raise ValueError('Password must have lowercase')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must have digit')
        return v
```

---

## ✅ CATEGORY 6: FILE UPLOADS

### Critical:
- [ ] File size limits enforced
- [ ] File type validation (MIME + magic bytes)
- [ ] Files scanned for malware (if possible)
- [ ] Files stored outside web root
- [ ] S3/CDN for file storage (not local)
- [ ] Unique filenames (prevent overwrite)
- [ ] Access control on uploaded files

### Implementation:
```python
# backend/app/core/file_validation.py - Already done!
MAX_FILE_SIZE=10485760  # 10 MB
ALLOWED_EXTENSIONS=['.pdf', '.doc', '.docx', '.jpg', '.png']
validate_file_upload()  # Checks MIME + magic bytes
```

---

## ✅ CATEGORY 7: API KEYS & INTEGRATIONS

### Critical:
- [ ] All API keys in environment variables
- [ ] API keys not in code
- [ ] API keys not in frontend
- [ ] API keys rotated every 3-6 months
- [ ] Separate keys for dev/staging/prod
- [ ] Monitoring for API key usage
- [ ] Rate limits on external APIs

### Services to Secure:
- [ ] Gemini API key (not exposed to frontend)
- [ ] Stripe secret key (backend only)
- [ ] Stripe publishable key (frontend OK)
- [ ] Payme merchant credentials
- [ ] SendGrid API key
- [ ] OAuth client secrets

### Test:
```bash
# Search for hardcoded keys
grep -r "sk_live" backend/
grep -r "AIza" backend/
# Should return nothing!
```

---

## ✅ CATEGORY 8: MONITORING & LOGGING

### Critical:
- [ ] Sentry error tracking configured
- [ ] Log level set to WARNING/ERROR
- [ ] No sensitive data in logs
- [ ] Structured logging (JSON)
- [ ] Log retention policy
- [ ] Alert on critical errors
- [ ] Uptime monitoring
- [ ] Performance monitoring

### Sentry Setup:
```python
# backend/app/main.py - Already done!
import sentry_sdk
sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    environment="production",
    traces_sample_rate=0.1,
)
```

### What NOT to Log:
```python
# BAD:
logger.info(f"User login: {email} {password}")  # NO!
logger.debug(f"API Key: {api_key}")  # NO!

# GOOD:
logger.info(f"User login: {email}")  # OK
logger.debug(f"API request made")  # OK
```

---

## ✅ CATEGORY 9: THIRD-PARTY DEPENDENCIES

### Critical:
- [ ] All dependencies up to date
- [ ] No known vulnerabilities
- [ ] Minimal dependencies
- [ ] Dependencies from trusted sources
- [ ] Lock file used (requirements.txt)

### Check:
```bash
# Check for vulnerabilities
cd backend
pip install safety
safety check

# Update outdated packages
pip list --outdated
```

---

## ✅ CATEGORY 10: BACKUP & RECOVERY

### Critical:
- [ ] Automated daily backups
- [ ] Backup encryption enabled
- [ ] Off-site backup storage
- [ ] Backup restoration tested
- [ ] Backup retention policy (30 days)
- [ ] Point-in-time recovery possible

### Automated Backup:
```bash
# Already created!
# backend/scripts/backup_database.sh

# Test restore:
bash backend/scripts/restore_database.sh backup_file.sql
```

---

## ✅ CATEGORY 11: DDOS & ABUSE PROTECTION

### Critical:
- [ ] Rate limiting per IP
- [ ] Rate limiting per user
- [ ] Cloudflare or similar CDN
- [ ] Web Application Firewall (WAF)
- [ ] Bot protection
- [ ] Captcha on sensitive forms

### Rate Limits:
```python
# backend/app/core/rate_limiter.py - Already done!
# Per user: 120/min, 3000/hour
# Auth endpoints: 10/hour
```

---

## ✅ CATEGORY 12: COMPLIANCE

### Critical:
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] GDPR compliance (if EU users)
- [ ] Cookie consent
- [ ] Data export feature
- [ ] Data deletion feature
- [ ] User data encrypted at rest

### GDPR Requirements:
```python
# backend/app/api/v1/routes/users.py
@router.post("/export-data")
async def export_user_data():
    # Return all user data in JSON
    pass

@router.delete("/delete-account")
async def delete_account():
    # Permanently delete user data
    pass
```

---

## ✅ CATEGORY 13: FRONTEND SECURITY

### Critical:
- [ ] No API keys in frontend code
- [ ] Environment variables for frontend
- [ ] XSS protection (sanitize HTML)
- [ ] Content Security Policy (CSP)
- [ ] Subresource Integrity (SRI)
- [ ] No eval() or dangerous functions

### Check:
```bash
# Search for secrets in frontend
cd frontend
grep -r "AIza" src/
grep -r "sk_" src/
# Should return nothing!
```

---

## ✅ CATEGORY 14: PAYMENT SECURITY

### Critical:
- [ ] PCI DSS compliance (if handling cards)
- [ ] Never store card numbers
- [ ] Stripe handles card data (not you)
- [ ] Webhook signature verification
- [ ] Idempotent payment processing
- [ ] Payment logs for audit

### Webhook Verification:
```python
# backend/app/services/payment_service.py - Already done!
stripe.Webhook.construct_event(
    payload, 
    sig_header, 
    settings.STRIPE_WEBHOOK_SECRET
)
```

---

## 🔥 CRITICAL VULNERABILITIES TO FIX

### Top 10 (OWASP):

1. **Broken Access Control**
   - [ ] User can't access other users' data
   - [ ] Admin routes require admin role
   - [ ] Test with different user accounts

2. **Cryptographic Failures**
   - [ ] Passwords hashed with bcrypt
   - [ ] HTTPS everywhere
   - [ ] Encrypted database connections

3. **Injection**
   - [ ] SQLAlchemy ORM used (prevents SQL injection)
   - [ ] Input validation on all fields
   - [ ] No raw SQL queries

4. **Insecure Design**
   - [ ] Security reviewed before implementation
   - [ ] Threat modeling done
   - [ ] Security requirements documented

5. **Security Misconfiguration**
   - [ ] DEBUG=False
   - [ ] Default credentials changed
   - [ ] Unnecessary features disabled

6. **Vulnerable Components**
   - [ ] Dependencies updated
   - [ ] No known CVEs
   - [ ] Automated security scanning

7. **Authentication Failures**
   - [ ] Strong password policy
   - [ ] Account lockout
   - [ ] MFA available (optional)

8. **Data Integrity Failures**
   - [ ] Input validation
   - [ ] Output encoding
   - [ ] Integrity checks on updates

9. **Logging Failures**
   - [ ] All auth events logged
   - [ ] Security events monitored
   - [ ] Alerts on suspicious activity

10. **SSRF (Server-Side Request Forgery)**
    - [ ] URL validation on user inputs
    - [ ] No arbitrary URL fetching
    - [ ] Whitelist external domains

---

## 🧪 SECURITY TESTING

### Before Launch:

```bash
# 1. Dependency scan
pip install safety
safety check

# 2. Code scan
pip install bandit
bandit -r backend/app/

# 3. SQL injection test (manual)
# Try: email=' OR '1'='1

# 4. XSS test (manual)
# Try: <script>alert('XSS')</script>

# 5. Rate limit test
# Send 200 requests in 1 minute

# 6. Authentication test
# Try accessing protected routes without token

# 7. Authorization test
# Try accessing other users' data

# 8. File upload test
# Try uploading .exe, .php files

# 9. CORS test
# Try from unauthorized domain

# 10. SSL test
# https://www.ssllabs.com/ssltest/
```

---

## 📋 FINAL SECURITY CHECKLIST

### Must Complete Before Launch:

**Environment:**
- [ ] DEBUG=False
- [ ] New SECRET_KEY
- [ ] No secrets in Git
- [ ] Production database

**Network:**
- [ ] HTTPS only
- [ ] SSL A+ grade
- [ ] CORS restricted
- [ ] Rate limiting on

**Authentication:**
- [ ] Strong passwords
- [ ] Email verification
- [ ] JWT expiration
- [ ] Session management

**Data:**
- [ ] Input validation
- [ ] Output encoding
- [ ] Encrypted at rest
- [ ] Secure backups

**Monitoring:**
- [ ] Sentry configured
- [ ] Error alerts
- [ ] Uptime monitoring
- [ ] Security logs

**Compliance:**
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] GDPR ready
- [ ] Cookie consent

**Testing:**
- [ ] Penetration test done
- [ ] Vulnerability scan passed
- [ ] Security review completed
- [ ] Backup restore tested

---

## 🚨 RED FLAGS (DO NOT LAUNCH IF ANY):

- ❌ DEBUG=True in production
- ❌ Secrets committed to Git
- ❌ SQLite in production
- ❌ HTTP (not HTTPS)
- ❌ CORS allow_origins=["*"]
- ❌ No rate limiting
- ❌ Default admin password
- ❌ No backups
- ❌ No error monitoring
- ❌ Known vulnerabilities

---

## ✅ SECURITY SCORE

**Calculate your score:**

- Critical items (30 items): ___/30 ✅
- Important items (20 items): ___/20 ✅
- Nice-to-have (10 items): ___/10 ✅

**Minimum to launch:** 28/30 critical ✅

**Target score:** 50/60 total ✅

---

## 📞 WHEN IN DOUBT:

1. **Hire security expert** for audit ($500-2000)
2. **Use HackerOne** for bug bounty
3. **Read OWASP** guidelines
4. **Ask community** (Reddit r/netsec)
5. **Better safe than sorry!**

---

**Status:** 🔒 Security Checklist Ready  
**Time to Complete:** 2-4 hours  
**Priority:** 🔴 CRITICAL

**DO NOT SKIP!** 🚨

