# Authentication Flow Testing Guide

**Status:** Implementation Complete  
**Date:** May 30, 2026  
**Focus:** Validation of Login → Setup → Dashboard flow

---

## 🎯 Test Objectives

Validate the complete authentication journey:
1. ✅ Phone OTP login
2. ✅ OTP verification
3. ✅ First-time setup (onboarding)
4. ✅ Session persistence (page refresh)
5. ✅ Protected routes (automatic redirects)
6. ✅ Logout flow
7. ✅ Returning user auto-redirect

---

## 📋 Prerequisites

Before testing, ensure:
- ✅ Supabase project created
- ✅ `.env.local` has correct API keys:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
  ```
- ✅ SQL migration executed (all 6 tables created)
- ✅ Phone auth enabled in Supabase
- ✅ SMS provider configured (Twilio or Supabase SMS)
- ✅ Dev server running: `npm run dev`

---

## 🧪 TEST SCENARIOS

### Test 1: New User Registration → Setup Flow

**Steps:**
1. Open http://localhost:3000 in browser
2. Should redirect to /login (no session)
3. Enter phone number: `9876543210`
4. Click "Continue"
5. Should show OTP input screen
6. Check phone/email for OTP code (test SMS)
7. Enter OTP code
8. Click "Verify & Login"

**Expected Results:**
- ✅ OTP sent successfully (check phone/console)
- ✅ Auto-redirects to /setup after verification
- ✅ Setup page loads with "What's your shop's name?" prompt
- ✅ No errors in browser console

---

### Test 2: Complete Shop Setup

**From Test 1 results, continue:**

1. **Step 1 - Enter Shop Name:**
   - Type: "Rajesh Tea Shop"
   - Click "Continue"
   - Should show business type selection

2. **Step 2 - Select Business Type:**
   - Click "Tea Shop" card
   - Should highlight with checkmark
   - Click "Complete Setup"
   - Should show loading spinner

3. **Verify Results:**
   - ✅ Loading spinner shows briefly
   - ✅ Toast notification: "Shop setup complete!"
   - ✅ Auto-redirects to /dashboard
   - ✅ Dashboard loads with data

---

### Test 3: Session Persistence

**From Test 2 results, user now in /dashboard:**

1. **Page Refresh:**
   - Press F5 to refresh page
   - Should NOT redirect to login
   - Dashboard should stay loaded
   - User data should be preserved

2. **Open New Tab:**
   - Open new browser tab
   - Navigate to http://localhost:3000
   - Should go to /dashboard (not /login)
   - Session automatically restored

3. **Close & Reopen Browser:**
   - Close browser completely
   - Reopen and go to http://localhost:3000
   - Should still be logged in
   - Session restored from secure cookie

**Expected Results:**
- ✅ No redirect to /login on page refresh
- ✅ New tabs automatically logged in
- ✅ Session persists across browser restarts
- ✅ JWT token in secure httpOnly cookie (DevTools → Application)

---

### Test 4: Protected Routes

**From logged-in /dashboard:**

1. **Try Accessing /login Directly:**
   - Type in URL: http://localhost:3000/login
   - Should auto-redirect to /dashboard
   - Not show login page

2. **Try Accessing /setup Directly:**
   - Type in URL: http://localhost:3000/setup
   - Should redirect to /dashboard
   - Not show setup page

3. **Try Accessing /dashboard/settings:**
   - Navigate to settings page
   - Should load normally (protected by middleware)
   - Show settings UI

**Expected Results:**
- ✅ /login redirects to /dashboard when authenticated
- ✅ /setup redirects to /dashboard when authenticated  
- ✅ /dashboard accessible normally
- ✅ All protected routes work

---

### Test 5: Logout Flow

**From /dashboard:**

1. **Navigate to Settings:**
   - Click "More" in bottom nav
   - Should open settings page

2. **Click Logout Button:**
   - Scroll to bottom
   - Click "Logout" button
   - Should show loading spinner

3. **Verify Results:**
   - ✅ Loading spinner appears briefly
   - ✅ Auto-redirects to /login
   - ✅ Session cleared
   - ✅ New login required

---

### Test 6: Returning User Auto-Redirect

**After logout, test returning user flow:**

1. **Log in again with same phone:**
   - Enter phone: `9876543210`
   - Verify OTP
   - Should auto-redirect to /dashboard
   - NOT show setup page (shop_name already exists)

2. **Verify Results:**
   - ✅ Setup skipped automatically
   - ✅ Goes directly to dashboard
   - ✅ Previous shop name displayed
   - ✅ No data loss

---

### Test 7: Error Handling

**Test various error scenarios:**

1. **Invalid Phone Number:**
   - Try entering: `123` (too short)
   - Click "Continue"
   - Should show error: "Please enter a 10-digit phone number"

2. **Invalid OTP:**
   - After sending OTP, enter: `1234` (wrong code)
   - Click "Verify & Login"
   - Should show error: "Invalid OTP" or similar
   - Stay on OTP screen

3. **Network Error (Simulate):**
   - Open DevTools
   - Go to Network tab
   - Throttle to "Offline"
   - Try to log in
   - Should show meaningful error message

4. **Timeout:**
   - Start OTP flow
   - Wait 10+ minutes before entering OTP
   - Try to verify
   - Should show error about OTP expiry

**Expected Results:**
- ✅ Clear error messages for each scenario
- ✅ User stays on same page (not crashed)
- ✅ Can retry after error
- ✅ No console errors logged

---

### Test 8: Mobile Responsiveness

**Test on mobile device or DevTools device mode:**

1. **iPhone 12 Pro (390px):**
   - Login form fits screen
   - No horizontal scroll
   - Buttons easily tappable
   - All text readable

2. **Pixel 5 (393px):**
   - Setup page fully responsive
   - Business type cards stack properly
   - All buttons accessible
   - Form inputs large enough

3. **Tablet (800px+):**
   - UI centered and not stretched
   - Max-width maintained
   - Proper spacing

**Expected Results:**
- ✅ No layout breaks on mobile
- ✅ Touch-friendly button sizes
- ✅ Text readable without zoom
- ✅ Forms usable on small screens

---

## 🔍 Browser Console Checks

During each test, verify the browser console:

```javascript
// Should see these messages (helpful for debugging)

