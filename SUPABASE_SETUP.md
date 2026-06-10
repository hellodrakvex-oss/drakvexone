# Supabase Setup Guide - Drakvex One

Complete step-by-step guide to set up Supabase backend for Drakvex One.

---

## Prerequisites

- Supabase account (free at supabase.com)
- Node.js 18+ installed
- Drakvex One repository cloned

---

## Step 1: Create Supabase Project

### 1.1 Sign up / Log in to Supabase
- Go to https://supabase.com
- Create account or log in

### 1.2 Create New Project
- Click "New Project"
- Choose a name: `drakvex-one` or similar
- Choose a strong database password (save this!)
- **Region:** Select closest to India (Singapore or Tokyo recommended)
- Click "Create new project"
- Wait 2-3 minutes for initialization

---

## Step 2: Get API Keys

### 2.1 Navigate to API Settings
- In Supabase dashboard, click **Settings** (bottom left)
- Click **API** tab
- You'll see:
  - **Project URL** → Copy this to `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → Copy to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.2 Create `.env.local` File
In project root (`d:\Drakvex One\`), create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual values from Step 2.1

---

## Step 3: Set Up Database Schema

### 3.1 Run SQL Migration
- In Supabase dashboard, go to **SQL Editor**
- Click **New Query**
- Copy entire content from `migrations/001_init_schema.sql`
- Paste into SQL editor
- Click **Run** (play button)
- Wait for completion - should say "Success"

### 3.2 Verify Tables Created
- Go to **Database** → **Tables**
- Verify these tables exist:
  - `profiles` ✓
  - `shops` ✓
  - `sales` ✓
  - `expenses` ✓
  - `customer_dues` ✓
  - `settings` ✓

### 3.3 Verify RLS Policies
- Click each table → **RLS** tab
- Verify RLS is **Enabled** for all tables
- Click **Policies** - should see 3-4 policies per table

---

## Step 4: Configure Authentication

### 4.1 Enable Phone Auth
- Go to **Authentication** (left sidebar)
- Click **Providers**
- Find **Phone** - click **Enable**
- Configure SMS provider:
  - **Option 1 (Free):** Supabase SMS (limited credits)
  - **Option 2 (Recommended):** Twilio
    - Sign up at https://twilio.com
    - Get Account SID + Auth Token
    - Paste into Supabase phone config

### 4.2 Set OTP Message Template (Optional)
- In Supabase **Authentication** → **Templates**
- Customize the OTP message if desired

### 4.3 Configure Redirect URLs
- Go to **Authentication** → **URL Configuration**
- Add allowed URLs:
  - Localhost: `http://localhost:3000`
  - Production: `https://your-production-domain.com`

---

## Step 5: Create Admin User (Testing)

### 5.1 Manual User Creation (If SMS Not Configured Yet)
- Go to **Authentication** → **Users**
- Click **Add User** (for testing only)
- Phone: `+919876543210` (any test number)
- Set password: any temporary password
- Email: optional
- Click **Create user**

### 5.2 Test Phone OTP Flow
- Once SMS is configured, test actual OTP flow:
  1. Open app at http://localhost:3000
  2. Go to /login
  3. Enter phone: `9876543210`
  4. Check SMS for OTP code
  5. Enter OTP
  6. Should redirect to /setup

---

## Step 6: Local Development Setup

### 6.1 Install Dependencies
```bash
cd "d:\Drakvex One"
npm install
```

### 6.2 Start Dev Server
```bash
npm run dev
```

Server runs at http://localhost:3000

### 6.3 Test Authentication
- Navigate to http://localhost:3000/login
- You should be redirected to login (no active session)
- Enter test phone number
- Complete OTP flow
- Should redirect to /setup

### 6.4 Test Database Connection
- After login, go to /dashboard
- Try creating a sale
- Check Supabase Dashboard → **sales** table
- New record should appear with `user_id` = your user ID

---

## Step 7: Verify Security (RLS)

### 7.1 Test RLS Isolation
- Create sale in browser as User A
- Go to Supabase → **sales** table
- Verify only sales with `user_id = User_A_ID` are visible

### 7.2 Test Unauthorized Access (SQL)
- In SQL Editor, try:
```sql
SELECT * FROM sales WHERE user_id != auth.uid();
```
- Should return 0 rows (RLS blocks it)

This proves RLS is working correctly.

---

## Step 8: Production Deployment

### 8.1 Deploy to Vercel
- Push code to GitHub
- Connect to Vercel
- Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Deploy!

### 8.2 Update Supabase URL Config
- Go to Supabase → **Authentication** → **URL Configuration**
- Add production domain:
  - `https://your-app.vercel.app`

### 8.3 Enable HTTPS
- Vercel auto-enables HTTPS
- Verify: https://your-app.vercel.app

### 8.4 Setup SMS Provider for Production
- Configure Twilio or other SMS service in Supabase
- Ensure OTP messages work on production domain

---

## Troubleshooting

### "Missing Supabase environment variables"
- ✓ Check `.env.local` exists
- ✓ Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- ✓ Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- ✓ Restart dev server after creating `.env.local`

### "OTP not sent to phone"
- ✓ Phone provider not configured - set up Twilio
- ✓ Phone number format wrong - use `+91XXXXXXXXXX`
- ✓ Check Supabase logs for SMS errors

### "RLS policy blocks my query"
- ✓ Verify user is authenticated
- ✓ Verify `user_id` in table matches `auth.uid()`
- ✓ Check RLS policy SQL syntax

### "User created but no profile"
- ✓ Profile should auto-create in `verifyPhoneOTP`
- ✓ Check auth-context.tsx for errors
- ✓ Verify profiles table has RLS insert policy

---

## Next Steps After Setup

1. ✓ Database schema created
2. ✓ Authentication working
3. ✓ RLS policies verified
4. **→ Migrate Sales module to use Supabase** (see BACKEND_ARCHITECTURE.md)
5. Migrate Expenses module
6. Migrate Customer Dues module
7. Add realtime updates
8. Performance testing
9. Production launch

---

## Security Checklist

- [x] RLS enabled on all tables
- [x] Phone authentication configured
- [x] HTTPS enforced (production)
- [x] API keys in `.env.local` (not in git)
- [x] URL redirects configured
- [x] Test user created (for testing)
- [x] SMS provider configured (production)

---

## Support

- Supabase Docs: https://supabase.com/docs
- Issues: Check `src/lib/supabase/` for debug logs
- Contact: Your project team
