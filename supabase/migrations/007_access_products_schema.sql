-- ============================================================
-- 旧Access T_PRODUCTS 準拠の products テーブル定義
--
-- 対象: 既存 Zaiko STARTER プロジェクト
-- 旧Web版カラム名から意味の分かる名前へリネーム
--
-- 実行: Supabase SQL Editor で実行
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    RAISE EXCEPTION 'products テーブルが見つかりません。先に 002_upgrade_existing_products.sql を実行してください。';
  END IF;
END $$;

-- 旧カラム名 → 新カラム名（存在する場合のみリネーム）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'shelf_number'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'shelf_code'
  ) THEN
    ALTER TABLE products RENAME COLUMN shelf_number TO shelf_code;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'product_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'name'
  ) THEN
    ALTER TABLE products RENAME COLUMN product_name TO name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'memo'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'note'
  ) THEN
    ALTER TABLE products RENAME COLUMN memo TO note;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'last_inventory_count'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'latest_inventory_count'
  ) THEN
    ALTER TABLE products RENAME COLUMN last_inventory_count TO latest_inventory_count;
  END IF;
END $$;

-- 不足カラムの追加
ALTER TABLE products ADD COLUMN IF NOT EXISTS shelf_code TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS part_number TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity NUMERIC(12, 4) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 4) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point NUMERIC(12, 4) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS latest_inventory_count NUMERIC(12, 4) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS print_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 品番 UNIQUE（空文字は除外）
DROP INDEX IF EXISTS idx_products_part_number_unique;
CREATE UNIQUE INDEX idx_products_part_number_unique
  ON products (part_number)
  WHERE part_number <> '';

-- 検索用インデックス（旧インデックス名を更新）
DROP INDEX IF EXISTS idx_products_shelf_number;
CREATE INDEX IF NOT EXISTS idx_products_shelf_code ON products (shelf_code);
CREATE INDEX IF NOT EXISTS idx_products_part_number ON products (part_number);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products (supplier);
CREATE INDEX IF NOT EXISTS idx_products_department ON products (department);

-- updated_at 自動更新
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

-- 在庫金額自動計算（Web表示用・旧Accessにはない派生項目）
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

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zaiko_web_allow_all" ON products;
CREATE POLICY "zaiko_web_allow_all" ON products
  FOR ALL
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE 'products テーブルを旧Access T_PRODUCTS 準拠スキーマに更新しました。';
END $$;
