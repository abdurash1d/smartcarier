# 🐍 Render.com - Python Versiyasini O'zgartirish

## 📍 Qayerda O'zgartirish

### Qadam 1: Backend Service ga Kiring

1. **Render Dashboard** ga kiring: https://dashboard.render.com
2. **Backend Service** ni toping va bosing
   - Service nomi: `smartcareer-backend` (yoki siz yaratgan nom)

### Qadam 2: Settings Tab ga Kiring

1. Service ochilgandan keyin, **yuqoridagi menu** dan **"Settings"** tab'ini bosing
   - Menu: `Overview | Logs | Metrics | Settings | Environment | Events`

### Qadam 3: Python Version ni Toping

**Settings** sahifasida quyidagi bo'limlarni ko'rasiz:

```
Service Details
├── Name
├── Region
├── Branch
├── Root Directory
├── Runtime
├── Python Version  ← BU YERDA!
├── Build Command
├── Start Command
└── ...
```

**"Python Version"** maydoni **"Runtime"** dan keyin joylashgan.

### Qadam 4: Python Versiyasini O'zgartiring

1. **"Python Version"** maydoniga bosing
2. Mavjud versiyani o'chiring (agar bor bo'lsa)
3. Quyidagilardan birini yozing:

```
3.11.0
```

Yoki:

```
3.12.0
```

**⚠️ Tavsiya:** `3.11.0` ishlating - eng barqaror!

### Qadam 5: Save va Deploy

1. **"Save Changes"** tugmasini bosing (sahifaning pastki qismida)
2. ⏳ Bir necha soniya kuting (sozlamalar saqlanmoqda)
3. **"Manual Deploy"** tugmasini bosing (yuqoridagi menu'da)
4. **"Deploy latest commit"** ni tanlang
5. ⏳ 5-10 daqiqa kuting (build va deploy)

---

## 📸 Screenshot Yo'riqnomasi

```
Render Dashboard
└── Backend Service (smartcareer-backend)
    └── Settings Tab
        └── Python Version: [3.11.0]  ← BU YERDA!
```

---

## ✅ Tekshirish

Deploy'dan keyin:

1. **"Logs"** tab'ga kiring
2. Quyidagilar ko'rinishi kerak:
   ```
   Installing Python version 3.11.0...
   ✓ Python 3.11.0 installed
   ```

---

## 🔍 Agar "Python Version" Maydoni Ko'rinmasa

Agar **"Python Version"** maydoni ko'rinmasa:

1. **"Runtime"** maydonini tekshiring
2. Agar **"Python 3"** yozilgan bo'lsa → to'g'ri
3. Agar **"Docker"** yozilgan bo'lsa → Service Type'ni o'zgartirish kerak

**Service Type'ni o'zgartirish:**

1. **"Settings"** → **"Service Details"** bo'limida
2. **"Runtime"** maydonini toping
3. Agar **"Docker"** bo'lsa → Service'ni o'chirib, yangi **"Web Service"** yarating

---

## ⚠️ Muhim Eslatmalar

1. **Python versiyasini o'zgartirgandan keyin** → **"Save Changes"** bosing
2. **"Manual Deploy"** qiling - avtomatik deploy bo'lmaydi
3. **Build vaqtida** → Python 3.11 yoki 3.12 o'rnatiladi
4. **Wheel'lar** → Endi topilishi kerak!

---

## 🎯 Qisqa Yo'riqnoma

1. **Render Dashboard** → **Backend Service**
2. **"Settings"** tab
3. **"Python Version"** maydoni
4. `3.11.0` yozing
5. **"Save Changes"**
6. **"Manual Deploy"** → **"Deploy latest commit"**

---

## ✅ Xulosa

**Python versiyasini o'zgartirish:**
- **Qayerda:** Backend Service → Settings → Python Version
- **Nima yozish:** `3.11.0` yoki `3.12.0`
- **Keyin:** Save Changes → Manual Deploy

**Tayyor!** 🚀






