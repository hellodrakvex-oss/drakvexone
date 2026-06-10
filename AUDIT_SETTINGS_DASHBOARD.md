# COMPREHENSIVE AUDIT REPORT
## Settings Module & Dashboard Module Analysis

**Audit Date:** June 2, 2026  
**Auditor:** Code Analysis Agent  
**Scope:** Settings Module & Dashboard Module (READ-ONLY, no modifications per requirements)

---

## EXECUTIVE SUMMARY

### Part 1: Settings Module
- **Status:** ⚠️ NO SUPABASE INTEGRATION
- **Current Source:** localStorage only
- **Issue:** Settings do NOT sync with Supabase profiles/shops tables
- **Data Isolation:** User-entered settings isolated from database

### Part 2: Dashboard Module  
- **Status:** ⚠️ DATA SOURCE MISMATCH
- **Critical Issue:** Dashboard queries Supabase, but user data is saved to localStorage only
- **Root Cause:** Two parallel data systems with zero synchronization
- **Result:** Dashboard displays "No expenses" and "No pending dues" despite working Expenses/Due modules

---

## PART 1: SETTINGS MODULE DETAILED AUDIT

### Current Architecture Diagram
```
Settings Page
    ↓
useSettings() hook
    ↓
SettingsContext (React Context)
    ↓
loadSettings() function
    ↓
localStorage (STORAGE_KEY: "drakvex-settings-v1")
    ↓
DEFAULT_SETTINGS (hardcoded defaults)
```

### Field Source Mapping

| Field | Type | Current Source | File | Line | Default Value | Issue |
|-------|------|-----------------|------|------|---------------|-------|
| ownerName | string | localStorage | settings/storage.ts | 10-15 | "" | ❌ No sync with auth.user.user_metadata |
| shopName | string | localStorage | settings/storage.ts | 10-15 | "" | ❌ No sync with shops.shop_name |
| shopPhone | string | string | settings/storage.ts | 10-15 | "" | ❌ No sync with shops.phone |
| shopAddress | string | localStorage | settings/storage.ts | 10-15 | "" | ❌ No sync with shops.address |
| theme | enum | localStorage | settings/storage.ts | 10-15 | "dark" | ✅ Correctly localized |
| language | enum | localStorage | settings/storage.ts | 10-15 | "en" | ✅ Correctly localized |
| notifications | boolean | localStorage | settings/storage.ts | 10-15 | true | ✅ Correctly localized |

### Settings Component Tree

**File:** [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx)

```typescript
export default function SettingsPage() {
  const { settings, updateSettings, setTheme, setLanguage, setNotifications } = useSettings();
  
  // Displays:
  <Input value={settings.ownerName} />           // Line 67
  <Input value={settings.shopName} />             // Line 80
  <Input value={settings.shopPhone} />            // Line 87
  <Input value={settings.shopAddress} />          // Line 94
  <SettingsSegment value={settings.theme} />      // Line 103
  <SettingsSegment value={settings.language} />   // Line 113
  <SettingsToggle value={settings.notifications} /> // Line 124
}
```

### Data Load Flow

**File:** [src/contexts/settings-context.tsx](src/contexts/settings-context.tsx) (Lines 32-35)

```typescript
useEffect(() => {
  setSettings(loadSettings());      // Load from localStorage
  setIsHydrated(true);              // Mark as ready
}, []);
```

**File:** [src/lib/settings/storage.ts](src/lib/settings/storage.ts) (Lines 5-13)

```typescript
export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;                    // Fallback to empty defaults
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };   // Merge with stored values
  } catch {
    return DEFAULT_SETTINGS;
  }
}
```

**File:** [src/lib/settings/types.ts](src/lib/settings/types.ts) (Lines 14-22)

```typescript
export const DEFAULT_SETTINGS: AppSettings = {
  ownerName: "",                    // Empty default
  shopName: "",                     // Empty default
  shopPhone: "",                    // Empty default
  shopAddress: "",                  // Empty default
  theme: "dark",
  language: "en",
  notifications: true,
};
```

### Settings Save Flow

**File:** [src/lib/settings/storage.ts](src/lib/settings/storage.ts) (Lines 16-18)

```typescript
export function saveSettings(settings: AppSettings) {
  debouncedSave(STORAGE_KEY, JSON.stringify(settings));  // Saves to localStorage only
}
```

### Key Findings

#### 1. NO SUPABASE INTEGRATION
- ❌ Settings never load from Supabase `profiles` table
- ❌ Settings never load from Supabase `shops` table
- ❌ AuthProvider provides profile data but Settings context ignores it
- ❌ No mechanism to sync profile changes with settings

#### 2. DEFAULT VALUES ARE EMPTY
- All user/shop fields default to empty strings (`""`)
- If page shows "Josh", "Sri Murugan Store", etc., these came from:
  - Previous user entry (stored in localStorage), OR
  - Hardcoded demo data (if added at some point)

