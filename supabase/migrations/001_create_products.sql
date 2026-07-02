-- ============================================================
-- products テーブル作成SQL
--
-- products テーブルがまだ無い場合に実行してください。
-- （Supabase Table Editor に products が無い場合）
--
-- テーブルが既にある場合は 002_upgrade_existing_products.sql を使用。
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelf_number TEXT NOT NULL DEFAULT '',
  supplier TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  part_number TEXT NOT NULL DEFAULT '',
  product_name TEXT NOT NULL DEFAULT '',
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  reorder_point NUMERIC(12, 2) NOT NULL DEFAULT 0,
  memo TEXT NOT NULL DEFAULT '',
  last_inventory_count NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_part_number ON products (part_number);
CREATE INDEX IF NOT EXISTS idx_products_product_name ON products (product_name);
CREATE INDEX IF NOT EXISTS idx_products_shelf_number ON products (shelf_number);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products (supplier);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION calculate_stock_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.stock_amount = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_stock_amount ON products;
CREATE TRIGGER set_products_stock_amount
  BEFORE INSERT OR UPDATE OF quantity, unit_price ON products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_stock_amount();

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access for now" ON products;
CREATE POLICY "Allow all access for now" ON products
  FOR ALL
  USING (true)
  WITH CHECK (true);
