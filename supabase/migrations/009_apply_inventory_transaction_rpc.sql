-- ============================================================
-- 入出庫 RPC（在庫更新 + 履歴 INSERT を1トランザクションで実行）
--
-- 対象: 既存 Zaiko STARTER プロジェクト
-- 前提: 008_create_inventory_transactions.sql 適用済み
--
-- 仕様:
--   - 入庫: products.quantity を加算
--   - 出庫: products.quantity を減算
--   - 同時に inventory_transactions に履歴を保存
--   - products を FOR UPDATE で行ロック（同時処理でもマイナス在庫を防止）
--   - 出庫で在庫不足の場合はロールバックし例外を返す
--
-- 実行: Supabase SQL Editor で実行（008 の後に実行）
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inventory_transactions'
  ) THEN
    RAISE EXCEPTION 'inventory_transactions テーブルが見つかりません。先に 008_create_inventory_transactions.sql を実行してください。';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION apply_inventory_transaction(
  p_product_id UUID,
  p_transaction_type TEXT,
  p_quantity NUMERIC,
  p_staff_code TEXT DEFAULT NULL,
  p_location TEXT DEFAULT '',
  p_comment TEXT DEFAULT '',
  p_transaction_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS inventory_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product products%ROWTYPE;
  v_previous_stock NUMERIC(12, 4);
  v_inbound_qty NUMERIC(12, 4);
  v_outbound_qty NUMERIC(12, 4);
  v_automatic_adjustment NUMERIC(12, 4) := 0;
  v_current_stock NUMERIC(12, 4);
  v_staff_code TEXT;
  v_row inventory_transactions%ROWTYPE;
BEGIN
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION '対象の製品が指定されていません。';
  END IF;

  IF p_transaction_type IS NULL OR p_transaction_type NOT IN ('in', 'out') THEN
    RAISE EXCEPTION 'transaction_type は in または out を指定してください。';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION '数量は1以上で入力してください。';
  END IF;

  v_staff_code := NULLIF(BTRIM(COALESCE(p_staff_code, '')), '');

  SELECT *
  INTO v_product
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '対象の製品が見つかりません。';
  END IF;

  v_previous_stock := COALESCE(v_product.quantity, 0);

  IF p_transaction_type = 'in' THEN
    v_inbound_qty := p_quantity;
    v_outbound_qty := 0;
  ELSE
    v_inbound_qty := 0;
    v_outbound_qty := p_quantity;
  END IF;

  v_current_stock := v_previous_stock + v_inbound_qty - v_outbound_qty + v_automatic_adjustment;

  IF p_transaction_type = 'out' AND v_outbound_qty > v_previous_stock THEN
    RAISE EXCEPTION '現在庫が不足しています（現在庫：%）', trim_scale(v_previous_stock);
  END IF;

  IF v_current_stock < 0 THEN
    RAISE EXCEPTION '現在庫が不足しています（現在庫：%）', trim_scale(v_previous_stock);
  END IF;

  UPDATE products
  SET quantity = v_current_stock
  WHERE id = p_product_id;

  INSERT INTO inventory_transactions (
    product_id,
    shelf_code,
    part_number,
    staff_code,
    transaction_at,
    previous_stock,
    inbound_qty,
    outbound_qty,
    current_stock,
    automatic_adjustment,
    manual_value,
    location,
    comment,
    transaction_type
  )
  VALUES (
    p_product_id,
    COALESCE(v_product.shelf_code, ''),
    COALESCE(v_product.part_number, ''),
    v_staff_code,
    COALESCE(p_transaction_at, NOW()),
    v_previous_stock,
    v_inbound_qty,
    v_outbound_qty,
    v_current_stock,
    v_automatic_adjustment,
    NULL,
    COALESCE(p_location, ''),
    COALESCE(p_comment, ''),
    p_transaction_type
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION apply_inventory_transaction_by_part_number(
  p_part_number TEXT,
  p_transaction_type TEXT,
  p_quantity NUMERIC,
  p_staff_code TEXT DEFAULT NULL,
  p_location TEXT DEFAULT '',
  p_comment TEXT DEFAULT '',
  p_transaction_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS inventory_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_part_number TEXT;
  v_product_id UUID;
BEGIN
  v_part_number := BTRIM(COALESCE(p_part_number, ''));

  IF v_part_number = '' THEN
    RAISE EXCEPTION '品番が空です。';
  END IF;

  SELECT id
  INTO v_product_id
  FROM products
  WHERE part_number = v_part_number
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION '品番「%」は未登録です。', v_part_number;
  END IF;

  RETURN apply_inventory_transaction(
    v_product_id,
    p_transaction_type,
    p_quantity,
    p_staff_code,
    p_location,
    p_comment,
    p_transaction_at
  );
END;
$$;

-- anon からの直接実行は禁止（在庫書き換えRPC）
-- 現行Web: Next.js API Route が service_role で呼び出す
-- 将来 Supabase Auth 導入時: authenticated ロールからも呼び出し可能
REVOKE ALL ON FUNCTION apply_inventory_transaction(
  UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ
) FROM PUBLIC;

REVOKE ALL ON FUNCTION apply_inventory_transaction_by_part_number(
  TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION apply_inventory_transaction(
  UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ
) TO service_role, authenticated;

GRANT EXECUTE ON FUNCTION apply_inventory_transaction_by_part_number(
  TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ
) TO service_role, authenticated;

DO $$
BEGIN
  RAISE NOTICE 'apply_inventory_transaction RPC を作成しました。';
END $$;
