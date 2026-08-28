-- ============================================================
-- 棚卸全体確定 RPC + inventory_transactions の adjust 対応
--
-- 旧Access:
--   T_AUTOMATIC = 実棚数 - T_LAST_VALUE
--   T_NOW_VALUE = T_LAST_VALUE + T_AUTOMATIC
--
-- Web:
--   previous_stock = 確定直前の products.quantity
--   automatic_adjustment = counted_quantity - previous_stock
--   current_stock = counted_quantity
--
-- 注意:
--   - apply_inventory_transaction（通常入出庫）は変更しない
--   - anon には EXECUTE を付与しない
--   - 差異0は履歴を作らない（products.quantity も実質変更なし）
--   - 未入力明細が1件でもあれば全体拒否
--   - 途中失敗時は関数全体がROLLBACK
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

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inventory_counts'
  ) THEN
    RAISE EXCEPTION 'inventory_counts が見つかりません。先に 006 を適用してください。';
  END IF;
END $$;

-- transaction_type に adjust を追加
ALTER TABLE inventory_transactions
  DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;

ALTER TABLE inventory_transactions
  ADD CONSTRAINT inventory_transactions_transaction_type_check
  CHECK (transaction_type IN ('in', 'out', 'adjust'));

-- 種別ごとの数量制約を更新（adjust 追加）
ALTER TABLE inventory_transactions
  DROP CONSTRAINT IF EXISTS inventory_transactions_type_qty_chk;

ALTER TABLE inventory_transactions
  ADD CONSTRAINT inventory_transactions_type_qty_chk CHECK (
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
    OR (
      transaction_type = 'adjust'
      AND inbound_qty = 0
      AND outbound_qty = 0
      -- automatic_adjustment は正負・0可（0行はアプリ/RPC側でINSERTしない）
    )
  );

-- 計算式・非負（current_stock 等）は 008 のまま維持
-- automatic_adjustment の非負制約は付けない

CREATE OR REPLACE FUNCTION complete_inventory_count(
  p_count_id UUID,
  p_staff_code TEXT DEFAULT NULL,
  p_location TEXT DEFAULT '',
  p_comment TEXT DEFAULT NULL
)
RETURNS inventory_counts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count inventory_counts%ROWTYPE;
  v_unentered INTEGER;
  v_missing_product INTEGER;
  v_negative_count INTEGER;
  v_line RECORD;
  v_previous_stock NUMERIC(12, 4);
  v_counted NUMERIC(12, 4);
  v_automatic NUMERIC(12, 4);
  v_staff_code TEXT;
  v_comment TEXT;
  v_product products%ROWTYPE;
BEGIN
  IF p_count_id IS NULL THEN
    RAISE EXCEPTION '棚卸が指定されていません。';
  END IF;

  v_staff_code := NULLIF(BTRIM(COALESCE(p_staff_code, '')), '');

  -- 棚卸ヘッダをロック
  SELECT *
  INTO v_count
  FROM inventory_counts
  WHERE id = p_count_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '棚卸が見つかりません。';
  END IF;

  IF v_count.status = 'completed' THEN
    RAISE EXCEPTION 'この棚卸は既に確定済みです。';
  END IF;

  IF v_count.status IS DISTINCT FROM 'in_progress' THEN
    RAISE EXCEPTION 'この棚卸は確定できません。';
  END IF;

  v_comment := COALESCE(
    NULLIF(BTRIM(COALESCE(p_comment, '')), ''),
    '棚卸確定: ' || COALESCE(v_count.title, '')
  );

  -- 未入力チェック
  SELECT COUNT(*)::INTEGER
  INTO v_unentered
  FROM inventory_count_lines
  WHERE inventory_count_id = p_count_id
    AND counted_quantity IS NULL;

  IF v_unentered > 0 THEN
    RAISE EXCEPTION '未入力の商品が%件あります', v_unentered;
  END IF;

  -- product_id 欠落チェック
  SELECT COUNT(*)::INTEGER
  INTO v_missing_product
  FROM inventory_count_lines
  WHERE inventory_count_id = p_count_id
    AND product_id IS NULL;

  IF v_missing_product > 0 THEN
    RAISE EXCEPTION '製品マスタに紐づかない明細が%件あります', v_missing_product;
  END IF;

  -- 実棚数の負数チェック
  SELECT COUNT(*)::INTEGER
  INTO v_negative_count
  FROM inventory_count_lines
  WHERE inventory_count_id = p_count_id
    AND counted_quantity < 0;

  IF v_negative_count > 0 THEN
    RAISE EXCEPTION '実棚数がマイナスの商品が%件あります', v_negative_count;
  END IF;

  -- 対象 products を id 順で一括ロック（デッドロック防止）
  PERFORM 1
  FROM products p
  WHERE p.id IN (
    SELECT l.product_id
    FROM inventory_count_lines l
    WHERE l.inventory_count_id = p_count_id
      AND l.product_id IS NOT NULL
  )
  ORDER BY p.id
  FOR UPDATE OF p;

  -- 明細ごとに確定時点の在庫で調整
  FOR v_line IN
    SELECT *
    FROM inventory_count_lines
    WHERE inventory_count_id = p_count_id
    ORDER BY part_number, id
  LOOP
    SELECT *
    INTO v_product
    FROM products
    WHERE id = v_line.product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION '対象の製品が見つかりません。（品番：%）', v_line.part_number;
    END IF;

    v_previous_stock := COALESCE(v_product.quantity, 0);
    v_counted := COALESCE(v_line.counted_quantity, 0);

    IF v_counted < 0 THEN
      RAISE EXCEPTION '実棚数は0以上で入力してください。（品番：%）', v_line.part_number;
    END IF;

    v_automatic := v_counted - v_previous_stock;

    -- 差異がある場合のみ adjust 履歴 + quantity 更新
    IF v_automatic <> 0 THEN
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
        v_product.id,
        COALESCE(v_product.shelf_code, v_line.shelf_number, ''),
        COALESCE(v_product.part_number, v_line.part_number, ''),
        v_staff_code,
        NOW(),
        v_previous_stock,
        0,
        0,
        v_counted,
        v_automatic,
        NULL,
        COALESCE(p_location, ''),
        v_comment,
        'adjust'
      );

      UPDATE products
      SET quantity = v_counted
      WHERE id = v_product.id;
    END IF;

    -- 棚卸実施の記録（差異0でも latest_inventory_count は更新）
    UPDATE products
    SET latest_inventory_count = v_counted
    WHERE id = v_product.id;

    -- 明細の variance を確定時点の previous 基準で揃え直す（任意だが整合のため）
    UPDATE inventory_count_lines
    SET
      variance = v_counted - v_previous_stock,
      updated_at = NOW()
    WHERE id = v_line.id;
  END LOOP;

  UPDATE inventory_counts
  SET
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_count_id
  RETURNING * INTO v_count;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION complete_inventory_count(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION complete_inventory_count(UUID, TEXT, TEXT, TEXT) FROM anon;

GRANT EXECUTE ON FUNCTION complete_inventory_count(UUID, TEXT, TEXT, TEXT)
  TO service_role, authenticated;

COMMENT ON FUNCTION complete_inventory_count(UUID, TEXT, TEXT, TEXT) IS
  '棚卸全体を1トランザクションで確定。差異0は履歴スキップ。未入力があれば全体拒否。';

DO $$
BEGIN
  RAISE NOTICE 'complete_inventory_count RPC と adjust 制約を作成しました。';
END $$;

NOTIFY pgrst, 'reload schema';
