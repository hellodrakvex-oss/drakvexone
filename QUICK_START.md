# ⚡ Quick Start - Get Testing in 30 Minutes

**Objective:** Set up and start testing authentication flow  
**Time Estimate:** 30 minutes  
**Status:** All code ready, just need Supabase setup

---

## 🏃 Quick Setup (Copy-Paste Ready)

### 1. Create Supabase Project (10 min)

1. Go to **supabase.com** → Sign up/Login
2. Click "New Project"
3. **Project Name:** `drakvex-one`
4. **Database Password:** Create strong password
5. **Region:** Choose closest to you
6. Click "Create New Project" (wait 2-3 minutes)
7. Go to **Settings → API**
8. Copy these values:
   ```
   Project URL: https://xxx-xxx-supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIs...
   ```

### 2. Create `.env.local` (2 min)

1. Open Explorer: `D:\Drakvex One`
2. Right-click → New → Text Document
3. Name it: `.env.local` (with the dot)
4. Edit and paste:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx-xxx-supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```
5. Replace `xxx` values with yours from Step 1
6. Save

### 3. Run SQL Migration (5 min)

1. Go back to Supabase Dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Open file: `D:\Drakvex One\migrations\001_init_schema.sql`
5. Copy ALL content
6. Paste into Supabase SQL Editor
7. Click **"Run"** button
8. ✅ You should see 6 tables created (check Database → Tables)

### 4. Enable SMS (5 min)

1. In Supabase, go **Authentication → Providers**
2. Click **"Phone"**
3. Turn on toggle: **"Enable Phone Auth"**
4. For testing, check: **"Allow free phone confirmations during development"**
5. For production SMS:
   - Select provider: Twilio (recommended)
   - Add Account SID + Auth Token from Twilio
   - (Can skip for testing with dev mode enabled)

### 5. Restart Dev Server (1 min)

1. In terminal/PowerShell:
   ```bash
   cd "d:\Drakvex One"
   npm run dev
   ```
2. Wait for "Ready in Xs" message
3. Open browser: **http://localhost:3000**

✅ **Setup Complete!**

---

## 🧪 Quick Test (10 min)

### Test 1: New User Registration (5 min)

1. Browser shows "Enter your phone number"
2. Enter: `9876543210`
3. Click "Continue"
4. Shows "Enter OTP code"
5. Check your phone/email for OTP code ⚠️ (in dev mode, check Supabase logs)
6. Enter OTP (4 digits)
7. Click "Verify & Login"

**Expected:** Redirects to "What's your shop's name?"

### Test 2: Complete Setup (3 min)

1. Type shop name: `My Tea Shop`
2. Click "Continue"
3. Select "Tea Shop" or any option
4. Click "Complete Setup"
5. **Wait for redirect to dashboard**

**Expected:** Dashboard loads with "My Tea Shop" data

### Test 3: Page Refresh (1 min)

1. Press F5 (refresh page)
2. Dashboard should stay (not redirect to login)

**Expected:** Still logged in

### Test 4: Logout (1 min)

1. Click "More" button (bottom nav)
2. Scroll to bottom
3. Click "Logout"
4. Should redirect to login page

**Expected:** Back at phone number entry

---

## 🔍 If Something Goes Wrong

### "OTP not received"
- Check Supabase SQL Editor → Logs tab
- Should see OTP code there
- Copy and use it

### "Page keeps redirecting to login"
- Check browser DevTools → Console
- Should see no red errors
- Restart dev server

### ".env.local not working"
- Restart dev server after saving
- Check `.env.local` is in `D:\Drakvex One` (root folder)
- Make sure format is correct: `NEXT_PUBLIC_SUPABASE_URL=...`

### Build errors
- Press Ctrl+C to stop dev server
- Delete `.next` folder
- Run: `npm install`
- Run: `npm run dev`

---

## ✅ Success Checklist

- [x] Supabase project created
- [x] `.env.local` created with correct values
- [x] SQL migration executed (6 tables visible)
- [x] SMS enabled
- [x] Dev server running
- [x] Can see login page
- [x] Can enter phone number
- [x] Can verify OTP
- [x] Can complete setup
- [x] Can access dashboard
- [x] Page refresh keeps you logged in
- [x] Logout works

---

## 📚 Full Documentation

After quick test, review:
- **[AUTH_TESTING_GUIDE.md](AUTH_TESTING_GUIDE.md)** - 8 detailed test scenarios
- **[AUTH_IMPLEMENTATION_COMPLETE.md](AUTH_IMPLEMENTATION_COMPLETE.md)** - Full documentation
- **[SESSION_COMPLETION_REPORT.md](SESSION_COMPLETION_REPORT.md)** - What was built

---

## 🎯 Next After Testing

1. **All tests pass?** → Ready for module migration
2. **Tests fail?** → Check DEBUG section above or read full guides
3. **Questions?** → Check `AUTH_TESTING_GUIDE.md` debugging tips

---

**Status:** Ready to go! 🚀
