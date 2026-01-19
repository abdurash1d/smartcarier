# 📍 Render.com Deployment - Hozirgi Holat

## ✅ Nima Qilingan

1. ✅ GitHub repository tayyor
2. ✅ Render.com account yaratildi
3. ✅ Backend service yaratilgan (`smartcarier-2`)
4. ✅ Python 3 tanlangan
5. ✅ Build va Start Command'lar sozlangan

---

## ⚠️ Qolgan Ishlar

### 1. Root Directory va Build Command'ni To'g'rilash

**Settings** → **Root Directory** va **Build Command** ni tekshiring:

#### Agar Root Directory = `backend` bo'lsa:

**Build Command:**
```
pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt && alembic upgrade head
```

**Start Command:**
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### Agar Root Directory bo'sh bo'lsa:

**Build Command:**
```
pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r backend/requirements.txt && cd backend && alembic upgrade head
```

**Start Command:**
```
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

### 2. PostgreSQL Database Yaratish

1. Render Dashboard → **"New +"** → **"PostgreSQL"**
2. Sozlamalar:
   - **Name**: `smartcareer-db`
   - **Database**: `smartcareer`
   - **User**: `smartcareer_user`
   - **Region**: Backend bilan bir xil
   - **Plan**: Free (test) yoki Starter ($7/oy)
3. **"Create Database"** bosing
4. **Internal Database URL** ni copy qiling

---

### 3. Environment Variables Qo'shish

Backend service → **"Environment"** tab'ga boring va quyidagilarni qo'shing:

#### Majburiy:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SECRET_KEY=[Generate tugmasini bosing]
GEMINI_API_KEY=your-gemini-key
AI_PROVIDER=gemini
DEBUG=false
```

#### OAuth (Agar kerak bo'lsa):

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=https://smartcarier-2.onrender.com/api/v1/auth/callback/google
OAUTH_ENABLED=true
```

#### Keyinroq (Frontend deploy'dan keyin):

```env
FRONTEND_URL=https://your-frontend.onrender.com
CORS_ORIGINS=https://your-frontend.onrender.com
```

---

### 4. Deploy Qilish

1. **Settings** ni to'g'rilang
2. **Environment Variables** ni qo'shing
3. **"Manual Deploy"** → **"Deploy latest commit"** bosing
4. Logs'ni kuzatib turing

---

### 5. Frontend Service Yaratish

1. **"New +"** → **"Static Site"**
2. Repository'ni tanlang
3. Sozlamalar:
   - **Name**: `smartcareer-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `.next`
4. **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://smartcarier-2.onrender.com/api/v1
   NEXT_PUBLIC_FRONTEND_URL=https://smartcareer-frontend.onrender.com
   ```
5. **"Create Static Site"** bosing

---

## 🎯 Keyingi Qadamlar

1. ✅ **Root Directory** va **Build Command** ni to'g'rilash
2. ✅ **PostgreSQL Database** yaratish
3. ✅ **Environment Variables** qo'shish
4. ✅ **Deploy** qilish va test qilish
5. ✅ **Frontend** deploy qilish

---

## 📝 Tezkor Checklist

- [ ] Root Directory to'g'ri (`backend` yoki bo'sh)
- [ ] Build Command to'g'ri (yuqoridagidek)
- [ ] Start Command to'g'ri (yuqoridagidek)
- [ ] PostgreSQL Database yaratildi
- [ ] DATABASE_URL qo'shildi
- [ ] SECRET_KEY qo'shildi (Generate tugmasini bosing)
- [ ] GEMINI_API_KEY qo'shildi
- [ ] Deploy muvaffaqiyatli
- [ ] Health check ishlayapti: https://smartcarier-2.onrender.com/health
- [ ] Frontend service yaratildi

---

## ✅ Xulosa

Render.com'da:
1. ✅ Backend service yaratilgan
2. ⚠️ Root Directory va Build Command'ni to'g'rilash kerak
3. ⚠️ PostgreSQL Database yaratish kerak
4. ⚠️ Environment Variables qo'shish kerak
5. ⚠️ Deploy qilish kerak
6. ⚠️ Frontend deploy qilish kerak

**Davom etamiz!** 🚀






