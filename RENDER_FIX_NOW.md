# 🔧 Render.com Xatolikni Tuzatish - HOZIR

## ❌ Xatolik

```
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'backend/requirements.txt'
```

## 🔍 Muammo

Build Command `backend/requirements.txt` ni qidiryapti, lekin Root Directory sozlamasi noto'g'ri.

---

## ✅ YECHIM (2 Variant)

### Variant 1: Root Directory = `backend` (Tavsiya) ⭐

Agar **Root Directory** = `backend` bo'lsa:

**Build Command:**
```
pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt && alembic upgrade head
```

**Start Command:**
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**⚠️ Eslatma:** `cd backend` va `backend/requirements.txt` kerak emas!

---

### Variant 2: Root Directory Bo'sh

Agar **Root Directory** bo'sh bo'lsa:

**Build Command:**
```
pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r backend/requirements.txt && cd backend && alembic upgrade head
```

**Start Command:**
```
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## 🎯 Qaysi Variant Ishlatish?

### Tekshirish:

1. Render.com → Backend Service → **"Settings"**
2. **Root Directory** ni tekshiring:
   - Agar `backend` yozilgan bo'lsa → **Variant 1** ishlating
   - Agar bo'sh bo'lsa → **Variant 2** ishlating

---

## 📝 Qadam-baqadam Tuzatish

### 1. Settings ga Kiring

Render.com → Backend Service → **"Settings"** tab

### 2. Root Directory ni Tekshiring

**Root Directory** maydoniga qarang:
- Agar `backend` yozilgan bo'lsa → **Variant 1** ishlating
- Agar bo'sh bo'lsa → **Variant 2** ishlating

### 3. Build Command ni O'zgartiring

#### Variant 1 (Root Directory = `backend`):
```
pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt && alembic upgrade head
```

#### Variant 2 (Root Directory bo'sh):
```
pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r backend/requirements.txt && cd backend && alembic upgrade head
```

### 4. Start Command ni O'zgartiring

#### Variant 1 (Root Directory = `backend`):
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### Variant 2 (Root Directory bo'sh):
```
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 5. Save va Deploy

1. **"Save Changes"** bosing
2. **"Manual Deploy"** → **"Deploy latest commit"** bosing
3. Logs'ni kuzatib turing

---

## ✅ To'g'ri Sozlamalar (Tavsiya)

**Root Directory:** `backend`

**Build Command:**
```
pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt && alembic upgrade head
```

**Start Command:**
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## 🔍 Tekshirish

Deploy'dan keyin logs'da quyidagilar ko'rinishi kerak:

```
==> Installing Python version...
==> Installing dependencies...
==> Running migrations...
==> Starting service...
```

Agar xatolik bo'lsa, logs'ni tekshiring va xatolikni ko'ring.

---

## ✅ Xulosa

1. **Settings** → **Root Directory** ni tekshiring
2. **Build Command** ni yuqoridagidek o'zgartiring
3. **Start Command** ni yuqoridagidek o'zgartiring
4. **Save Changes** bosing
5. **Deploy** qiling

**Tavsiya:** Root Directory = `backend` qiling va Variant 1 ishlating - eng oson!