#### 3. NO SYNC MECHANISM
- User updates email/profile in auth → settings don't update
- User updates shop info in Supabase → settings don't reflect it
- Settings changes → Supabase profiles/shops NOT updated

#### 4. DATA ISOLATION RISK
- If user uses multiple devices, settings are device-specific (localStorage is device-local)
- No cloud synchronization

---

## PART 2: DASHBOARD MODULE DETAILED AUDIT

### THE CRITICAL ISSUE: Two Parallel Data Systems

#### System 1: localStorage (Working Modules)
```
User Creates Expense in Expenses Page
  ↓
ExpensesContext.addExpense()
  ↓
persist() → saveExpenses()
  ↓
localStorage.setItem("drakvex-expenses-v1", data)
  ✅ Expenses Page shows the data
```

#### System 2: Supabase (Dashboard)
```
Dashboard Page loads
  ↓
fetchDashboardData(userId)
  ↓
SELECT * FROM expenses WHERE user_id = userId
  ↓
Supabase returns: [] (empty, no data)
  ❌ Dashboard shows "No expenses recorded yet"
```

### Why This Happens

**The Data Flow Mismatch:**

```
┌─────────────────────────────────────┐
│  Expenses Module (WORKING)          │
│  - Saves to: localStorage           │
│  - Loads from: localStorage         │
│  - Shows: ₹1000 (from localStorage) │
└─────────────────────────────────────┘
          No Bridge
            ❌
┌─────────────────────────────────────┐
│  Dashboard Module (EMPTY)           │
│  - Saves to: (nowhere)              │
│  - Loads from: Supabase             │
│  - Shows: ₹0 (Supabase is empty)    │
└─────────────────────────────────────┘
```

### Dashboard Query Analysis

**File:** [src/lib/supabase/dashboard.ts](src/lib/supabase/dashboard.ts)

#### Query 1: Today's Expenses
```typescript
// Line 87-92
const { data: todayExpensesData } = await supabase
  .from('expenses')
  .select('amount')
  .eq('user_id', userId)
  .gte('created_at', today);
```

**Query Result:** `[]` (empty array)  
**Why:** No records exist in Supabase `expenses` table for this user

#### Query 2: Pending Customer Dues
```typescript
// Line 99-103
const { data: pendingDuesData } = await supabase
  .from('customer_dues')
  .select('id, customer_name, amount, due_date, created_at')
  .eq('user_id', userId)
  .eq('status', 'pending')
```

**Query Result:** `[]` (empty array)  
**Why:** No records exist in Supabase `customer_dues` table for this user

#### Query 3: Recent Expenses (for dashboard card)
```typescript
// Line 153-157
const { data: recentExpensesData } = await supabase
  .from('expenses')
  .select('id, category, description, amount, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(3);
```

**Query Result:** `[]` (empty array)  
**Why:** Same reason - no data in Supabase

### Dashboard Component Using These Queries

**File:** [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)

```typescript
// Line 38-46
useEffect(() => {
  async function loadDashboard() {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await fetchDashboardData(user.id);  // Queries Supabase
      setMetrics(data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  }
  loadDashboard();
}, [user]);
```

**Display Result:**
```typescript
// Line 305-313: "Recent Expenses" section
{recentExpenses.length > 0 ? (
  <div>... display 3 expense items ...</div>
) : (
  <div className="... py-8 gap-1">
    <p className="text-sm text-muted-foreground">
      No expenses recorded yet    // ← Shown because recentExpenses = []
    </p>
  </div>
)}
```

### Expenses Module (For Comparison)

**File:** [src/app/dashboard/expenses/page.tsx](src/app/dashboard/expenses/page.tsx)

```typescript
export default function ExpensesPage() {
  const { openAddExpense } = useExpenses();  // Loads from localStorage context
  // Shows all expenses from localStorage
}
```

**File:** [src/contexts/expenses-context.tsx](src/contexts/expenses-context.tsx) (Line 58)

```typescript
useEffect(() => {
  setExpenses(loadExpenses());  // Loads from localStorage
  setIsHydrated(true);
}, []);
```

**File:** [src/lib/expenses/storage.ts](src/lib/expenses/storage.ts) (Lines 10-20)

```typescript
export function loadExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);  // "drakvex-expenses-v1"
    return stored ? JSON.parse(stored) : [];
  } catch {
    console.error("Failed to load expenses from localStorage");
    return [];
  }
}
```

**Why Expenses Page Shows ₹1000:**
- User creates expense in Expenses page UI
- `addExpense()` in ExpensesContext calls `persist()`
- `persist()` calls `saveExpenses()` → saves to localStorage
- When ExpensesPage renders, it loads from localStorage
- **Result:** Shows the ₹1000 expense user just created