// On page load:
// "[Auth] Checking session..." or similar

// On successful login:
// "[Auth] Session created successfully"

// On page refresh:
// "[Auth] Session restored from cookie"

// On logout:
// "[Auth] Session cleared"

// NO ERROR messages like:
// ❌ "Unexpected token" (parse error)
// ❌ "Cannot read property" (null reference)
// ❌ "CORS" errors
// ❌ "Failed to fetch" (unless expected)
```

---

## 🧮 Supabase Verification

After testing, verify data in Supabase:

1. **Check `auth.users` table:**
   - Go to Supabase Dashboard
   - Authentication → Users
   - Should see test user with phone number
   - Verify phone matches what you used

2. **Check `profiles` table:**
   - Go to Supabase → Database → profiles
   - Should see row for your user
   - Fields:
     - `id`: UUID (matches auth user)
     - `phone`: your test phone
     - `shop_name`: "Rajesh Tea Shop"
     - `language`: "en"
     - `theme`: "dark"

3. **Check `shops` table:**
   - Go to Supabase → Database → shops
   - Should see row for your shop
   - Fields:
     - `user_id`: UUID (matches your profile)
     - `shop_name`: "Rajesh Tea Shop"
     - `phone`: your test phone

4. **Verify RLS Policy:**
   - Try querying other user's data (in SQL editor)
   - Should return 0 rows (RLS blocking)
   - Example:
     ```sql
     SELECT * FROM profiles WHERE id != auth.uid();
     ```

---

## ✅ Checklist for Complete Testing

### Authentication Flow
- [ ] New user can send OTP
- [ ] OTP verified successfully
- [ ] First-time user redirected to setup
- [ ] Setup completed successfully
- [ ] Dashboard loads after setup

### Session Management
- [ ] Page refresh keeps session active
- [ ] New tabs logged in automatically
- [ ] Browser restart keeps session
- [ ] JWT token in secure cookie
- [ ] Logout clears session

### Route Protection
- [ ] Unauthenticated users can't access /dashboard
- [ ] Unauthenticated users redirected to /login
- [ ] Authenticated users can't access /login
- [ ] Authenticated users auto-redirect from /setup
- [ ] /settings accessible when logged in

### Returning Users
- [ ] Setup skipped if shop_name exists
- [ ] Dashboard shown immediately
- [ ] Previous data preserved
- [ ] No duplicate shops created

### Error Handling
- [ ] Invalid phone shows error
- [ ] Invalid OTP shows error
- [ ] Network errors handled gracefully
- [ ] Error messages helpful and clear
- [ ] No uncaught console errors

### Data Persistence
- [ ] User exists in `auth.users`
- [ ] Profile created in `profiles` table
- [ ] Shop created in `shops` table
- [ ] RLS policies working
- [ ] User data isolated

### UI/UX
- [ ] Design matches current system
- [ ] Animations smooth
- [ ] Loading states show spinners
- [ ] Toast notifications appear
- [ ] Mobile responsive

### Cross-browser (Optional)
- [ ] Chrome/Edge: ✅
- [ ] Firefox: ✅
- [ ] Safari: ✅
- [ ] Mobile Safari: ✅

---

## 🐛 Debugging Tips

**If something breaks:**

1. **Check browser console:**
   - Copy exact error message
   - Search in code for that message
   - Check network tab for failed requests

2. **Check Supabase logs:**
   - Go to Supabase Dashboard
   - Logs section
   - Look for API errors

3. **Check environment variables:**
   - Verify `.env.local` exists
   - Verify values are correct
   - Restart dev server after changing

4. **Check auth state:**
   - In browser console:
     ```javascript
     import { supabase } from '@/lib/supabase/client';
     const session = await supabase.auth.getSession();
     console.log(session);
     ```

5. **Clear cache:**
   - Clear localStorage: `localStorage.clear()`
   - Clear cookies in DevTools
   - Hard refresh: `Ctrl+Shift+R`

---

## 📝 Test Results Template

Use this template to document your test results:

```
Date: [DATE]
Tester: [NAME]
Build: [npm run build result]

