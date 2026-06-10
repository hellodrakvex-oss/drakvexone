-- Drakvex One MVP Schema Migration
-- Run this in the Supabase SQL Editor

-- Set up updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-------------------------------------------------------------------
-- 1. PROFILES TABLE
-------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name VARCHAR(255),
  phone VARCHAR(255),
  language VARCHAR(10) DEFAULT 'en'::character varying NOT NULL,
  theme VARCHAR(10) DEFAULT 'dark'::character varying NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR'::character varying NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-------------------------------------------------------------------
-- 2. SHOPS TABLE
-------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(255),
  phone VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  gst_number VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger for shops
CREATE TRIGGER update_shops_updated_at
BEFORE UPDATE ON public.shops
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Indexes for shops
CREATE INDEX idx_shops_user_id ON public.shops(user_id);

-- RLS for shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own shops" ON public.shops FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shops" ON public.shops FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shops" ON public.shops FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shops" ON public.shops FOR DELETE USING (auth.uid() = user_id);

-------------------------------------------------------------------
-- 3. SALES TABLE
-------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger for sales
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Indexes for sales
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sales_shop_id ON public.sales(shop_id);
CREATE INDEX idx_sales_created_at ON public.sales(created_at);

-- RLS for sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sales" ON public.sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sales" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sales" ON public.sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sales" ON public.sales FOR DELETE USING (auth.uid() = user_id);

-------------------------------------------------------------------
-- 4. EXPENSES TABLE
-------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  reference_number VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger for expenses
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Indexes for expenses
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_shop_id ON public.expenses(shop_id);
CREATE INDEX idx_expenses_created_at ON public.expenses(created_at);

-- RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-------------------------------------------------------------------
-- 5. CUSTOMER DUES TABLE
-------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_dues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'::character varying NOT NULL CHECK (status IN ('pending', 'paid')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger for customer_dues
CREATE TRIGGER update_customer_dues_updated_at
BEFORE UPDATE ON public.customer_dues
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Indexes for customer_dues
CREATE INDEX idx_customer_dues_user_id ON public.customer_dues(user_id);
CREATE INDEX idx_customer_dues_shop_id ON public.customer_dues(shop_id);
CREATE INDEX idx_customer_dues_status ON public.customer_dues(status);
CREATE INDEX idx_customer_dues_due_date ON public.customer_dues(due_date);

-- RLS for customer_dues
ALTER TABLE public.customer_dues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own customer_dues" ON public.customer_dues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customer_dues" ON public.customer_dues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customer_dues" ON public.customer_dues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own customer_dues" ON public.customer_dues FOR DELETE USING (auth.uid() = user_id);

-------------------------------------------------------------------
-- 6. SETTINGS TABLE
-------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme VARCHAR(10) DEFAULT 'dark'::character varying NOT NULL,
  language VARCHAR(10) DEFAULT 'en'::character varying NOT NULL,
  notifications_enabled BOOLEAN DEFAULT true NOT NULL,
  whatsapp_enabled BOOLEAN DEFAULT false NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR'::character varying NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger for settings
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Indexes for settings
CREATE INDEX idx_settings_user_id ON public.settings(user_id);

-- RLS for settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.settings FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 7. GRANTS - Allow authenticated users to access tables
-- ============================================================================
-- RLS policies control WHICH rows a user can access.
-- GRANTs control WHETHER the role can access the table at all.
-- Both are required for Supabase to work correctly.

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- Finish Migration
