-- Phase 2.7A Database Schema Changes: Customer Management
-- Run this in Supabase SQL Editor

-- 1. Add customer fields to sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Create indexes to speed up customer grouping
CREATE INDEX IF NOT EXISTS idx_sales_customer ON public.sales(shop_id, customer_name, phone);
CREATE INDEX IF NOT EXISTS idx_dues_customer ON public.customer_dues(shop_id, customer_name, phone);

-- 2. Create Customer Summary View (security_invoker = true ensures RLS is enforced per user)
DROP VIEW IF EXISTS public.customer_summary_view;
CREATE OR REPLACE VIEW public.customer_summary_view
WITH (security_invoker = true)
AS
WITH combined_data AS (
  -- Sales data
  SELECT 
    shop_id,
    customer_name,
    phone,
    amount AS sale_amount,
    0 AS due_amount,
    0 AS due_paid_amount,
    created_at AS activity_date,
    created_at AS purchase_date,
    NULL::TIMESTAMPTZ AS due_date,
    1 AS is_transaction
  FROM public.sales
  WHERE customer_name IS NOT NULL AND customer_name != ''
  
  UNION ALL
  
  -- Dues data
  SELECT
    shop_id,
    customer_name,
    phone,
    0 AS sale_amount,
    amount AS due_amount,
    0 AS due_paid_amount, 
    created_at AS activity_date,
    NULL::TIMESTAMPTZ AS purchase_date,
    created_at AS due_date,
    1 AS is_transaction
  FROM public.customer_dues
  WHERE customer_name IS NOT NULL AND customer_name != ''

  UNION ALL

  -- Due Payments data
  SELECT
    cd.shop_id,
    cd.customer_name,
    cd.phone,
    0 AS sale_amount,
    0 AS due_amount,
    dp.amount AS due_paid_amount,
    dp.payment_date AS activity_date,
    NULL::TIMESTAMPTZ AS purchase_date,
    NULL::TIMESTAMPTZ AS due_date,
    0 AS is_transaction
  FROM public.due_payments dp
  JOIN public.customer_dues cd ON dp.due_id = cd.id
  WHERE cd.customer_name IS NOT NULL AND cd.customer_name != ''
)
SELECT 
  -- Generate a unique ID for the customer row
  md5(shop_id::text || '|' || customer_name || '|' || COALESCE(phone, '')) AS id,
  shop_id,
  customer_name,
  phone,
  SUM(sale_amount) AS total_sales,
  SUM(sale_amount) + SUM(due_paid_amount) AS total_paid,
  SUM(due_amount) - SUM(due_paid_amount) AS total_due,
  SUM(is_transaction) AS transaction_count,
  MAX(activity_date) AS last_activity,
  MIN(activity_date) AS customer_since,
  MAX(purchase_date) AS last_purchase_date,
  MAX(due_date) AS last_due_date
FROM combined_data
GROUP BY shop_id, customer_name, phone;

-- 3. RLS for the View? Views don't have RLS natively in postgres unless they are security invoker views or we apply it to underlying tables.
-- The underlying tables (sales, customer_dues, due_payments) ALREADY have RLS applied.
-- So querying customer_summary_view will automatically enforce RLS based on the executing user's access to underlying tables!

-- Optional: Grant select to authenticated users (so the API can query it)
GRANT SELECT ON public.customer_summary_view TO authenticated;
