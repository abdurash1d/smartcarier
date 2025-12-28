# 🔐 Render.com Environment Variables - Majburiy va Ixtiyoriy

## ✅ MAJBURIY (Shart!)

Bu variables **majburiy** - service ishlamaydi!

### 1. **DATABASE_URL** ⚠️ ENG MUHIM!
```
NAME: DATABASE_URL
VALUE: postgresql://user:password@host:5432/database
```
**Qayerdan:** PostgreSQL Database → **"Internal Database URL"**

**⚠️ Bu bo'lmasa:** Database ga ulanmaydi, service ishlamaydi!

---

### 2. **SECRET_KEY** ⚠️ MUHIM!
```
NAME: SECRET_KEY
VALUE: [Generate tugmasini bosing yoki random 32 char]
```
**⚠️ Bu bo'lmasa:** JWT token'lar ishlamaydi, login bo'lmaydi!

---

### 3. **GEMINI_API_KEY** (yoki OPENAI_API_KEY) ⚠️ MUHIM!
```
NAME: GEMINI_API_KEY
VALUE: your-gemini-api-key
```
**Qayerdan:** https://ai.google.dev/

**⚠️ Bu bo'lmasa:** AI features ishlamaydi (resume generation, job matching)

---

### 4. **AI_PROVIDER**
```
NAME: AI_PROVIDER
VALUE: gemini
```
**⚠️ Bu bo'lmasa:** Default `gemini` ishlatiladi, lekin yaxshiroq qo'yish kerak

---

### 5. **DEBUG**
```
NAME: DEBUG
VALUE: false
```
**⚠️ Bu bo'lmasa:** Default `True` bo'ladi (production'da xavfli!)

---

## ⚠️ Minimal (Boshlash uchun)

Agar hamma narsani qo'shishni xohlamasangiz, **faqat 5 tasi yetarli**:

```
1. DATABASE_URL (PostgreSQL'dan)
2. SECRET_KEY (Generate tugmasini bosing)
3. GEMINI_API_KEY
4. AI_PROVIDER = gemini
5. DEBUG = false
```

Bu 5 tasi bilan service **ishlaydi**! ✅

---

## 🔵 IXTIYORIY (Kerak bo'lsa)

Bu variables **ixtiyoriy** - service ishlaydi, lekin ba'zi features ishlamaydi.

### OAuth (Google) - Agar Google Login kerak bo'lsa:

```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
OAUTH_ENABLED=true
```

**⚠️ Bu bo'lmasa:** Google Login ishlamaydi, lekin oddiy login/register ishlaydi

---

### Frontend URL - Frontend deploy qilingandan keyin:

```
FRONTEND_URL
CORS_ORIGINS
```

**⚠️ Bu bo'lmasa:** Frontend'dan API'ga so'rov yuborishda CORS xatosi bo'lishi mumkin

---

### Email (SMTP) - Agar email yuborish kerak bo'lsa:

```
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
```

**⚠️ Bu bo'lmasa:** Email yuborilmaydi (welcome email, password reset)

---

### Payments (Stripe) - Agar payment kerak bo'lsa:

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

**⚠️ Bu bo'lmasa:** Payment features ishlamaydi

---

## 📊 Xulosa

### ✅ Majburiy (5 ta):
1. **DATABASE_URL** - Database ulanadi
2. **SECRET_KEY** - JWT token'lar ishlaydi
3. **GEMINI_API_KEY** - AI features ishlaydi
4. **AI_PROVIDER** - AI provider tanlanadi
5. **DEBUG** - Production mode

### 🔵 Ixtiyoriy (Keyinroq qo'shishingiz mumkin):
- OAuth (Google Login)
- Frontend URL (CORS)
- Email (SMTP)
- Payments (Stripe)

---

## 🎯 Tezkor Boshlash

**Minimal (5 ta) qo'shing:**
1. DATABASE_URL
2. SECRET_KEY (Generate)
3. GEMINI_API_KEY
4. AI_PROVIDER = gemini
5. DEBUG = false

**Keyinroq qo'shing:**
- OAuth (Google Login)
- Frontend URL
- Email
- Payments

---

## ✅ Xulosa

**Shartmi?** 

- ✅ **5 tasi shart** (DATABASE_URL, SECRET_KEY, GEMINI_API_KEY, AI_PROVIDER, DEBUG)
- 🔵 **Qolganlari ixtiyoriy** (keyinroq qo'shishingiz mumkin)

**Minimal 5 tasi bilan service ishlaydi!** 🚀



