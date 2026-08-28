-- ============================================================
-- 月別移動量集計 RPC（旧Access Q_CONSUMPTION / Q_CROSS_CONSUMPTION_*）
--
-- Q_CROSS_CONSUMPTION_IN:  Sum(T_IN_VALUE)  by 品番・月
-- Q_CROSS_CONSUMPTION_OUT: Sum(T_OUT_VALUE) by 品番・月
-- Q_CONSUMPTION: 商品マスタと結合して商品別月次移動を表示
--
-- 実行: Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION get_monthly_movement_months()
RETURNS TABLE (year_month TEXT)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT
    to_char(transaction_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM') AS year_month
  FROM inventory_transactions
  ORDER BY year_month DESC;
$$;

CREATE OR REPLACE FUNCTION get_monthly_movements(
  p_year_month TEXT DEFAULT NULL,
  p_part_number TEXT DEFAULT NULL,
  p_product_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  year_month TEXT,
  part_number TEXT,
  product_name TEXT,
  shelf_number TEXT,
  in_quantity NUMERIC,
  out_quantity NUMERIC,
  net_quantity NUMERIC
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    to_char(t.transaction_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM') AS year_month,
    t.part_number,
    COALESCE(MAX(p.name), '') AS product_name,
    COALESCE(MAX(NULLIF(p.shelf_code, '')), MAX(NULLIF(t.shelf_code, '')), '') AS shelf_number,
    COALESCE(SUM(t.inbound_qty), 0) AS in_quantity,
    COALESCE(SUM(t.outbound_qty), 0) AS out_quantity,
    COALESCE(SUM(t.inbound_qty), 0) - COALESCE(SUM(t.outbound_qty), 0) AS net_quantity
  FROM inventory_transactions t
  LEFT JOIN products p ON p.part_number = t.part_number
  WHERE
    (
      p_year_month IS NULL
      OR BTRIM(p_year_month) = ''
      OR to_char(t.transaction_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM') = BTRIM(p_year_month)
    )
    AND (
      p_part_number IS NULL
      OR BTRIM(p_part_number) = ''
      OR t.part_number ILIKE '%' || BTRIM(p_part_number) || '%'
    )
    AND (
      p_product_name IS NULL
      OR BTRIM(p_product_name) = ''
      OR COALESCE(p.name, '') ILIKE '%' || BTRIM(p_product_name) || '%'
    )
  GROUP BY
    to_char(t.transaction_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM'),
    t.part_number
  ORDER BY
    year_month DESC,
    t.part_number ASC;
$$;

REVOKE ALL ON FUNCTION get_monthly_movement_months() FROM PUBLIC;
REVOKE ALL ON FUNCTION get_monthly_movements(TEXT, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_monthly_movement_months() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_monthly_movements(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

DO $$
BEGIN
  RAISE NOTICE 'get_monthly_movements / get_monthly_movement_months を作成しました。';
END $$;

-- PostgREST のスキーマキャッシュを再読込
NOTIFY pgrst, 'reload schema';
