-- ============================================================
-- Zaiko STARTER 既存プロジェクト用アップグレードSQL
--
-- 対象: 既存の Supabase プロジェクト「Zaiko STARTER」
-- 前提: products テーブルが既に存在すること
--
-- 実行手順:
--   1. 000_inspect_products_schema.sql で現状確認
--   2. 本SQLを Supabase SQL Editor で実行
--   3. 再度 000_inspect_products_schema.sql で不足カラムがないか確認
--
-- 注意:
--   - 既存データは削除しません
--   - 既存カラムの型変更・リネームは行いません
--   - 不足カラムのみ ADD COLUMN します
-- ============================================================

-- products テーブル存在チェック
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'products'
  ) THEN
    RAISE EXCEPTION 'products テーブルが見つかりません。既存プロジェクト「Zaiko STARTER」を確認してください。';
  END IF;
END $$;

-- ------------------------------------------------------------
-- 不足カラムの追加（既存カラムはスキップ）
-- ------------------------------------------------------------

ALTER TABLE products ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE products ADD COLUMN IF NOT EXISTS shelf_number TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS part_number TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_name TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS memo TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_inventory_count NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- id が未設定の行に UUID を付与（既存行がある場合）
UPDATE products
SET id = gen_random_uuid()
WHERE id IS NULL;

-- id に主キー制約がなければ追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_pkey'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'products_pkey の追加をスキップしました: %', SQLERRM;
END $$;

-- 既存行の在庫金額を補完
UPDATE products
SET stock_amount = quantity * unit_price
WHERE stock_amount IS NULL
   OR stock_amount = 0;

-- ------------------------------------------------------------
-- 検索用インデックス
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_part_number ON products (part_number);
CREATE INDEX IF NOT EXISTS idx_products_product_name ON products (product_name);
CREATE INDEX IF NOT EXISTS idx_products_shelf_number ON products (shelf_number);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products (supplier);

-- ------------------------------------------------------------
-- updated_at 自動更新トリガー
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION zaiko_web_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS zaiko_web_set_products_updated_at ON products;
CREATE TRIGGER zaiko_web_set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION zaiko_web_update_updated_at_column();

-- ------------------------------------------------------------
-- 在庫金額自動計算トリガー（数量 × 単価）
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION zaiko_web_calculate_stock_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.stock_amount = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS zaiko_web_set_products_stock_amount ON products;
CREATE TRIGGER zaiko_web_set_products_stock_amount
  BEFORE INSERT OR UPDATE OF quantity, unit_price ON products
  FOR EACH ROW
  EXECUTE FUNCTION zaiko_web_calculate_stock_amount();

-- ------------------------------------------------------------
-- RLS（ログイン不要のため全操作許可。将来認証追加時に変更）
-- ------------------------------------------------------------

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zaiko_web_allow_all" ON products;
CREATE POLICY "zaiko_web_allow_all" ON products
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE 'Zaiko STARTER Web版用のアップグレードが完了しました。';
END $$;
