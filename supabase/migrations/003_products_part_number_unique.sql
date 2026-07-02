-- 品番の重複を防ぐ（製品マスタのデータ整合性）
-- Supabase SQL Editor で実行してください

-- 既存の重複がある場合は先に解消してから実行
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_part_number_unique
  ON products (part_number)
  WHERE part_number <> '';
