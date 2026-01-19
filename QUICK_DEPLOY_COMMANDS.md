# ⚡ QUICK DEPLOY COMMANDS

**Copy-paste ready commands for deployment**

---

## 🔧 STEP 1: PREPARE

### Generate SECRET_KEY:
```powershell
cd C:\Users\user\Desktop\stratUP\backend
python -c "import secrets; print(secrets.token_hex(32))"
```
**→ Copy this output!**

---

### Push to GitHub:
```bash
cd C:\Users\user\Desktop\stratUP
git status
git add .
git commit -m "Production ready - Week 1 complete"
git push origin second
```

---

## 🚂 STEP 2: RAILWAY BACKEND

### Environment Variables to Add:

```bash
DEBUG=False
SECRET_KEY=paste-your-generated-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GEMINI_API_KEY=AIzaSyB0fOl77frnhsPzgpbsQ3Lly8oK22piSe8
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app
STRIPE_SECRET_KEY=sk_test_51ABC...
STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...
```

**Note:** DATABASE_URL is auto-provided by Railway

---

### Railway Settings:
- **Root Directory:** `backend`
- **Start Command:** 
  ```
  gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
  ```

---

### Test Backend:
```bash
# Replace with your Railway URL
https://your-app.railway.app/health
```

---

## ⚡ STEP 3: VERCEL FRONTEND

### Environment Variables to Add:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...
```

---

### Vercel Settings:
- **Framework:** Next.js
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

---

### Test Frontend:
```bash
# Visit your Vercel URL
https://your-app.vercel.app
```

---

## 🧪 STEP 4: TEST

### Quick Tests:
```bash
# Backend health
curl https://your-backend.railway.app/health

# API docs
https://your-backend.railway.app/docs

# Frontend
https://your-app.vercel.app
```

---

## ✅ DONE!

**Both deployed!** 🎉

---

## 🔄 FUTURE UPDATES

### To deploy updates:
```bash
cd C:\Users\user\Desktop\stratUP
git add .
git commit -m "Update feature"
git push origin second
# Auto-deploys to both Railway and Vercel!
```

---

**Simple!** 🚀
