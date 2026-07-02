-- 棚卸（inventory_counts / inventory_count_lines テーブル）
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  memo TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_count_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_count_id UUID NOT NULL
    REFERENCES inventory_counts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  part_number TEXT NOT NULL DEFAULT '',
  product_name TEXT NOT NULL DEFAULT '',
  shelf_number TEXT NOT NULL DEFAULT '',
  book_quantity NUMERIC NOT NULL DEFAULT 0,
  counted_quantity NUMERIC,
  variance NUMERIC,
  memo TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_counts_count_date
  ON inventory_counts (count_date DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_count_lines_count_id
  ON inventory_count_lines (inventory_count_id);

CREATE OR REPLACE FUNCTION zaiko_web_update_inventory_counts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS zaiko_web_set_inventory_counts_updated_at ON inventory_counts;
CREATE TRIGGER zaiko_web_set_inventory_counts_updated_at
  BEFORE UPDATE ON inventory_counts
  FOR EACH ROW
  EXECUTE FUNCTION zaiko_web_update_inventory_counts_updated_at();

DROP TRIGGER IF EXISTS zaiko_web_set_inventory_count_lines_updated_at ON inventory_count_lines;
CREATE TRIGGER zaiko_web_set_inventory_count_lines_updated_at
  BEFORE UPDATE ON inventory_count_lines
  FOR EACH ROW
  EXECUTE FUNCTION zaiko_web_update_inventory_counts_updated_at();

ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zaiko_web_inventory_counts_allow_all" ON inventory_counts;
CREATE POLICY "zaiko_web_inventory_counts_allow_all" ON inventory_counts
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "zaiko_web_inventory_count_lines_allow_all" ON inventory_count_lines;
CREATE POLICY "zaiko_web_inventory_count_lines_allow_all" ON inventory_count_lines
  FOR ALL USING (true) WITH CHECK (true);
