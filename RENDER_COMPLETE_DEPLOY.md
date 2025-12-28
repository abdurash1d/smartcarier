# 🚀 Render.com - To'liq Deployment Guide

## ✅ Barcha Muammolar Tuzatildi

### 1. ✅ Requirements.txt yangilandi
- `redis==5.0.1` qo'shildi
- `stripe==12.5.1` qo'shildi
- `pytest-cov==4.1.0` qo'shildi
- `tiktoken` comment qilingan (Rust muammosi)

### 2. ✅ Frontend next.config.js tuzatildi
- `output: 'standalone'` o'chirildi (Render Static Site uchun kerak emas)

### 3. ✅ Error logging service
- Import xatoliklar try-except bilan himoyalangan

---

## 📋 Qadam-baqadam Deployment

### QADAM 1: PostgreSQL Database Yaratish

1. **Render Dashboard** → **"New +"** → **"PostgreSQL"**
2. Sozlamalar:
   ```
   Name: smartcareer-db
   Region: Oregon (yoki yaqin)
   Plan: Free (test uchun) yoki Starter ($7/oy)
   ```
3. **"Create Database"** bosing
4. **"Internal Database URL"** ni copy qiling:
   ```
   postgresql://user:password@host:5432/dbname
   ```

---

### QADAM 2: Backend Service Yaratish

1. **Render Dashboard** → **"New +"** → **"Web Service"**
2. **GitHub Repository** ni tanlang: `Bilolbee/smartcarier`
3. Sozlamalar:

#### Service Details:
```
Name: smartcareer-backend
Region: Oregon (Database bilan bir xil)
Branch: main
Root Directory: backend
Runtime: Python 3
Python Version: 3.11.0  ← MUHIM!
```

#### Build Command:
```bash
pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt && alembic upgrade head
```

#### Start Command:
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

### QADAM 3: Environment Variables (Backend)

**Backend Service** → **"Environment"** tab'ga boring va qo'shing:

#### Majburiy (5 ta):
```env
DATABASE_URL=[PostgreSQL'dan Internal Database URL]
SECRET_KEY=[Generate tugmasini bosing yoki openssl rand -hex 32]
GEMINI_API_KEY=[Google Gemini'dan oling]
AI_PROVIDER=gemini
DEBUG=false
```

#### Ixtiyoriy (lekin tavsiya etiladi):
```env
FRONTEND_URL=https://your-frontend.onrender.com
CORS_ORIGINS=https://your-frontend.onrender.com
REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379/0
RATE_LIMIT_USE_REDIS=false
TOKEN_BLACKLIST_USE_REDIS=false
```

#### OAuth (ixtiyoriy):
```env
GOOGLE_CLIENT_ID=[Google OAuth'dan]
GOOGLE_CLIENT_SECRET=[Google OAuth'dan]
GOOGLE_REDIRECT_URI=https://your-backend.onrender.com/api/v1/auth/callback/google
OAUTH_ENABLED=true
```

#### Payments (ixtiyoriy):
```env
STRIPE_SECRET_KEY=[Stripe'dan]
STRIPE_WEBHOOK_SECRET=[Stripe'dan]
PAYMENTS_REQUIRE_WEBHOOK_SECRET=true
```

---

### QADAM 4: Backend Deploy

1. **"Save Changes"** bosing
2. **"Manual Deploy"** → **"Deploy latest commit"**
3. ⏳ 5-10 daqiqa kuting
4. **"Logs"** tab'da tekshiring:
   ```
   ✓ Installing Python version 3.11.0...
   ✓ Installing dependencies...
   ✓ Running migrations...
   ✓ Starting uvicorn...
   ```

---

### QADAM 5: Backend Health Check

Deploy'dan keyin:

1. **Backend URL** ni oling: `https://smartcareer-backend.onrender.com`
2. Browser'da oching:
   ```
   https://smartcareer-backend.onrender.com/health
   ```