TEST 1: New User Registration
Status: ✅ PASS / ❌ FAIL
Notes: [Any issues]

TEST 2: Shop Setup
Status: ✅ PASS / ❌ FAIL
Notes: [Any issues]

TEST 3: Session Persistence
Status: ✅ PASS / ❌ FAIL
Notes: [Any issues]

TEST 4: Protected Routes
Status: ✅ PASS / ❌ FAIL
Notes: [Any issues]

TEST 5: Logout Flow
Status: ✅ PASS / ❌ FAIL
Notes: [Any issues]

TEST 6: Returning User
Status: ✅ PASS / ❌ FAIL
Notes: [Any issues]

TEST 7: Error Handling
Status: ✅ PASS / ❌ FAIL
Notes: [Any issues]

TEST 8: Mobile Responsive
Status: ✅ PASS / ❌ FAIL
Notes: [Any issues]

OVERALL RESULT: ✅ READY / ❌ ISSUES FOUND

Blocking issues: [List any]
Nice-to-have fixes: [List any]
```

---

## 🚀 Success Criteria

All tests pass when:
- ✅ New users can complete full registration → setup → dashboard
- ✅ Sessions persist across refreshes and browser restarts
- ✅ Protected routes work (auto-redirects)
- ✅ Logout clears session and returns to login
- ✅ Returning users skip setup
- ✅ Error messages are helpful
- ✅ No console errors
- ✅ Mobile UI responsive
- ✅ All Supabase data created correctly
- ✅ RLS policies enforcing data isolation

---

## 🎉 Next Steps After Passing

Once all tests pass:
1. ✅ Authentication flow is production-ready
2. ⏳ Proceed to Sales module migration
3. ⏳ Repeat for Expenses module
4. ⏳ Repeat for Due module
5. ⏳ Enable real-time updates
6. ⏳ Final QA and launch

---

**Last Updated:** May 30, 2026  
**Prepared for:** Authentication Validation Phase  
**Priority:** CRITICAL - Must pass before module migration
