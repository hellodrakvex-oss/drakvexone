-- Performance Optimization Indexes
-- Created for Phase 3 pre-deployment audit

-- Add index to due_payments to optimize the customer_summary_view joins
CREATE INDEX IF NOT EXISTS idx_due_payments_due_id ON public.due_payments(due_id);

-- Ensure customer_dues status is indexed for pending balances queries
CREATE INDEX IF NOT EXISTS idx_customer_dues_status ON public.customer_dues(shop_id, status);

-- Ensure sales date is indexed for report date range queries
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(shop_id, created_at);

-- Ensure expenses date is indexed for report date range queries
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(shop_id, created_at);