3. Quyidagilar ko'rinishi kerak:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "version": "1.0.0"
   }
   ```

---

### QADAM 6: Frontend Service Yaratish

1. **Render Dashboard** → **"New +"** → **"Static Site"**
2. **GitHub Repository** ni tanlang: `Bilolbee/smartcarier`
3. Sozlamalar:

```
Name: smartcareer-frontend
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: .next
```

---

### QADAM 7: Environment Variables (Frontend)

**Frontend Service** → **"Environment"** tab'ga boring va qo'shing:

```env
NEXT_PUBLIC_API_URL=https://smartcareer-backend.onrender.com/api/v1
NEXT_PUBLIC_FRONTEND_URL=https://smartcareer-frontend.onrender.com
```

---

### QADAM 8: Frontend Deploy

1. **"Save Changes"** bosing
2. ⏳ 3-5 daqiqa kuting (build vaqtida)
3. **"Logs"** tab'da tekshiring:
   ```
   ✓ Installing dependencies...
   ✓ Building Next.js...
   ✓ Exporting static files...
   ```

---

### QADAM 9: Frontend Test

1. **Frontend URL** ni oling: `https://smartcareer-frontend.onrender.com`
2. Browser'da oching
3. Login/Register sahifasini tekshiring

---

## 🔧 Muammolarni Tuzatish

### Xatolik 1: `pip: not found`
**Yechim:** Service Type → **"Web Service"** (Docker emas)

### Xatolik 2: `npm: not found`
**Yechim:** Frontend → **"Static Site"** (Docker emas)

### Xatolik 3: `requirements.txt not found`
**Yechim:** Root Directory → `backend` bo'lishi kerak

### Xatolik 4: `Python 3.13` Rust compiler error
**Yechim:** Python Version → `3.11.0` yoki `3.12.0`

### Xatolik 5: `tiktoken` build failed
**Yechim:** `requirements.txt` da comment qilingan (kerak emas)

### Xatolik 6: `alembic upgrade head` failed
**Yechim:** 
- Database URL to'g'ri bo'lishi kerak
- PostgreSQL database yaratilgan bo'lishi kerak
- Logs'ni tekshiring

### Xatolik 7: `Database connection failed`
**Yechim:**
- `DATABASE_URL` to'g'ri bo'lishi kerak
- PostgreSQL database ishlayotgan bo'lishi kerak
- Internal Database URL ishlatilmoqda (External emas)

---

## ✅ Checklist

### Backend:
- [ ] PostgreSQL Database yaratildi
- [ ] Backend Service yaratildi (Web Service)
- [ ] Root Directory: `backend`
- [ ] Python Version: `3.11.0`
- [ ] Build Command to'g'ri
- [ ] Start Command to'g'ri
- [ ] Environment Variables qo'shildi (minimal 5 ta)
- [ ] Deploy muvaffaqiyatli
- [ ] Health check ishlayapti: `/health`

### Frontend:
- [ ] Frontend Service yaratildi (Static Site)
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `.next`
- [ ] Environment Variables qo'shildi
- [ ] Deploy muvaffaqiyatli
- [ ] Frontend ishlayapti

---

## 📊 Pricing

### Free Tier (Test uchun):
- Backend: Free (90 kun)
- Frontend: Static Site (Free)
- Database: Free (90 kun)
- **Jami: $0**

### Production (Tavsiya):
- Backend: Starter ($7/oy) yoki Standard ($25/oy)
- Frontend: Static Site (Free)
- Database: Starter ($7/oy)
- **Jami: $14/oy yoki $32/oy**

---

## 🎯 Keyingi Qadamlar

1. **Google OAuth sozlash:**
   - `backend/GOOGLE_OAUTH_SETUP.md` dagi ko'rsatmalarni bajaring
   - Google Cloud Console'da OAuth Client ID yarating
   - Environment Variables'ga qo'shing

2. **Stripe sozlash (ixtiyoriy):**
   - Stripe account yarating
   - API keys oling
   - Webhook endpoint sozlang

3. **Redis sozlash (ixtiyoriy):**
   - Render'da Redis service yarating
   - `REDIS_URL` ni qo'shing
   - `REDIS_ENABLED=true` qiling

4. **Monitoring:**
   - Render'da Metrics tab'ni kuzatib turing
   - Logs'ni tekshiring

---

## 📞 Yordam

Agar muammo bo'lsa:

1. **Logs'ni tekshiring:**
   - Backend → Logs tab
   - Frontend → Logs tab

2. **Health check:**
   - `https://your-backend.onrender.com/health`

3. **Database tekshirish:**
   - PostgreSQL → Connections tab
   - Database URL to'g'ri bo'lishi kerak

---

## ✅ Xulosa

Barcha muammolar tuzatildi va deployment guide tayyor!

**Keyingi qadam:** Qadam-baqadam ko'rsatmalarni bajaring va deploy qiling.

**Tayyor!** 🚀