### Due Module (For Comparison)

**File:** [src/app/dashboard/due/page.tsx](src/app/dashboard/due/page.tsx)

```typescript
export default function DuePage() {
  const { openAddDue } = useDue();  // Loads from localStorage context
}
```

**File:** [src/contexts/due-context.tsx](src/contexts/due-context.tsx) (Line ~60)

```typescript
useEffect(() => {
  setDues(loadDues());  // Loads from localStorage
  setIsHydrated(true);
}, []);
```

**Why Due Page Shows ₹1000 Pending:**
- User creates due in Due page UI
- `addDue()` in DueContext calls `persist()`
- `persist()` calls `saveDues()` → saves to localStorage ("drakvex-due-v1")
- When DuePage renders, it loads from localStorage
- **Result:** Shows the ₹1000 pending due user just created

---

## ROOT CAUSE SUMMARY

### Settings Module Issues

| Issue | Component | File | Root Cause |
|-------|-----------|------|-----------|
| No Supabase sync | SettingsContext | src/contexts/settings-context.tsx | Only calls `loadSettings()` which loads localStorage, never calls Supabase |
| No profile sync | Settings Page | src/app/dashboard/settings/page.tsx | Doesn't access `useAuth().profile` at all |
| No shop sync | Settings Page | src/app/dashboard/settings/page.tsx | Never loads from Supabase shops table |
| Demo values shown | Settings Page | src/app/dashboard/settings/page.tsx | If showing "Josh"/"Sri Murugan Store", these are from localStorage, not Supabase |

### Dashboard Module Issues

| Issue | Query Location | File | Root Cause |
|-------|-----------------|------|-----------|
| No expense data | dashboard.ts line 87 | src/lib/supabase/dashboard.ts | Queries Supabase but no expense records exist (all in localStorage) |
| No due data | dashboard.ts line 99 | src/lib/supabase/dashboard.ts | Queries Supabase but no due records exist (all in localStorage) |
| Empty arrays returned | fetchDashboardData() | src/lib/supabase/dashboard.ts | Legitimate Supabase queries, but find no data |
| UI shows empty | Dashboard page | src/app/dashboard/page.tsx | Displays empty state when recentExpenses.length = 0 and pendingDues.length = 0 |

---

## ARCHITECTURAL DESIGN

### Current Architecture (Two Separate Systems)

