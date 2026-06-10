# Drakvex One - Backend Architecture Plan

**Phase:** Production Readiness with Supabase  
**Scope:** Full backend integration maintaining 100% UX/Design fidelity  
**Timeline:** Staged rollout per component

---

## 1. SUPABASE SCHEMA DESIGN

### 1.1 Core Tables

#### `auth.users` (Supabase Built-in)
- Auto-managed by Supabase
- Phone-based authentication via OTP
- Linked to `profiles` table via `user_id`

#### `profiles` (Public)
```sql
id: UUID PK (links to auth.users.id)
shop_name: VARCHAR(255)
phone: VARCHAR(20) UNIQUE
language: VARCHAR(10) -- 'en', 'ta'
theme: VARCHAR(10) -- 'light', 'dark'
currency: VARCHAR(3) -- 'INR'
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### `shops` (Public)
```sql
id: UUID PK
user_id: UUID FK (profiles.id)
shop_name: VARCHAR(255)
address: TEXT
city: VARCHAR(100)
phone: VARCHAR(20)
email: VARCHAR(255)
gst_number: VARCHAR(20)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### `sales` (Public)
```sql
id: UUID PK
user_id: UUID FK (profiles.id)
shop_id: UUID FK (shops.id)
amount: DECIMAL(10, 2)
description: VARCHAR(255)
payment_method: VARCHAR(50) -- 'cash', 'card', 'upi'
reference_number: VARCHAR(100)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### `expenses` (Public)
```sql
id: UUID PK
user_id: UUID FK (profiles.id)
shop_id: UUID FK (shops.id)
category: VARCHAR(100)
amount: DECIMAL(10, 2)
description: TEXT
reference_number: VARCHAR(100)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### `customer_dues` (Public)
```sql
id: UUID PK
user_id: UUID FK (profiles.id)
shop_id: UUID FK (shops.id)
customer_name: VARCHAR(255)
phone: VARCHAR(20)
amount: DECIMAL(10, 2)
status: VARCHAR(20) -- 'pending', 'paid'
due_date: DATE
notes: TEXT
whatsapp_sent_at: TIMESTAMP NULL
paid_at: TIMESTAMP NULL
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### `settings` (Public)
```sql
id: UUID PK
user_id: UUID FK (profiles.id)
theme: VARCHAR(10)
language: VARCHAR(10)
notifications_enabled: BOOLEAN
whatsapp_enabled: BOOLEAN
currency: VARCHAR(3)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### 1.2 Row-Level Security (RLS)

**All tables follow single-user isolation:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Similar pattern for all data tables:
-- Users can ONLY see/modify their own records
-- RLS enforces user_id = auth.uid()
```

---

## 2. AUTHENTICATION FLOW

### 2.1 Phone OTP Authentication

```
User Flow:
1. Open app → /login page
2. Enter phone number
3. Supabase sends OTP via SMS
4. User enters OTP
5. Supabase verifies & creates session
6. JWT stored in localStorage + secure cookie
7. Redirect to /dashboard or /setup (first-time)
```

### 2.2 Session Management

- **JWT Tokens:** Stored in `secure, httpOnly` cookie (auto by Supabase)
- **Session Persistence:** Auto-restored from cookie on page load
- **Protected Routes:** Middleware checks `auth.session()` before allowing access
- **Logout:** Clears session, redirects to /login

### 2.3 Setup/Onboarding Flow

```
First-time user journey:
/login → authenticated → /setup
  → Enter shop details (name, address, etc.)
  → Save to profiles + shops table
  → Redirect to /dashboard
```

---

## 3. DATA SYNCHRONIZATION STRATEGY

### 3.1 localStorage to Supabase Migration

**Migration steps:**
1. User logs in → Session created
2. Check localStorage for `drakvex-sales-v1`, `drakvex-expenses-v1`, etc.
3. If local data exists AND no cloud data → **Upload local → cloud**
4. Clear localStorage after successful upload
5. Future: All data synced to/from Supabase in real-time

**Safety measures:**
- Always show user confirmation before uploading local data
- Keep local backup until sync confirmed
- Handle sync failures gracefully (retry logic)

### 3.2 Data Fetching Architecture

**React Context + Hooks Pattern (preserved):**
- Keep existing context structure (SalesContext, ExpensesContext, etc.)
- Replace localStorage calls with Supabase calls
- Same API surface - components don't change
- `useSales()` → fetches from Supabase instead of localStorage

**Example refactor:**
```typescript
// BEFORE: localStorage
const sales = JSON.parse(localStorage.getItem('drakvex-sales-v1') || '[]');

