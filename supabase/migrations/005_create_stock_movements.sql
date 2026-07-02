-- 入出庫履歴（stock_movements テーブル）
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjust')),
  quantity NUMERIC NOT NULL DEFAULT 0,
  quantity_before NUMERIC NOT NULL DEFAULT 0,
  quantity_after NUMERIC NOT NULL DEFAULT 0,
  part_number TEXT NOT NULL DEFAULT '',
  product_name TEXT NOT NULL DEFAULT '',
  shelf_number TEXT NOT NULL DEFAULT '',
  memo TEXT NOT NULL DEFAULT '',
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_performed_at
  ON stock_movements (performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_part_number
  ON stock_movements (part_number);

CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type
  ON stock_movements (movement_type);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id
  ON stock_movements (product_id);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zaiko_web_stock_movements_allow_all" ON stock_movements;
CREATE POLICY "zaiko_web_stock_movements_allow_all" ON stock_movements
  FOR ALL
  USING (true)
  WITH CHECK (true);
