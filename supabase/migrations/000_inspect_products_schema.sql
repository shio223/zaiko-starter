-- ============================================================
-- Zaiko STARTER（既存プロジェクト）スキーマ確認用
-- Supabase SQL Editor で実行し、products テーブルの現状を確認してください
-- ============================================================

-- テーブル存在確認
SELECT
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'products';

-- カラム一覧
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY ordinal_position;

-- Web版で必要なカラムとの差分チェック
WITH required_columns AS (
  SELECT unnest(ARRAY[
    'id',
    'shelf_number',
    'supplier',
    'department',
    'part_number',
    'product_name',
    'quantity',
    'unit_price',
    'stock_amount',
    'reorder_point',
    'memo',
    'last_inventory_count',
    'created_at',
    'updated_at'
  ]) AS column_name
),
existing_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'products'
)
SELECT
  rc.column_name AS required_column,
  CASE
    WHEN ec.column_name IS NOT NULL THEN '存在'
    ELSE '不足'
  END AS status
FROM required_columns rc
LEFT JOIN existing_columns ec ON rc.column_name = ec.column_name
ORDER BY rc.column_name;

-- インデックス確認
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'products';

-- RLS ポリシー確認
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'products';

-- 件数確認（テーブルが無い場合はエラーにしない）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'products'
  ) THEN
    RAISE NOTICE 'products 件数: %', (SELECT COUNT(*) FROM products);
  ELSE
    RAISE NOTICE 'products テーブルはまだ存在しません。001_create_products.sql を実行してください。';
  END IF;
END $$;
