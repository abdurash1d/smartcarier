# 🔒 WEEK 1 - DAY 1: SECURITY CHECKLIST

**Date:** 2026-01-19  
**Priority:** 🔴 CRITICAL  
**Time:** 2-3 hours

---

## ✅ TASK CHECKLIST

### STEP 1: Check Git Status
```bash
# Check if .env is tracked
git ls-files | findstr "\.env"

# If found, proceed to STEP 2
# If not found, skip to STEP 3
```

**Status:** ⏳ In Progress

---

### STEP 2: Remove .env from Git History (IF TRACKED)

⚠️ **DANGER ZONE:** This rewrites Git history!

**Option A: Soft Remove (Recommended)**
```bash
# Stop tracking .env
git rm --cached backend/.env
git rm --cached frontend/.env

# Commit
git commit -m "Remove .env files from tracking"
git push
```

**Option B: Complete History Clean (If already pushed with keys)**
```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove .env from entire history
git filter-repo --path backend/.env --invert-paths
git filter-repo --path frontend/.env --invert-paths

# Force push (CAREFUL!)
git push origin --force --all
```

**Status:** ⬜ Not Started

---

### STEP 3: Create .env.example ✅

**Already Done!**
- ✅ `backend/.env.example` created
- Contains all required environment variables
- Safe to commit to Git

**Status:** ✅ Complete

---

### STEP 4: Rotate ALL API Keys 🔑

**Why?** If .env was in Git, keys are compromised!

#### OpenAI:
```
1. Go to: https://platform.openai.com/api-keys
2. Delete old key
3. Create new key
4. Copy to .env (NOT .env.example!)
```

**Status:** ⬜ Not Started

#### Google Gemini:
```
1. Go to: https://makersuite.google.com/app/apikey
2. Delete old key  
3. Create new key
4. Copy to .env
```

**Status:** ⬜ Not Started

#### Stripe:
```
1. Go to: https://dashboard.stripe.com/apikeys
2. Roll keys (Reveal > Roll key)
3. Copy new keys to .env
```

**Status:** ⬜ Not Started

---

### STEP 5: Generate New SECRET_KEY

```bash
# Run in terminal:
python -c "import secrets; print(secrets.token_hex(32))"

# Copy output to .env
# SECRET_KEY=<generated-value>
```

**Status:** ⬜ Not Started

---

### STEP 6: Verify .gitignore

**Check:**
```bash
# .gitignore should have:
.env
.env.*
!.env.example
```

**Status:** ✅ Complete (Already in .gitignore)

---

### STEP 7: Test Git Status

```bash
# Create/modify .env
echo "TEST=123" >> backend/.env

# Check git status
git status

# Should NOT show .env as changed
# If it shows .env → PROBLEM!
```

**Status:** ⬜ Not Started

---

### STEP 8: Commit Changes

```bash
git add backend/.env.example
git add .gitignore
git commit -m "Add .env.example template and security documentation"
git push
```

**Status:** ⬜ Not Started

---

## 🎯 SUCCESS CRITERIA

- [ ] .env NOT in git status
- [ ] .env.example committed
- [ ] All API keys rotated
- [ ] New SECRET_KEY generated
- [ ] Changes pushed to Git
- [ ] Local .env working

---

## ⏭️ NEXT STEPS (Tomorrow)

After completing Day 1:
- **Day 2:** Production environment setup
- **Day 3:** PostgreSQL migration
- **Day 4:** Email service setup
- **Day 5:** Deploy to production

---

## 📞 NEED HELP?

If stuck on any step, ask me:
- "How to rotate OpenAI key?"
- "How to generate SECRET_KEY?"
- "Git still shows .env, help!"

I'll guide you through! 💪

---

**START NOW! Mark tasks as you complete them! ✅**