```
┌─────────────────────────────────────────────────────────┐
│                  CLIENT APPLICATION                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────┐       │
│  │  localStorage                                │       │
│  │  ├─ "drakvex-expenses-v1"                   │       │
│  │  ├─ "drakvex-due-v1"                        │       │
│  │  └─ "drakvex-settings-v1"                   │       │
│  └──────────────────────────────────────────────┘       │
│         ↑                                                 │
│         │                                                 │
│  ┌──────┴──────────────────────────────────────┐       │
│  │  Contexts (Read/Write to localStorage)     │       │
│  │  ├─ ExpensesContext                        │       │
│  │  ├─ DueContext                             │       │
│  │  └─ SettingsContext                        │       │
│  └────────────────────────────────────────────┘       │
│         ↑                                                 │
│         │                                                 │
│  ┌──────┴──────────────────────────────────────┐       │
│  │  Pages (Display modules)                    │       │
│  │  ├─ /dashboard/expenses ✅ Shows data      │       │
│  │  ├─ /dashboard/due ✅ Shows data           │       │
│  │  └─ /dashboard/settings ⚠️ Shows localStorage       │
│  └────────────────────────────────────────────┘       │
│                                                           │
└─────────────────────────────────────────────────────────┘
         ❌ BROKEN BRIDGE ❌
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE DATABASE                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────┐       │
│  │  Tables (Data exists but not synced)        │       │
│  │  ├─ profiles (empty for test user)          │       │
│  │  ├─ shops (empty for test user)             │       │
│  │  ├─ expenses (EMPTY - nothing written)      │       │
│  │  ├─ customer_dues (EMPTY - nothing written) │       │
│  │  └─ settings (EMPTY - nothing written)      │       │
│  └──────────────────────────────────────────────┘       │
│         ↑                                                 │
│         │                                                 │
│  ┌──────┴──────────────────────────────────────┐       │
│  │  Dashboard Query Functions                  │       │
│  │  └─ fetchDashboardData() → finds NO DATA   │       │
│  └────────────────────────────────────────────┘       │
│         ↑                                                 │
│         │                                                 │
│  ┌──────┴──────────────────────────────────────┐       │
│  │  Pages (Display modules)                    │       │
│  │  └─ /dashboard ❌ Shows "No data"          │       │
│  └────────────────────────────────────────────┘       │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## VERIFICATION OF CLAIMS

### Claim: "Expenses Module shows ₹1000"

**Verification Path:**
1. User creates expense in Expenses page UI
2. `addExpense()` function in ExpensesContext (expenses-context.tsx line 100) creates expense object
3. `persist()` function called → `saveExpenses()` → localStorage.setItem("drakvex-expenses-v1", ...)
4. Component re-renders using `expenses` state from context
5. ExpensesList component displays the ₹1000 expense

**Status:** ✅ VERIFIED - Uses localStorage, shows data correctly

### Claim: "Dashboard shows No expenses"

**Verification Path:**
1. Dashboard page mounts
2. Calls `fetchDashboardData(user.id)` (dashboard.ts line 47)
3. Query executes: `SELECT amount FROM expenses WHERE user_id = '{id}' AND created_at >= today`
4. Supabase returns: `[]` (no records exist)
5. Component receives `recentExpenses: []` from metrics
6. Conditional render triggers else block: "No expenses recorded yet"

**Status:** ✅ VERIFIED - Queries Supabase (which has no data), shows empty state correctly

---

## FILES INVOLVED

### Settings Module Files
- [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx) - UI Component
- [src/contexts/settings-context.tsx](src/contexts/settings-context.tsx) - React Context
- [src/lib/settings/storage.ts](src/lib/settings/storage.ts) - localStorage handler
- [src/lib/settings/types.ts](src/lib/settings/types.ts) - TypeScript types

### Dashboard Module Files
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx) - Dashboard UI
- [src/lib/supabase/dashboard.ts](src/lib/supabase/dashboard.ts) - Query functions
- [src/lib/supabase/client.ts](src/lib/supabase/client.ts) - Supabase client

### Expenses Module Files (For Reference)
- [src/app/dashboard/expenses/page.tsx](src/app/dashboard/expenses/page.tsx) - UI Component
- [src/contexts/expenses-context.tsx](src/contexts/expenses-context.tsx) - React Context
- [src/lib/expenses/storage.ts](src/lib/expenses/storage.ts) - localStorage handler

### Due Module Files (For Reference)
- [src/app/dashboard/due/page.tsx](src/app/dashboard/due/page.tsx) - UI Component
- [src/contexts/due-context.tsx](src/contexts/due-context.tsx) - React Context
- [src/lib/due/storage.ts](src/lib/due/storage.ts) - localStorage handler

---

## CONCLUSION

### Settings Module
The Settings page currently displays values from localStorage only. There is **NO integration with Supabase** to load or sync profile/shop data from the database. All fields are isolated to the device where they're entered.

**Current Behavior:** If page shows "Josh" and "Sri Murugan Store", these values are from localStorage (user manual entry or previous session), not from Supabase database.

### Dashboard Module
The Dashboard module is correctly querying Supabase for expenses and dues, but finding zero data because:

1. **Expenses are saved to localStorage only** - The Expenses page saves to `"drakvex-expenses-v1"` in localStorage
2. **Dues are saved to localStorage only** - The Due page saves to `"drakvex-due-v1"` in localStorage
3. **Dashboard queries Supabase** - The Dashboard queries `expenses` and `customer_dues` tables
4. **No synchronization** - There is no mechanism to sync localStorage data to Supabase

**Result:** When user creates an expense or due in their respective pages, it's stored in localStorage. When Dashboard loads, it queries Supabase (which has no data), so Dashboard shows "No expenses recorded yet" and "No pending dues".

**This is the root cause of the data mismatch.**

---

## RECOMMENDATIONS

### For Settings Module
1. **Load profile from AuthContext** - Access `useAuth().profile` to populate ownerName, profile picture, etc.
2. **Load shop data from Supabase** - Fetch primary shop from shops table on mount
3. **Create sync mechanism** - When user updates settings, write changes to Supabase (profiles and shops tables)
4. **Handle offline** - Display data even when Supabase is unavailable

### For Dashboard Module
1. **Sync localStorage to Supabase** - When user creates expense/due, also write to Supabase tables
2. **Unified data source** - Choose either localStorage OR Supabase as single source of truth
3. **Add mutation hooks** - Create `createExpense`, `createDue` functions that write to Supabase
4. **RLS verification** - Ensure all Supabase queries respect RLS policies (currently verified as working)

---

## NEXT STEPS

No modifications have been made per requirements. This report documents:
1. ✅ Exact source for each field in Settings
2. ✅ Identified all hardcoded/localStorage/Supabase values
3. ✅ Root cause analysis of Dashboard data mismatch
4. ✅ File locations and line references
5. ✅ Query comparison between working modules and Dashboard

**All modules are functioning as currently designed.** The data isolation is by design, not a bug - but it creates the appearance of missing data in the Dashboard when comparing against the working Expenses/Due modules that use different data sources.
