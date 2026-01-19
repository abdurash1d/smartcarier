# 🚀 Render.com Deploy - 0 dan Boshlab

## 📋 Tarkib

1. [Render.com Account](#1-rendercom-account)
2. [PostgreSQL Database](#2-postgresql-database)
3. [Backend Service](#3-backend-service)
4. [Frontend Static Site](#4-frontend-static-site)
5. [Environment Variables](#5-environment-variables)
6. [Deploy va Test](#6-deploy-va-test)

---

## 1. Render.com Account

### Qadam 1.1: Account Ochish

1. https://render.com ga kiring
2. **"Get Started for Free"** tugmasini bosing
3. GitHub yoki Email bilan ro'yxatdan o'ting
4. Email tasdiqlang

---

## 2. PostgreSQL Database

### Qadam 2.1: Database Yaratish

1. Render Dashboard → **"+ New +"** → **"PostgreSQL"**
2. Sozlamalar:
   ```
   Name: smartcareer-db
   Database: smartcareer
   User: smartcareer_user
   Region: Singapore (yoki yaqin)
   PostgreSQL Version: 16 (yoki latest)
   Plan: Free
   ```
3. **"Create Database"** bosing
4. ⏳ 2-3 daqiqa kuting (database yaratilmoqda)

### Qadam 2.2: Database URL ni Olish

1. Database yaratilgandan keyin → **"Connections"** tab
2. **"Internal Database URL"** ni copy qiling:
   ```
   postgresql://smartcareer_user:password@dpg-xxxxx-a/smartcareer
   ```
   ⚠️ Bu URL'ni saqlang - keyinroq kerak bo'ladi!

---

## 3. Backend Service

### Qadam 3.1: Backend Service Yaratish

1. Render Dashboard → **"+ New +"** → **"Web Service"**
2. GitHub repository'ni ulang:
   - Agar GitHub'da yo'q bo'lsa → avval GitHub'ga push qiling
   - Repository'ni tanlang: `Bilolbee/smartcarier`
3. Sozlamalar:

#### Basic Settings:
```
Name: smartcareer-backend
Region: Singapore (yoki yaqin)
Branch: main (yoki master)
Root Directory: backend
Runtime: Python 3
```

#### Build & Start:
```
Build Command:
pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt && alembic upgrade head

Start Command:
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### Plan:
```
Plan: Free
```

4. **"Create Web Service"** bosing

### Qadam 3.2: Environment Variables (Backend)

**Settings** → **"Environment"** tab → **"+ Add Environment Variable"**

#### Majburiy Variables:

```
NAME: DATABASE_URL
VALUE: [PostgreSQL'dan copy qilingan Internal Database URL]
```

```
NAME: SECRET_KEY
VALUE: [Generate tugmasini bosing yoki random 32 character]
```

```
NAME: GEMINI_API_KEY
VALUE: [Google Gemini API key - https://ai.google.dev/]
```

```
NAME: AI_PROVIDER
VALUE: gemini
```

```
NAME: DEBUG
VALUE: false
```

```
NAME: FRONTEND_URL
VALUE: https://smartcareer-frontend.onrender.com
```
⚠️ Frontend URL'ni keyinroq o'zgartirasiz!

```
NAME: CORS_ORIGINS
VALUE: https://smartcareer-frontend.onrender.com
```
⚠️ Frontend URL'ni keyinroq o'zgartirasiz!

#### OAuth (Agar kerak bo'lsa):

```
NAME: GOOGLE_CLIENT_ID
VALUE: [Google Cloud Console'dan]
```

```
NAME: GOOGLE_CLIENT_SECRET
VALUE: [Google Cloud Console'dan]
```

```
NAME: GOOGLE_REDIRECT_URI
VALUE: https://smartcareer-backend.onrender.com/api/v1/auth/callback/google
```
⚠️ Service URL'ni o'zgartiring!

```
NAME: OAUTH_ENABLED
VALUE: true
```

#### Redis (Agar kerak bo'lsa):

```
NAME: REDIS_URL
VALUE: [Redis service'dan - keyinroq qo'shasiz]
```

5. **"Save Changes"** bosing

### Qadam 3.3: Deploy (Backend)

1. **"Manual Deploy"** → **"Deploy latest commit"** bosing
2. ⏳ 5-10 daqiqa kuting (build va deploy)
3. Logs'ni kuzatib turing:
   ```
   ✓ Installing dependencies...
   ✓ Running migrations...
   ✓ Starting service...
   ```
4. Service URL ni saqlang:
   ```
   https://smartcareer-backend.onrender.com
   ```

---

## 4. Frontend Static Site

### Qadam 4.1: Frontend Service Yaratish

1. Render Dashboard → **"+ New +"** → **"Static Site"**
2. GitHub repository'ni tanlang: `Bilolbee/smartcarier`
3. Sozlamalar:

```
Name: smartcareer-frontend
Branch: main (yoki master)
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: .next
```

4. **"Create Static Site"** bosing

### Qadam 4.2: Environment Variables (Frontend)

**Settings** → **"Environment"** tab → **"+ Add Environment Variable"**

```
NAME: NEXT_PUBLIC_API_URL
VALUE: https://smartcareer-backend.onrender.com
```
⚠️ Backend URL'ni o'zgartiring!

```
NAME: NEXT_PUBLIC_FRONTEND_URL
VALUE: https://smartcareer-frontend.onrender.com
```
⚠️ Frontend URL'ni o'zgartiring!

5. **"Save Changes"** bosing

### Qadam 4.3: Deploy (Frontend)

1. **"Manual Deploy"** → **"Deploy latest commit"** bosing
2. ⏳ 3-5 daqiqa kuting (build va deploy)
3. Frontend URL ni saqlang:
   ```
   https://smartcareer-frontend.onrender.com
   ```

---

## 5. Environment Variables - Qayta Sozlash

### Qadam 5.1: Backend Environment Variables ni Yangilash

Backend Service → **"Environment"** → Frontend URL'larni yangilang:

```
FRONTEND_URL = https://smartcareer-frontend.onrender.com
CORS_ORIGINS = https://smartcareer-frontend.onrender.com
```

**"Save Changes"** bosing va **"Manual Deploy"** qiling.

---

## 6. Deploy va Test

### Qadam 6.1: Backend Test

1. Backend Service → **"Logs"** tab
2. Quyidagilar ko'rinishi kerak:
   ```
   INFO:     Started server process
   INFO:     Uvicorn running on http://0.0.0.0:10000
   ```
3. Browser'da oching:
   ```
   https://smartcareer-backend.onrender.com/docs
   ```
   Swagger UI ochilishi kerak!

### Qadam 6.2: Frontend Test

1. Frontend Service → **"Logs"** tab
2. Browser'da oching:
   ```
   https://smartcareer-frontend.onrender.com
   ```
   Landing page ochilishi kerak!

### Qadam 6.3: To'liq Test

1. Frontend'da ro'yxatdan o'ting
2. Login qiling
3. Dashboard'ni tekshiring
4. API ishlayotganini tekshiring

---

## ✅ Checklist

- [ ] Render.com account ochildi
- [ ] PostgreSQL Database yaratildi
- [ ] Database URL saqlandi
- [ ] Backend Service yaratildi
- [ ] Backend Environment Variables qo'shildi
- [ ] Backend deploy qilindi
- [ ] Backend API ishlayapti (Swagger UI ochilmoqda)
- [ ] Frontend Service yaratildi
- [ ] Frontend Environment Variables qo'shildi
- [ ] Frontend deploy qilindi
- [ ] Frontend URL yangilandi (Backend'da)
- [ ] To'liq test o'tkazildi

---

## 🔧 Xatoliklar

### Xatolik 1: "Could not open requirements file"

**Yechim:** Root Directory = `backend` bo'lishi kerak va Build Command'da `requirements.txt` (backend/ emas)

### Xatolik 2: "Database connection failed"

**Yechim:** DATABASE_URL to'g'ri ekanligini tekshiring (Internal Database URL)

### Xatolik 3: "CORS error"

**Yechim:** Backend'da CORS_ORIGINS Frontend URL'ga teng bo'lishi kerak

### Xatolik 4: "npm: not found" (Frontend)

**Yechim:** Service Type = "Static Site" bo'lishi kerak (Web Service emas)

---

## 📊 Service URLs

Deploy'dan keyin quyidagi URL'lar olinadi:

```
Backend API: https://smartcareer-backend.onrender.com
Backend Docs: https://smartcareer-backend.onrender.com/docs
Frontend: https://smartcareer-frontend.onrender.com
Database: [Internal only]
```

---

## 🎉 Tayyor!

Loyiha Render.com'da deploy qilindi!

**Keyingi qadamlar:**
1. Custom domain qo'shing (ixtiyoriy)
2. SSL avtomatik yoqiladi
3. Monitoring sozlang
4. Backup sozlang

---

## 📞 Yordam

Agar muammo bo'lsa:
1. Logs'ni tekshiring
2. Environment Variables'ni tekshiring
3. Service Settings'ni tekshiring
4. GitHub repository'ni tekshiring

**Batafsil:** `RENDER_DEPLOYMENT.md`






