# Developer Quick Reference - Supabase Integration

**Quick lookup guide for common tasks during backend migration.**

---

## Authentication Hooks

### `useAuth()` Hook

```typescript
import { useAuth } from '@/contexts/auth-context';

export function MyComponent() {
  const {
    user,              // AuthUser | null
    profile,           // Profile | null
    isLoading,         // boolean
    isAuthenticated,   // boolean
    sendOTP,           // (phone: string) => Promise<void>
    verifyOTP,         // (phone: string, token: string) => Promise<void>
    signOut,           // () => Promise<void>
    updateProfile      // (updates: Record<string, any>) => Promise<void>
  } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <div>Welcome {user?.phone}</div>;
}
```

---

## Supabase Client

### Direct Client Access

```typescript
import { supabase } from '@/lib/supabase/client';

// Select data
const { data, error } = await supabase
  .from('sales')
  .select('*')
  .eq('user_id', userId);

// Insert
const { data, error } = await supabase
  .from('sales')
  .insert({ amount: 100, description: 'Sale' })
  .select();

// Update
const { data, error } = await supabase
  .from('sales')
  .update({ amount: 150 })
  .eq('id', saleId)
  .select();

// Delete
const { error } = await supabase
  .from('sales')
  .delete()
  .eq('id', saleId);
```

### Get Current User

```typescript
const currentUser = await getCurrentUser();
// Returns: { id, phone, profile }
```

---

## Optimistic Updates

### Basic Pattern

```typescript
import { useOptimisticUpdate } from '@/hooks/use-optimistic';

const { execute } = useOptimisticUpdate({
  successMessage: 'Sale updated!',
  errorMessage: 'Failed to update sale'
});

// In a mutation function:
const handleUpdateSale = async (saleId: string, newAmount: number) => {
  const oldSales = sales; // Keep backup
  
  await execute(
    // Step 1: Optimistic UI update (instant)
    () => {
      setSales(sales.map(s => 
        s.id === saleId ? { ...s, amount: newAmount } : s
      ));
    },
    // Step 2: Server operation (background)
    () => supabase
      .from('sales')
      .update({ amount: newAmount })
      .eq('id', saleId),
    // Step 3: Revert on error
    () => setSales(oldSales)
  );
};
```

### Delete with Undo

```typescript
const handleDeleteSale = async (sale: Sale) => {
  const oldSales = sales;
  
  try {
    // Optimistic delete
    setSales(sales.filter(s => s.id !== sale.id));

    // Server delete
    await supabase
      .from('sales')
      .delete()
      .eq('id', sale.id);

    toast.success('Sale deleted', {
      action: {
        label: 'Undo',
        onClick: async () => {
          // Restore
          setSales([sale, ...sales]);
          await supabase.from('sales').insert(sale);
        }
      }
    });
  } catch (error) {
    // Revert
    setSales(oldSales);
    toast.error('Failed to delete sale');
  }
};
```

---

## Context Migration Example

### BEFORE (localStorage)

```typescript
// src/contexts/sales-context.tsx
export function SalesProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<Sale[]>(() => {
    return JSON.parse(localStorage.getItem('drakvex-sales-v1') || '[]');
  });

  const addSale = useCallback((sale: Sale) => {
    const updated = [sale, ...sales];
    setSales(updated);
    localStorage.setItem('drakvex-sales-v1', JSON.stringify(updated));
  }, [sales]);

  return <SalesContext.Provider value={{ sales, addSale }}>{children}</SalesContext.Provider>;
}
```

### AFTER (Supabase)

```typescript
// src/contexts/sales-context.tsx
import { useAuth } from './auth-context';
import { useOptimisticUpdate } from '@/hooks/use-optimistic';
import { supabase } from '@/lib/supabase/client';

export function SalesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { execute } = useOptimisticUpdate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sales from Supabase
  useEffect(() => {
    if (!user) return;
    
    const fetchSales = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setSales(data || []);
      setIsLoading(false);
    };

    fetchSales();
  }, [user]);

  const addSale = useCallback(
    async (sale: Sale) => {
      if (!user) return;

      await execute(
        () => setSales([sale, ...sales]),
        () => supabase.from('sales').insert({ ...sale, user_id: user.id }),
        () => setSales(sales)
      );
    },
    [sales, user, execute]
  );

  return (
    <SalesContext.Provider value={{ sales, addSale, isLoading }}>
      {children}
    </SalesContext.Provider>
  );
}
```

---

## Row-Level Security (RLS)

### What It Does

```sql
-- Automatically added to every query
WHERE user_id = auth.uid()
```

### User Isolation Guaranteed

