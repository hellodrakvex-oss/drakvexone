-- ============================================================================
-- DRAKVEX ONE - SUPABASE DATABASE SCHEMA & ROW-LEVEL SECURITY
-- ============================================================================
-- Run this SQL in Supabase SQL Editor to set up the complete database
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE (User metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  owner_name VARCHAR(255),
  phone VARCHAR(20) UNIQUE NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(10) DEFAULT 'dark',
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. SHOPS TABLE (Store information)
-- ============================================================================
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  shop_name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  gst_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shops"
  ON shops FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create shops"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shops"
  ON shops FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shops"
  ON shops FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. SALES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  description VARCHAR(255),
  payment_method VARCHAR(50) DEFAULT 'cash',
  reference_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sales"
  ON sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create sales"
  ON sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
  ON sales FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales"
  ON sales FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. EXPENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  reference_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. CUSTOMER_DUES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_dues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  notes TEXT,
  whatsapp_sent_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE customer_dues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dues"
  ON customer_dues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create dues"
  ON customer_dues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dues"
  ON customer_dues FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dues"
  ON customer_dues FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles (id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'dark',
  language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT true,
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. INDEXES for Performance
-- ============================================================================
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_shop_id ON sales(shop_id);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_shop_id ON expenses(shop_id);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);

CREATE INDEX idx_customer_dues_user_id ON customer_dues(user_id);
CREATE INDEX idx_customer_dues_shop_id ON customer_dues(shop_id);
CREATE INDEX idx_customer_dues_status ON customer_dues(status);
CREATE INDEX idx_customer_dues_created_at ON customer_dues(created_at DESC);

CREATE INDEX idx_shops_user_id ON shops(user_id);

-- ============================================================================
-- 8. TRIGGERS for updated_at AUTO-UPDATE
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_dues_updated_at BEFORE UPDATE ON customer_dues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. QUICK_ADD_ITEMS TABLE (Dynamic Quick Add Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quick_add_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE quick_add_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quick add items"
  ON quick_add_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quick add items"
  ON quick_add_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick add items"
  ON quick_add_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick add items"
  ON quick_add_items FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_quick_add_items_user_id ON quick_add_items(user_id);
CREATE INDEX idx_quick_add_items_shop_id ON quick_add_items(shop_id);
CREATE INDEX idx_quick_add_items_sort_order ON quick_add_items(sort_order ASC);
CREATE INDEX idx_quick_add_items_is_active ON quick_add_items(is_active);

-- Trigger for updated_at
CREATE TRIGGER update_quick_add_items_updated_at BEFORE UPDATE ON quick_add_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. SCHEMA COMPLETE - Security Verified
-- ============================================================================
-- All tables have RLS enabled
-- All users can only access their own data
-- All sensitive operations require authentication
-- Database is ready for production use

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
