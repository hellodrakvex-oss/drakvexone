-- ============================================================================
-- QUICK ADD ITEMS TABLE MIGRATION
-- ============================================================================
-- Copy and paste this SQL into your Supabase SQL Editor to create the table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================================

-- Create quick_add_items table
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

-- Enable RLS
ALTER TABLE quick_add_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
CREATE INDEX IF NOT EXISTS idx_quick_add_items_user_id ON quick_add_items(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_add_items_shop_id ON quick_add_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_quick_add_items_sort_order ON quick_add_items(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_quick_add_items_is_active ON quick_add_items(is_active);

-- Trigger for updated_at auto-update
CREATE TRIGGER IF NOT EXISTS update_quick_add_items_updated_at BEFORE UPDATE ON quick_add_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON quick_add_items TO authenticated;

-- ============================================================================
-- OPTIONAL: Seed default items for testing (run after table creation)
-- ============================================================================
-- Get your user_id from: SELECT auth.uid();
-- Get your shop_id from: SELECT id FROM shops WHERE user_id = YOUR_USER_ID;
-- Then run:
-- INSERT INTO quick_add_items (user_id, shop_id, name, price, icon, sort_order, is_active)
-- VALUES
--   ('YOUR_USER_ID', 'YOUR_SHOP_ID', 'Tea', 25, 'coffee', 0, true),
--   ('YOUR_USER_ID', 'YOUR_SHOP_ID', 'Coffee', 40, 'cup-soda', 1, true),
--   ('YOUR_USER_ID', 'YOUR_SHOP_ID', 'Snacks', 60, 'utensils-crossed', 2, true),
--   ('YOUR_USER_ID', 'YOUR_SHOP_ID', 'Combo', 150, 'zap', 3, true);
-- ============================================================================
