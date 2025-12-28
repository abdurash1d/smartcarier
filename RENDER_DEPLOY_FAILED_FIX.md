# 🔧 Render.com Deploy Failed - Yechimlar

## ❌ Xatolik

```
Deploy failed for 4e485f1
Exited with status 1 while building your code
```

## 🔍 Ehtimoliy Sabablar

1. **Python 3.13 muammosi** - `pydantic-core` build qilishda xatolik
2. **Build Command muammosi** - Path yoki command noto'g'ri
3. **Environment Variables** - Majburiy variables yo'q
4. **Database Connection** - DATABASE_URL noto'g'ri

---

## ✅ YECHIMLAR (Qadam-baqadam)

### 1. Logs'ni Tekshirish (MUHIM!)

1. Render Dashboard → **Backend Service** → **"Logs"** tab
2. Eng oxirgi deploy logs'ni ko'ring
3. Xatolikni toping va menga yuboring

**⚠️ Logs'ni ko'rish kerak - qaysi qadamda xatolik bor?**

---

### 2. Python Versiyasini O'zgartirish (MUHIM!)

Agar Python 3.13 ishlatilmoqda bo'lsa:

1. **Settings** → **"Python Version"**
2. Quyidagilardan birini yozing:
   ```
   3.11.0
   ```
   Yoki:
   ```
   3.12.0
   ```
3. **"Save Changes"** bosing
4. **"Manual Deploy"** qiling

---

### 3. Build Command ni Tekshirish

**Settings** → **"Build Command"** quyidagidek bo'lishi kerak:

```
pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt && alembic upgrade head
```

**⚠️ Eslatma:**
- Agar **Root Directory = `backend`** bo'lsa → `requirements.txt` (backend/ emas)
- Agar **Root Directory bo'sh** bo'lsa → `backend/requirements.txt`

---

### 4. Start Command ni Tekshirish

**Settings** → **"Start Command"** quyidagidek bo'lishi kerak:

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**⚠️ Eslatma:**
- Agar **Root Directory = `backend`** bo'lsa → `cd backend` kerak emas
- Agar **Root Directory bo'sh** bo'lsa → `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

### 5. Environment Variables ni Tekshirish

**Settings** → **"Environment"** tab → Quyidagilar **majburiy**:

```
DATABASE_URL = [PostgreSQL'dan Internal Database URL]
SECRET_KEY = [Random 32 character]
GEMINI_API_KEY = [Google Gemini API key]
AI_PROVIDER = gemini
DEBUG = false
```

**⚠️ Agar bu 5 tasi yo'q bo'lsa, service ishlamaydi!**

---

## 📋 Checklist

- [ ] Logs'ni tekshirildi va xatolik topildi
- [ ] Python versiyasi 3.11 yoki 3.12 ga o'zgartirildi
- [ ] Root Directory to'g'ri (`backend` yoki bo'sh)
- [ ] Build Command to'g'ri
- [ ] Start Command to'g'ri
- [ ] Environment Variables qo'shildi (5 ta minimal)
- [ ] Database yaratilgan va URL to'g'ri

---

## 🔍 Eng Keng Tarqalgan Xatoliklar

### Xatolik 1: "Failed building wheel for pydantic-core"

**Yechim:** Python versiyasini 3.11 yoki 3.12 ga o'zgartiring

---

### Xatolik 2: "Could not open requirements file"

**Yechim:** 
- Root Directory = `backend` bo'lsa → Build Command'da `requirements.txt` (backend/ emas)
- Root Directory bo'sh bo'lsa → Build Command'da `backend/requirements.txt`

---

### Xatolik 3: "Database connection failed"

**Yechim:** 
- DATABASE_URL to'g'ri ekanligini tekshiring
- PostgreSQL Database yaratilganligini tekshiring
- Internal Database URL ni ishlating (External emas)

---

### Xatolik 4: "Module not found"

**Yechim:**
- Root Directory to'g'ri ekanligini tekshiring
- Start Command'da `cd backend` kerakligini tekshiring

---

## 🎯 Tezkor Yechim

1. **Logs'ni ko'ring** va xatolikni menga yuboring
2. **Python versiyasini 3.11 ga o'zgartiring**
3. **Environment Variables ni tekshiring** (5 ta minimal)
4. **Qayta deploy qiling**

---

## 📞 Yordam

Agar muammo davom etsa:

1. **Logs'ni** to'liq copy qiling va yuboring
2. **Settings** screenshot'ini yuboring
3. **Environment Variables** ro'yxatini yuboring (parollarni yashiring)

Men aniq yechimni taklif qilaman!

---

## ✅ Xulosa

**Eng muhim:**
1. Logs'ni tekshiring
2. Python versiyasini 3.11 ga o'zgartiring
3. Environment Variables ni tekshiring
4. Qayta deploy qiling

**Logs'ni menga yuboring - aniq yechimni taklif qilaman!** 🔍