```typescript
// Query 1 - Returns only current user's sales
const { data } = await supabase
  .from('sales')
  .select('*');  // RLS: automatically filters by user_id

// Query 2 - Attempt to access other user's data
const { data } = await supabase
  .from('sales')
  .select('*')
  .eq('user_id', 'other-user-id');  // Returns 0 rows (RLS blocks)

// Query 3 - Even admin can't bypass with client
const { data } = await supabase
  .from('sales')
  .select('*')
  .neq('user_id', auth.uid());  // Returns 0 rows (RLS blocks)
```

---

## Data Migration

### localStorage → Supabase Pattern

```typescript
async function migrateLocalStorageData(userId: string) {
  const localSales = JSON.parse(localStorage.getItem('drakvex-sales-v1') || '[]');
  
  if (!localSales.length) return; // No data to migrate

  try {
    // Upload to Supabase
    const { error } = await supabase
      .from('sales')
      .insert(
        localSales.map(sale => ({
          ...sale,
          user_id: userId,
          id: crypto.randomUUID() // Generate new IDs
        }))
      );

    if (error) throw error;

    // Clear localStorage only after successful upload
    localStorage.removeItem('drakvex-sales-v1');
    toast.success('Data migrated to cloud!');
  } catch (error) {
    toast.error('Migration failed - keeping local data');
    throw error;
  }
}
```

### Call on First Login

```typescript
// In auth-context.tsx, after verifyOTP
if (isFirstLogin && hasLocalData) {
  await migrateLocalStorageData(user.id);
}
```

---

## Real-time Updates (Future)

### Subscribe to Changes

```typescript
// In context, after initial fetch
useEffect(() => {
  if (!user) return;

  const subscription = supabase
    .channel(`sales:${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sales',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setSales([payload.new as Sale, ...sales]);
        } else if (payload.eventType === 'UPDATE') {
          setSales(sales.map(s => s.id === payload.new.id ? payload.new : s));
        } else if (payload.eventType === 'DELETE') {
          setSales(sales.filter(s => s.id !== payload.old.id));
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [user]);
```

---

## Common Queries

### Get All Sales for User

```typescript
const { data: sales } = await supabase
  .from('sales')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Get Sales for Date Range

```typescript
const { data: sales } = await supabase
  .from('sales')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', startDate)
  .lte('created_at', endDate)
  .order('created_at', { ascending: false });
```

### Get Sales by Payment Method

```typescript
const { data: sales } = await supabase
  .from('sales')
  .select('*')
  .eq('user_id', userId)
  .eq('payment_method', 'upi');
```

### Get Total Sales Amount

```typescript
const { data } = await supabase
  .from('sales')
  .select('amount')
  .eq('user_id', userId);

const total = data?.reduce((sum, s) => sum + s.amount, 0) || 0;
```

---

## Error Handling

```typescript
try {
  const { data, error } = await supabase
    .from('sales')
    .select('*');

  if (error) {
    // Handle Supabase error
    if (error.code === 'PGRST116') {
      // No rows found
      return [];
    } else if (error.code === 'PGRST201') {
      // Unauthorized (RLS blocked)
      toast.error('Access denied');
    } else {
      toast.error(error.message);
    }
    throw error;
  }

  return data;
} catch (error) {
  console.error('Query failed:', error);
  // Show user-friendly error
  toast.error('Failed to load data');
}
```

---

## TypeScript Types

```typescript
import type { 
  Sale, 
  Expense, 
  CustomerDue, 
  Profile,
  Shop,
  Settings,
  AuthUser 
} from '@/lib/supabase/types';

// Use in component
const sale: Sale = {
  id: 'sale-123',
  user_id: 'user-id',
  shop_id: 'shop-id',
  amount: 1000,
  description: 'Sale',
  payment_method: 'cash',
  reference_number: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
```

---

## Environment Setup

### Required Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Verify Setup

```typescript
import { supabase } from '@/lib/supabase/client';

// In browser console
const { data, error } = await supabase.auth.getSession();
console.log(data.session); // Should show JWT token

// Get current user
const user = await getCurrentUser();
console.log(user); // Should show user info
```

---

## Quick Checklist for Module Migration

When migrating each module (Sales, Expenses, Due):

- [ ] Replace localStorage read with `supabase.from('table').select()`
- [ ] Replace localStorage write with `supabase.from('table').insert/update/delete`
- [ ] Add `user_id: user.id` to all inserts/updates
- [ ] Use `useOptimisticUpdate` for mutations
- [ ] Add error handling for failed operations
- [ ] Test CRUD operations (Create, Read, Update, Delete)
- [ ] Test with slow network (DevTools throttling)
- [ ] Test error scenarios (network down, auth expired)
- [ ] Run migration for existing localStorage data
- [ ] Verify all existing functionality still works

---

## Useful Links

- Supabase Docs: https://supabase.com/docs
- PostgreSQL Queries: https://www.postgresql.org/docs/
- React Hooks: https://react.dev/reference/react
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware

---

**Last Updated:** May 30, 2026  
**For Questions:** Check BACKEND_ARCHITECTURE.md or SUPABASE_SETUP.md
