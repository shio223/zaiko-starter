-- ============================================================
-- previous_stock の負数許可（旧Access移行の負在庫からの棚卸対応）
--
-- 背景:
--   既存 products.quantity に負在庫が存在する（移行データ）。
--   棚卸確定時 previous_stock = products.quantity のため、
--   previous_stock >= 0 制約があると adjust 履歴を書けない。
--
-- 変更:
--   inventory_transactions_qty_bounds_chk を差し替え
--   previous_stock のみ負数可
--   inbound_qty / outbound_qty / current_stock は >= 0 を維持
--
-- 変更しない:
--   - products.quantity の既存負在庫
--   - apply_inventory_transaction（出庫マイナス禁止）
--   - complete_inventory_count のロジック
--   - automatic_adjustment（正負可のまま）
--
-- 実行: Supabase SQL Editor（ご確認後）
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inventory_transactions'
  ) THEN
    RAISE EXCEPTION 'inventory_transactions が見つかりません。先に 008 を適用してください。';
  END IF;
END $$;

ALTER TABLE inventory_transactions
  DROP CONSTRAINT IF EXISTS inventory_transactions_qty_bounds_chk;

ALTER TABLE inventory_transactions
  ADD CONSTRAINT inventory_transactions_qty_bounds_chk CHECK (
    inbound_qty >= 0
    AND outbound_qty >= 0
    AND current_stock >= 0
  );

COMMENT ON COLUMN inventory_transactions.previous_stock IS
  'T_LAST_VALUE: 処理前在庫（負数可・旧データ移行分）';

DO $$
BEGIN
  RAISE NOTICE 'inventory_transactions.previous_stock の負数を許可しました（current_stock 等は >= 0 維持）。';
END $$;

NOTIFY pgrst, 'reload schema';
