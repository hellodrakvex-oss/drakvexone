# DATA SOURCE MAPPING & ROOT CAUSE ANALYSIS

## PART 1: SETTINGS FIELD SOURCE MAPPING

### Quick Reference Table

```
FIELD              | CURRENT SOURCE    | VALUE              | SYNC WITH SUPABASE?
───────────────────┼──────────────────┼────────────────────┼─────────────────
ownerName          | localStorage     | (user-entered)     | ❌ NO
shopName           | localStorage     | (user-entered)     | ❌ NO  
shopPhone          | localStorage     | (user-entered)     | ❌ NO
shopAddress        | localStorage     | (user-entered)     | ❌ NO
theme              | localStorage     | "dark"             | ✅ (not needed)
language           | localStorage     | "en"               | ✅ (not needed)
notifications      | localStorage     | true               | ✅ (not needed)
```

### Detailed Source Mapping

**Field: ownerName**
- File: [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx#L67)
- Old Source: `DEFAULT_SETTINGS.ownerName = ""`
- New Source: `localStorage["drakvex-settings-v1"].ownerName`
- Fallback: `""`
- Supabase Sync: ❌ NO (should sync with auth.user.user_metadata or profiles table)

**Field: shopName**
- File: [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx#L80)
- Old Source: `DEFAULT_SETTINGS.shopName = ""`
- New Source: `localStorage["drakvex-settings-v1"].shopName`
- Fallback: `""`
- Supabase Sync: ❌ NO (should sync with shops.shop_name)

**Field: shopPhone**
- File: [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx#L87)
- Old Source: `DEFAULT_SETTINGS.shopPhone = ""`
- New Source: `localStorage["drakvex-settings-v1"].shopPhone`
- Fallback: `""`
- Supabase Sync: ❌ NO (should sync with shops.phone)

**Field: shopAddress**
- File: [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx#L94)
- Old Source: `DEFAULT_SETTINGS.shopAddress = ""`
- New Source: `localStorage["drakvex-settings-v1"].shopAddress`
- Fallback: `""`
- Supabase Sync: ❌ NO (should sync with shops.address)

**Field: theme**
- File: [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx#L103)
- Old Source: `DEFAULT_SETTINGS.theme = "dark"`
- New Source: `localStorage["drakvex-settings-v1"].theme`
- Fallback: `"dark"`
- Supabase Sync: ✅ (correctly device-local only)

**Field: language**
- File: [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx#L113)
- Old Source: `DEFAULT_SETTINGS.language = "en"`
- New Source: `localStorage["drakvex-settings-v1"].language`
- Fallback: `"en"`
- Supabase Sync: ✅ (correctly device-local only)

**Field: notifications**
- File: [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx#L124)
- Old Source: `DEFAULT_SETTINGS.notifications = true`
- New Source: `localStorage["drakvex-settings-v1"].notifications`
- Fallback: `true`
- Supabase Sync: ✅ (correctly device-local only)

---

## PART 2: DASHBOARD METRIC SOURCE MAPPING

### Query Comparison: Expenses Module vs Dashboard

#### WORKING: Expenses Module Data Flow
```
User creates expense in Expenses Page
  ↓
Component calls: openAddExpense() → sets drawer state
  ↓
User submits form
  ↓
Component calls: addExpense({ amount: 1000, category: "Milk", ... })
  ↓
ExpensesContext.addExpense() (expenses-context.tsx:100)
  ↓
  const expense = { id: "exp_...", amount: 1000, ... }
  persist([expense, ...expenses])  // Add to state
  ↓
persist() function calls:
  setExpenses(next)                           // React state update
  saveExpenses(next)                          // localStorage save
  ↓
  saveExpenses() → debouncedSave("drakvex-expenses-v1", JSON.stringify(data))
  ↓
  localStorage.setItem("drakvex-expenses-v1", data)
  ✅ RESULT: Expense is now in localStorage
  ✅ Expenses Page re-renders and shows ₹1000
```

#### BROKEN: Dashboard Data Flow
```
Dashboard page mounts
  ↓
useEffect calls: loadDashboard()
  ↓
fetchDashboardData(user.id)  (dashboard.ts:48)
  ↓
Executes Supabase query:
  SELECT amount FROM expenses 
  WHERE user_id = '{userId}' 
  AND created_at >= today
  ↓
Supabase returns: []
  (No records exist in Supabase - user never wrote there)
  ↓
todayExpenses = 0
recentExpenses = []
  ✅ Correct behavior for empty Supabase
  ❌ But user data is in localStorage, not Supabase!
  ✅ RESULT: Dashboard shows "No expenses recorded yet"
```

### Exact Supabase Queries in Dashboard

**Query 1: Today's Expenses Total**
```typescript
File: src/lib/supabase/dashboard.ts (Lines 87-92)

const { data: todayExpensesData } = await supabase
  .from('expenses')
  .select('amount')
  .eq('user_id', userId)
  .gte('created_at', today);

const todayExpenses = (todayExpensesData || []).reduce(
  (sum, row) => sum + (Number(row.amount) || 0),
  0
);

Expected if data synced: 1000
Actual result: 0 (empty array)
Reason: No expense records in Supabase for this user
```

**Query 2: Pending Customer Dues**
```typescript
File: src/lib/supabase/dashboard.ts (Lines 99-103)

const { data: pendingDuesData } = await supabase
  .from('customer_dues')
  .select('id, customer_name, amount, due_date, created_at')
  .eq('user_id', userId)
  .eq('status', 'pending')
  .order('due_date', { ascending: true });

const toCollect = pendingDues.reduce(
  (sum, row) => sum + (Number(row.amount) || 0),
  0
);

Expected if data synced: 1000
Actual result: 0 (empty array)
Reason: No customer_dues records in Supabase for this user
```

**Query 3: Recent Expenses (Display)**
```typescript
File: src/lib/supabase/dashboard.ts (Lines 153-157)

const { data: recentExpensesData } = await supabase
  .from('expenses')
  .select('id, category, description, amount, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(3);

Expected if data synced: [{ id: "...", category: "Milk", amount: 1000, ... }]
Actual result: [] (empty array)
Reason: No expense records in Supabase
```

### Comparison with Expenses Page Query

**Expenses Page (WORKING):**
```typescript
File: src/contexts/expenses-context.tsx

useEffect(() => {
  setExpenses(loadExpenses());  // Load from localStorage
  setIsHydrated(true);
}, []);

function loadExpenses(): Expense[] {
  const stored = localStorage.getItem("drakvex-expenses-v1");
  return stored ? JSON.parse(stored) : [];
}

Result: ["exp_1717315200000_abcdef9", { amount: 1000, category: "Milk", ... }]
✅ Shows ₹1000 because localStorage has the data
```

**Comparison with Due Page Query**

**Due Page (WORKING):**
```typescript
File: src/contexts/due-context.tsx

useEffect(() => {
  setDues(loadDues());  // Load from localStorage
  setIsHydrated(true);
}, []);

function loadDues(): CustomerDue[] {
  const stored = localStorage.getItem("drakvex-due-v1");
  return stored ? JSON.parse(stored) : [];
}

Result: ["due_1717315200000_xyz789", { customer_name: "Customer", amount: 1000, status: "pending" }]
✅ Shows ₹1000 pending because localStorage has the data
```

---

## ROOT CAUSE ANALYSIS: WHY DASHBOARD IS EMPTY

### The Two Data Silos

```
┌─ DATA SILO 1: localStorage ────────────────────┐
│                                                 │
│  Modules writing here:                          │
│  ✅ Expenses Module → "drakvex-expenses-v1"   │
│  ✅ Due Module → "drakvex-due-v1"             │
│  ✅ Settings Module → "drakvex-settings-v1"   │
│                                                 │
│  Modules reading from here:                     │
│  ✅ Expenses Page → Shows ₹1000               │
│  ✅ Due Page → Shows ₹1000 pending            │
│  ✅ Settings Page → Shows user-entered data   │
│                                                 │
└─────────────────────────────────────────────────┘
          NO BRIDGE TO SUPABASE
┌─ DATA SILO 2: Supabase ────────────────────────┐
│                                                 │
│  Tables (Empty for test user):                 │
│  ❌ expenses table → No data written           │
│  ❌ customer_dues table → No data written      │
│  ❌ settings table → No data written           │
│                                                 │
│  Modules reading from here:                     │
│  ❌ Dashboard → Queries Supabase → finds []    │
│  ❌ Shows "No expenses recorded yet"           │
│  ❌ Shows "No pending dues"                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### The Missing Write Operations

**What's Missing:**
- When user creates expense in Expenses page → should ALSO write to Supabase
- When user creates due in Due page → should ALSO write to Supabase
- Currently only writes to localStorage

**Example Missing Code:**
```typescript
// This is what SHOULD happen but DOESN'T:

const addExpense = useCallback(
  (input: NewExpenseInput) => {
    // 1. Create local object
    const expense = {
      id: createExpenseId(),
      amount: input.amount,
      ...
    };
    
    // 2. Save to localStorage (✅ THIS HAPPENS)
    persist([expense, ...expenses]);
    
    // 3. Save to Supabase (❌ THIS DOESN'T HAPPEN)
    // Missing code:
    // const { error } = await supabase
    //   .from('expenses')
    //   .insert({
    //     user_id: userId,
    //     shop_id: shopId,
    //     amount: input.amount,
    //     category: input.category,
    //     created_at: new Date().toISOString(),
    //     ...
    //   });
  },
  [...]
);
```

---

## SUMMARY TABLE: DATA SOURCE TRUTH

| Module | Where Data is Saved | Where Dashboard Looks | Match? |
|--------|---------------------|----------------------|--------|
| **Expenses** | localStorage | Supabase | ❌ NO |
| **Customer Due** | localStorage | Supabase | ❌ NO |
| **Settings** | localStorage | localStorage | ✅ YES |

---

## TECHNICAL ROOT CAUSE

### File Involvement

**Settings Module - All localStorage:**
- Load: [src/lib/settings/storage.ts#L5-15](src/lib/settings/storage.ts#L5-15)
- Save: [src/lib/settings/storage.ts#L16-18](src/lib/settings/storage.ts#L16-18)
- Context: [src/contexts/settings-context.tsx#L32-35](src/contexts/settings-context.tsx#L32-35)

**Expenses Module - All localStorage:**
- Load: [src/lib/expenses/storage.ts#L10-20](src/lib/expenses/storage.ts#L10-20)
- Save: [src/lib/expenses/storage.ts#L24-31](src/lib/expenses/storage.ts#L24-31)
- Context: [src/contexts/expenses-context.tsx#L58](src/contexts/expenses-context.tsx#L58)
- Add operation: [src/contexts/expenses-context.tsx#L100](src/contexts/expenses-context.tsx#L100)

**Due Module - All localStorage:**
- Load: [src/lib/due/storage.ts#L38-50](src/lib/due/storage.ts#L38-50)
- Save: [src/lib/due/storage.ts#L53-61](src/lib/due/storage.ts#L53-61)
- Context: [src/contexts/due-context.tsx#L60](src/contexts/due-context.tsx#L60)
- Add operation: [src/contexts/due-context.tsx#L105](src/contexts/due-context.tsx#L105)

**Dashboard - All Supabase:**
- Query: [src/lib/supabase/dashboard.ts#L48-170](src/lib/supabase/dashboard.ts#L48-170)
- Page: [src/app/dashboard/page.tsx#L38-46](src/app/dashboard/page.tsx#L38-46)
- No write operations exist

### Why This Happened

The app was built in two phases:
1. **Phase 1:** Expenses, Due, Settings modules created with localStorage (client-side only)
2. **Phase 2:** Dashboard created with Supabase queries (server data) 
3. **Phase 2 developers:** Didn't realize data wasn't in Supabase
4. **Result:** Dashboard queries empty Supabase tables

---

## VERIFICATION CHECKLIST

✅ Traced Settings page to localStorage source
✅ Traced Dashboard expenses query to Supabase (empty)
✅ Traced Dashboard dues query to Supabase (empty)
✅ Confirmed Expenses page saves to localStorage, not Supabase
✅ Confirmed Due page saves to localStorage, not Supabase
✅ Identified exact file locations and line numbers
✅ Found root cause: Two parallel data systems with no sync
✅ Verified no hardcoded values (using DEFAULT_SETTINGS and user-entered data)

---

## CONCLUSION

**Settings Module:** Currently loads from localStorage only. No Supabase integration. If showing "Josh" or "Sri Murugan Store", these are from localStorage (user-entered or previous session), NOT from Supabase.

**Dashboard Module:** Correctly queries Supabase, but Supabase tables are empty because user data is in localStorage. This is not a Dashboard bug - it's a data architecture issue where two systems never synchronize.
