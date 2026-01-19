# 🎯 Render.com - Keyingi Qadamlar

## ✅ Qadam 1: Database Tayyor!

Database yaratildi va tayyor:
- **Internal Database URL:** `postgresql://smartcareer_user:7XeuhL0rw0XJAtwsMwJElcJw5QiFPHC3@dpg-d56mbhshg0os73aptptg-a/smartcareer`

**⚠️ Bu URL'ni copy qiling - keyinroq kerak bo'ladi!**

---

## 📋 Qadam 2: Backend Service Yaratish

### 2.1: Service Yaratish

1. Render Dashboard → **"+ New +"** → **"Web Service"**
2. GitHub repository'ni ulang:
   - Repository: `Bilolbee/smartcarier`
   - Branch: `main` (yoki `master`)
3. Sozlamalar:

#### Basic Settings:
```
Name: smartcareer-backend
Region: Singapore (yoki yaqin)
Root Directory: backend
Runtime: Python 3
```

#### Build Command:
```
pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt && alembic upgrade head
```

#### Start Command:
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### Plan:
```
Plan: Free
```

4. **"Create Web Service"** bosing

---

### 2.2: Environment Variables Qo'shish

Service yaratilgandan keyin → **"Settings"** → **"Environment"** tab → **"+ Add Environment Variable"**

#### 1. DATABASE_URL (ENG MUHIM!)
```
NAME: DATABASE_URL
VALUE: postgresql://smartcareer_user:7XeuhL0rw0XJAtwsMwJElcJw5QiFPHC3@dpg-d56mbhshg0os73aptptg-a/smartcareer
```
⚠️ Bu URL'ni Connections tab'dan copy qiling!

#### 2. SECRET_KEY
```
NAME: SECRET_KEY
VALUE: [Generate tugmasini bosing yoki random 32 character yozing]
```
Masalan: `your-secret-key-32-characters-long`

#### 3. GEMINI_API_KEY
```
NAME: GEMINI_API_KEY
VALUE: [Google Gemini API key - https://ai.google.dev/]
```
⚠️ Agar yo'q bo'lsa, keyinroq qo'shishingiz mumkin (lekin AI features ishlamaydi)

#### 4. AI_PROVIDER
```
NAME: AI_PROVIDER
VALUE: gemini
```

#### 5. DEBUG
```
NAME: DEBUG
VALUE: false
```

5. **"Save Changes"** bosing

---

### 2.3: Deploy

1. **"Manual Deploy"** → **"Deploy latest commit"** bosing
2. ⏳ 5-10 daqiqa kuting
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
5. Browser'da test qiling:
   ```
   https://smartcareer-backend.onrender.com/docs
   ```
   Swagger UI ochilishi kerak! ✅

---

## 📋 Qadam 3: Frontend Static Site Yaratish

### 3.1: Service Yaratish

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

---

### 3.2: Environment Variables Qo'shish

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

**"Save Changes"** bosing

---

### 3.3: Deploy

1. **"Manual Deploy"** → **"Deploy latest commit"** bosing
2. ⏳ 3-5 daqiqa kuting
3. Browser'da test qiling:
   ```
   https://smartcareer-frontend.onrender.com
   ```
   Landing page ochilishi kerak! ✅

---

## 📋 Qadam 4: Backend Environment Variables ni Yangilash

Frontend deploy qilingandan keyin, Backend'da Frontend URL'larni yangilang:

Backend Service → **"Environment"** → Quyidagilarni qo'shing:

```
NAME: FRONTEND_URL
VALUE: https://smartcareer-frontend.onrender.com
```

```
NAME: CORS_ORIGINS
VALUE: https://smartcareer-frontend.onrender.com
```

**"Save Changes"** bosing va **"Manual Deploy"** qiling.

---

## ✅ Checklist

- [x] PostgreSQL Database yaratildi
- [x] Database URL saqlandi
- [ ] Backend Service yaratildi
- [ ] Backend Environment Variables qo'shildi (5 ta)
- [ ] Backend deploy qilindi
- [ ] Backend API ishlayapti (Swagger UI ochilmoqda)
- [ ] Frontend Service yaratildi
- [ ] Frontend Environment Variables qo'shildi
- [ ] Frontend deploy qilindi
- [ ] Frontend URL yangilandi (Backend'da)
- [ ] To'liq test o'tkazildi

---

## 🎯 Hozirgi Vazifa

**Qadam 2: Backend Service Yaratish**

1. Dashboard → "+ New +" → "Web Service"
2. GitHub repo'ni ulang
3. Sozlamalarni to'ldiring (yuqorida ko'rsatilgan)
4. Environment Variables qo'shing (5 ta)
5. Deploy qiling

---

## 🔧 Xatoliklar

### Xatolik: "Could not open requirements file"
**Yechim:** Root Directory = `backend` bo'lishi kerak va Build Command'da `requirements.txt` (backend/ emas)

### Xatolik: "Database connection failed"
**Yechim:** DATABASE_URL to'g'ri ekanligini tekshiring (Internal Database URL)

### Xatolik: "CORS error"
**Yechim:** Backend'da CORS_ORIGINS Frontend URL'ga teng bo'lishi kerak

---

## 📞 Yordam

Agar muammo bo'lsa:
1. Logs'ni tekshiring
2. Environment Variables'ni tekshiring
3. Service Settings'ni tekshiring

**Batafsil:** `RENDER_DEPLOY_FROM_ZERO.md`