// AFTER: Supabase
const { data: sales } = await supabase
  .from('sales')
  .select('*')
  .eq('user_id', user.id);
```

### 3.3 Optimistic UI Updates

**For UX smoothness (no waiting for network):**
1. User deletes a sale
2. UI removes immediately (optimistic)
3. Background: `DELETE` request sent to Supabase
4. If success → persist
5. If fail → undo + show error toast

**Implementation:** Hook wraps Supabase calls with optimistic state updates

### 3.4 Offline Safety

**Web-first approach (simplicity):**
- Requires active internet for functionality
- No offline-first queuing initially
- Future: Consider `@supabase/realtime` + service worker

---

## 4. IMPLEMENTATION PHASES

### Phase 1: Authentication Foundation (Week 1)
- [ ] Supabase project setup
- [ ] Phone OTP authentication
- [ ] Protected routes (middleware)
- [ ] Session persistence
- [ ] Login/Logout flow
- [ ] First-time onboarding (/setup)

### Phase 2: Database & RLS (Week 1-2)
- [ ] Create all tables with RLS
- [ ] Verify RLS policies
- [ ] Test user isolation

### Phase 3: Sales Module Migration (Week 2)
- [ ] Refactor SalesContext to use Supabase
- [ ] Data upload from localStorage
- [ ] Real-time updates (Realtime API)
- [ ] Optimistic deletes/edits
- [ ] Test all CRUD operations

### Phase 4: Expenses Module Migration (Week 2)
- [ ] Refactor ExpensesContext
- [ ] Data migration
- [ ] Real-time updates
- [ ] Testing

### Phase 5: Customer Dues Module Migration (Week 3)
- [ ] Refactor DueContext
- [ ] WhatsApp integration (preserve existing)
- [ ] Real-time updates
- [ ] Testing

### Phase 6: Settings & Sync (Week 3)
- [ ] Settings table integration
- [ ] Theme/language persistence
- [ ] Cross-device sync

### Phase 7: QA & Hardening (Week 4)
- [ ] Full regression testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Error handling polish

---

## 5. FILE STRUCTURE ADDITIONS

```
src/
  lib/
    supabase/
      client.ts          -- Supabase client initialization
      auth.ts            -- Authentication functions
      types.ts           -- TypeScript types for DB
    api/
      migrations.ts      -- localStorage → Supabase
      
  middleware/
    auth.ts             -- Next.js middleware (protected routes)
    
  hooks/
    use-supabase-sync.ts -- Generic sync hook
    use-optimistic.ts    -- Optimistic updates pattern
    
  contexts/
    auth-context.tsx    -- Authentication state (new)
    -- Existing contexts updated to use Supabase
```

---

## 6. SECURITY CHECKLIST

- [ ] RLS policies block unauthorized access
- [ ] JWT validation on all API calls
- [ ] Phone verification (OTP via SMS)
- [ ] HTTPS enforced
- [ ] Sensitive data encrypted at rest (Supabase default)
- [ ] Audit logs for critical operations
- [ ] Rate limiting on auth endpoints
- [ ] CSRF protection (Next.js default)

---

## 7. TESTING STRATEGY

**Before Production:**
1. **Unit Tests:** Context hooks, API functions
2. **Integration Tests:** Auth flow, data sync
3. **E2E Tests:** Full user workflows
4. **Security Tests:** RLS bypass attempts
5. **Performance Tests:** Sync under 3G, large datasets
6. **Real Device Testing:** iOS/Android with real Supabase

---

## 8. DEPLOYMENT READINESS

- [ ] Environment variables configured (.env.local)
- [ ] Supabase project provisioned
- [ ] RLS policies tested and locked
- [ ] Data migration scripts ready
- [ ] Error handling deployed
- [ ] Analytics enabled
- [ ] Backup strategy documented

---

## 9. NOTES

- **UX Preservation:** All changes are backend-only. Zero UI modifications.
- **Design System:** Glassmorphism, mobile-first layouts unchanged.
- **Navigation:** Bottom nav + drawer patterns kept.
- **Mobile-first:** All new features support touch/mobile workflows.
- **Gradual Rollout:** Can migrate one module at a time without breaking others.

---

## Next Step

Start with **Phase 1: Authentication Foundation**
- Set up Supabase project
- Implement phone OTP login
- Create protected routes
- Build onboarding flow
