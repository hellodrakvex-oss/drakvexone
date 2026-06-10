-- Recommended production indexes

-- Sales
CREATE INDEX IF NOT EXISTS idx_sales_user_id_created_at ON public.sales(user_id, created_at);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_user_id_created_at ON public.expenses(user_id, created_at);

-- Customer Dues
CREATE INDEX IF NOT EXISTS idx_customer_dues_user_status_date ON public.customer_dues(user_id, status, due_date);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read_created ON public.notifications(user_id, is_read, created_at);

-- Due Payments
CREATE INDEX IF NOT EXISTS idx_due_payments_due_id ON public.due_payments(due_id);
CREATE INDEX IF NOT EXISTS idx_due_payments_user_id ON public.due_payments(user_id);

-- Shops
CREATE INDEX IF NOT EXISTS idx_shops_user_id ON public.shops(user_id);
