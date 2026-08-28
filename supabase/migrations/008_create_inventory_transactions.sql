-- ============================================================
-- 旧Access T_IN_OUT 準拠の入出庫履歴テーブル
--
-- 対象: 既存 Zaiko STARTER プロジェクト
-- products.quantity = 現在庫（T_FIELD6）
-- inventory_transactions.current_stock = 処理後確定在庫（T_NOW_VALUE）
--
-- 計算式:
--   current_stock = previous_stock + inbound_qty - outbound_qty + automatic_adjustment
--
-- 注意:
--   - 旧Access T_IN_OUT 過去履歴の移行は別途（本マイグレーションでは投入しない）
--   - 既存 products（1678件）は変更しない
--   - stock_movements は触らない（空テーブル前提）
--
-- 実行: Supabase SQL Editor で実行（009 の前に実行）
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    RAISE EXCEPTION 'products テーブルが見つかりません。先に 007_access_products_schema.sql を実行してください。';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- T_FIELD1 / T_FIELD4（TEXT のまま、スナップショット）
  shelf_code TEXT NOT NULL DEFAULT '',
  part_number TEXT NOT NULL DEFAULT '',

  -- T_PIC（第2段階: NULL / 空欄可。将来 T_PIC_MASTER と紐付け）
  staff_code TEXT NULL,

  -- T_TIME
  transaction_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- T_LAST_VALUE / T_IN_VALUE / T_OUT_VALUE / T_NOW_VALUE / T_AUTOMATIC
  previous_stock NUMERIC(12, 4) NOT NULL DEFAULT 0,
  inbound_qty NUMERIC(12, 4) NOT NULL DEFAULT 0,
  outbound_qty NUMERIC(12, 4) NOT NULL DEFAULT 0,
  current_stock NUMERIC(12, 4) NOT NULL DEFAULT 0,
  automatic_adjustment NUMERIC(12, 4) NOT NULL DEFAULT 0,

  -- T_MANUAL（通常入出庫は NULL）
  manual_value NUMERIC(12, 4) NULL,

  -- T_PLACE / T_COMMENT
  location TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL DEFAULT '',

  -- Web内部区分（第2段階: in / out のみ）
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- automatic_adjustment は正負どちらも可（棚卸: 実棚数 - T_LAST_VALUE、履歴移行）
  CONSTRAINT inventory_transactions_qty_bounds_chk CHECK (
    previous_stock >= 0
    AND inbound_qty >= 0
    AND outbound_qty >= 0
    AND current_stock >= 0
  ),

  CONSTRAINT inventory_transactions_type_qty_chk CHECK (
    (
      transaction_type = 'in'
      AND inbound_qty > 0
      AND outbound_qty = 0
      AND automatic_adjustment = 0
    )
    OR (
      transaction_type = 'out'
      AND outbound_qty > 0
      AND inbound_qty = 0
      AND automatic_adjustment = 0
    )
  ),

  CONSTRAINT inventory_transactions_stock_formula_chk CHECK (
    current_stock = previous_stock + inbound_qty - outbound_qty + automatic_adjustment
  )
);

COMMENT ON TABLE inventory_transactions IS '旧Access T_IN_OUT 相当の入出庫履歴';
COMMENT ON COLUMN inventory_transactions.previous_stock IS 'T_LAST_VALUE: 処理前在庫';
COMMENT ON COLUMN inventory_transactions.inbound_qty IS 'T_IN_VALUE: 入庫数量';
COMMENT ON COLUMN inventory_transactions.outbound_qty IS 'T_OUT_VALUE: 出庫数量';
COMMENT ON COLUMN inventory_transactions.current_stock IS 'T_NOW_VALUE: 処理後確定在庫';
COMMENT ON COLUMN inventory_transactions.automatic_adjustment IS 'T_AUTOMATIC: 自動調整（正負可。棚卸=実棚数-T_LAST_VALUE。第2段階入出庫RPCは0）';
COMMENT ON COLUMN inventory_transactions.manual_value IS 'T_MANUAL: 手動値（通常入出庫はNULL）';
COMMENT ON COLUMN inventory_transactions.staff_code IS 'T_PIC: 担当者コード（NULL/空欄可）';
COMMENT ON COLUMN inventory_transactions.transaction_at IS 'T_TIME: 処理日時';
COMMENT ON COLUMN inventory_transactions.location IS 'T_PLACE: 場所';
COMMENT ON COLUMN inventory_transactions.comment IS 'T_COMMENT: 備考';

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_transaction_at
  ON inventory_transactions (transaction_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_part_number
  ON inventory_transactions (part_number);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_shelf_code
  ON inventory_transactions (shelf_code);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id
  ON inventory_transactions (product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_part_number_at
  ON inventory_transactions (part_number, transaction_at DESC);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- ブラウザ（anon / authenticated）からの直接書き込みは禁止。
-- 履歴参照（SELECT）のみ許可。INSERT は apply_inventory_transaction RPC（SECURITY DEFINER）経由。
DROP POLICY IF EXISTS "zaiko_web_inventory_transactions_allow_all" ON inventory_transactions;
DROP POLICY IF EXISTS "zaiko_web_inventory_transactions_select" ON inventory_transactions;
DROP POLICY IF EXISTS "zaiko_web_inventory_transactions_insert" ON inventory_transactions;
DROP POLICY IF EXISTS "zaiko_web_inventory_transactions_update" ON inventory_transactions;
DROP POLICY IF EXISTS "zaiko_web_inventory_transactions_delete" ON inventory_transactions;

CREATE POLICY "zaiko_web_inventory_transactions_select" ON inventory_transactions
  FOR SELECT
  USING (true);

-- table-level: anon / authenticated は SELECT のみ
REVOKE ALL ON TABLE inventory_transactions FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE inventory_transactions FROM anon, authenticated;
GRANT SELECT ON TABLE inventory_transactions TO anon, authenticated;
GRANT ALL ON TABLE inventory_transactions TO service_role;

DO $$
BEGIN
  RAISE NOTICE 'inventory_transactions テーブルを作成しました（SELECTのみ・書き込みはRPC経由）。';
END $$;
