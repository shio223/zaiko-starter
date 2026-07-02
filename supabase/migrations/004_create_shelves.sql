-- 棚番マスタ（shelves テーブル）
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelf_number TEXT NOT NULL DEFAULT '',
  shelf_name TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  memo TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shelves_shelf_number_unique
  ON shelves (shelf_number)
  WHERE shelf_number <> '';

CREATE INDEX IF NOT EXISTS idx_shelves_shelf_name ON shelves (shelf_name);
CREATE INDEX IF NOT EXISTS idx_shelves_location ON shelves (location);

CREATE OR REPLACE FUNCTION zaiko_web_update_shelves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS zaiko_web_set_shelves_updated_at ON shelves;
CREATE TRIGGER zaiko_web_set_shelves_updated_at
  BEFORE UPDATE ON shelves
  FOR EACH ROW
  EXECUTE FUNCTION zaiko_web_update_shelves_updated_at();

ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zaiko_web_shelves_allow_all" ON shelves;
CREATE POLICY "zaiko_web_shelves_allow_all" ON shelves
  FOR ALL
  USING (true)
  WITH CHECK (true);
