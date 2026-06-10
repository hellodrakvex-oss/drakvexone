# Quick Add System - Setup Instructions

## Step 1: Run SQL Migration

The Quick Add system requires a new table in your Supabase database. Follow these steps:

### Option A: Run Complete Migration (Recommended)

1. **Go to Supabase Dashboard**
   - URL: `https://app.supabase.com`
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in left sidebar
   - Click **New Query**

3. **Copy the SQL Migration**
   - Open file: [QUICK_ADD_MIGRATION.sql](QUICK_ADD_MIGRATION.sql)
   - Copy ALL the SQL code

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click **Run** button
   - You should see: "No rows returned" (success indicator)

5. **Verify Table Created**
   - Go to **Table Editor** in left sidebar
   - Look for `quick_add_items` table
   - Should show columns: id, user_id, shop_id, name, price, icon, sort_order, is_active, created_at, updated_at

### Option B: Run Migration from migrations/001_init_schema.sql

If you prefer to run just the quick_add_items section:

1. Open [migrations/001_init_schema.sql](migrations/001_init_schema.sql)
2. Find the section labeled "8. QUICK_ADD_ITEMS TABLE (Dynamic Quick Add Management)"
3. Copy that section (about 45 lines)
4. Paste into Supabase SQL Editor
5. Click Run

---

## Step 2: Verify in App

1. **Reload the browser**
   - Go to http://localhost:3000/dashboard/sales
   - Hard refresh: `Ctrl+F5` or `Cmd+Shift+R`

2. **Check Quick Add Section**
   - Should show: "No quick add items configured"
   - Should show: "Set up Quick Add Items" button
   - No error toast anymore

3. **Expected Status**
   - ✅ No console errors
   - ✅ Empty state message displays
   - ✅ Settings button (gear icon) visible

---

## Step 3: Initialize Default Items (Optional)

If you want to populate default Quick Add items:

### Via UI (Recommended)

1. Click Settings button (gear icon) in Quick Add section
2. Click "Add New Item" button
3. Enter details:
   - Name: "Tea"
   - Price: "25"
   - Icon: "coffee"
4. Click "Save Item"
5. Repeat for Coffee (40), Snacks (60), Combo (150)

### Via SQL (Quick Setup)

If you want to seed defaults via SQL:

```sql
-- First, get your user_id and shop_id
SELECT 'Your User ID:', auth.uid();
SELECT 'Your Shop ID:', id FROM shops WHERE user_id = auth.uid() LIMIT 1;

-- Replace YOUR_USER_ID and YOUR_SHOP_ID in the query below:
INSERT INTO quick_add_items (user_id, shop_id, name, price, icon, sort_order, is_active)
VALUES
  ('YOUR_USER_ID', 'YOUR_SHOP_ID', 'Tea', 25, 'coffee', 0, true),
  ('YOUR_USER_ID', 'YOUR_SHOP_ID', 'Coffee', 40, 'cup-soda', 1, true),
  ('YOUR_USER_ID', 'YOUR_SHOP_ID', 'Snacks', 60, 'utensils-crossed', 2, true),
  ('YOUR_USER_ID', 'YOUR_SHOP_ID', 'Combo', 150, 'zap', 3, true);
```

---

## Step 4: Test Quick Add Feature

1. **Click Tea Button**
   - Should open Quantity Selector Modal
   - Options: 1, 2, 3, 4, 5, 6, Others
   - Select "3"
   - Should create sale: "Tea × 3" for ₹75

2. **Click "Others" Button**
   - Should open Custom Quantity Modal
   - Can override name and price
   - Example: "Special Tea", ₹35, Qty 12 → Sale created for ₹420

3. **Test Edit**
   - Click Settings icon
   - Click Edit button on any item
   - Change name and/or price
   - Click Save
   - Item updates instantly

4. **Test Delete**
   - Click Settings icon
   - Click Delete button (trash icon)
   - Item removed from list
   - Toast: "Quick Add item deleted"

5. **Test Reorder**
   - Click Settings icon
   - Drag items by the GripVertical icon
   - Drop to new position
   - Order updates instantly

---

## Troubleshooting

### Issue: "Could not find the table 'public.quick_add_items'"

**Solution:** Run the SQL migration (see Step 1)

### Issue: "No quick add items configured" (Empty State)

**Solution:** This is expected after migration. Add items via UI or SQL (see Step 3)

### Issue: Settings button not visible

**Solution:** 
- Hard refresh browser: `Ctrl+F5`
- Check browser console for errors
- Verify QuickAddProvider is in component tree

### Issue: Can't save items

**Solution:**
- Verify user is logged in
- Check that user has a shop (Table Editor → shops)
- Verify RLS policies are enabled (Table Editor → quick_add_items → RLS)

---

## Architecture Overview

```
Sales Page
  ↓
SalesQuickActions Component
  ↓
useQuickAdd() Context
  ↓
Supabase quick_add_items Table
  ↓
RLS Policies (user_id filter)
```

**Data Flow:**
```
Click Quick Add Button
  → useQuickAdd().items (from context)
  → QuantitySelectorModal opens
  → Select quantity
  → Calculate amount = price × qty
  → Call addSale() (SalesContext)
  → Sale created in Supabase
  → Dashboard updates via subscription
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| View migration SQL | [QUICK_ADD_MIGRATION.sql](QUICK_ADD_MIGRATION.sql) |
| View implementation docs | [QUICK_ADD_SYSTEM_IMPLEMENTATION.md](QUICK_ADD_SYSTEM_IMPLEMENTATION.md) |
| Add item via UI | Settings icon → "Add New Item" |
| Edit item | Settings icon → Edit button |
| Delete item | Settings icon → Delete button (trash) |
| Reorder items | Settings icon → Drag by GripVertical icon |
| Test quick add | Click any quick add button |
| Reset items | Delete all items, re-add via UI |

---

## Next Steps

After migration is complete:

1. ✅ Table created in Supabase
2. ✅ RLS policies enabled
3. ✅ Indexes created for performance
4. ✅ App reloaded and showing empty state
5. Add Quick Add items via UI or SQL
6. Test all CRUD operations
7. Create sales via Quick Add buttons
8. Verify Dashboard updates in real-time

---

## Questions?

If you encounter issues:

1. Check browser console for errors: `F12` → Console tab
2. Check Supabase logs: Project → Logs
3. Verify table exists: Supabase → Table Editor → quick_add_items
4. Verify RLS policies: Supabase → Table Editor → quick_add_items → RLS
5. Check migration file: [QUICK_ADD_MIGRATION.sql](QUICK_ADD_MIGRATION.sql)

**Status: Ready for migration** ✅
