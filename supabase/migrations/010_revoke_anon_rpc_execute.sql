-- ============================================================
-- 入出庫 RPC の anon 実行権限を明示的に剥奪
--
-- 009 適用後も anon から RPC が呼べる場合があるため、
-- PUBLIC / anon から EXECUTE を REVOKE し直す。
--
-- 実行: Supabase SQL Editor（009 適用済みの後）
-- ============================================================

REVOKE ALL ON FUNCTION apply_inventory_transaction(
  UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ
) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION apply_inventory_transaction_by_part_number(
  TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION apply_inventory_transaction(
  UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ
) TO service_role, authenticated;

GRANT EXECUTE ON FUNCTION apply_inventory_transaction_by_part_number(
  TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ
) TO service_role, authenticated;

DO $$
BEGIN
  RAISE NOTICE 'apply_inventory_transaction RPC の anon 実行権限を剥奪しました。';
END $$;
