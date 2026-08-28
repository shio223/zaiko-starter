-- ============================================================
-- 未登録品番（旧Access T_NOT_ENTRY 相当）
--
-- KEYENCE取込で products.part_number に存在しない品番を保存する。
-- 在庫（products.quantity）や inventory_transactions は更新しない。
--
-- mode:
--   1 = 入庫ログ由来
--   2 = 出庫ログ由来
--   3 = 棚卸ログ由来（取込対象外だが、ログに含まれた場合の記録用に許可）
--
-- 注意:
--   - inventory_counts / complete_inventory_count は変更しない
--   - 書き込みは service_role（API Route）のみ
--   - 未登録リスト画面への接続は別途（本マイグレーションでは UI 変更なし）
--
-- 実行: Supabase SQL Editor（014 の後を推奨）
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'handheld_import_logs'
  ) THEN
    RAISE EXCEPTION 'handheld_import_logs が見つかりません。先に 014_create_handheld_import_logs.sql を適用してください。';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS unregistered_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- どの取込で検出したか（取込ヘッダ削除時は NULL に残す）
  import_log_id UUID NULL
    REFERENCES handheld_import_logs(id) ON DELETE SET NULL,

  scanned_at TIMESTAMPTZ NULL,
  device_id TEXT NOT NULL DEFAULT '',
  mode SMALLINT NOT NULL CHECK (mode IN (1, 2, 3)),
  staff_code TEXT NULL,
  shelf_code TEXT NOT NULL DEFAULT '',
  part_number TEXT NOT NULL,
  quantity NUMERIC(12, 4) NULL,

  -- open = 未解消 / resolved = マスタ登録後など解消済み
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved')),

  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE unregistered_entries IS
  '旧Access T_NOT_ENTRY 相当。KEYENCE取込でマスタ未登録の品番を保存';
COMMENT ON COLUMN unregistered_entries.mode IS
  '1=入庫 2=出庫 3=棚卸（ログ由来の記録。在庫反映は mode1/2 のみ）';
COMMENT ON COLUMN unregistered_entries.status IS
  'open=未解消 / resolved=解消済み';

-- 014 明細から未登録行への参照（循環を避けるため 015 で FK 追加）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'handheld_import_log_lines'
      AND constraint_name = 'handheld_import_log_lines_unregistered_entry_id_fkey'
  ) THEN
    ALTER TABLE handheld_import_log_lines
      ADD CONSTRAINT handheld_import_log_lines_unregistered_entry_id_fkey
      FOREIGN KEY (unregistered_entry_id)
      REFERENCES unregistered_entries(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_unregistered_entries_part_number
  ON unregistered_entries (part_number);

CREATE INDEX IF NOT EXISTS idx_unregistered_entries_status
  ON unregistered_entries (status);

CREATE INDEX IF NOT EXISTS idx_unregistered_entries_created_at
  ON unregistered_entries (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unregistered_entries_import_log_id
  ON unregistered_entries (import_log_id);

CREATE OR REPLACE FUNCTION zaiko_web_update_unregistered_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS zaiko_web_set_unregistered_entries_updated_at
  ON unregistered_entries;
CREATE TRIGGER zaiko_web_set_unregistered_entries_updated_at
  BEFORE UPDATE ON unregistered_entries
  FOR EACH ROW
  EXECUTE FUNCTION zaiko_web_update_unregistered_entries_updated_at();

ALTER TABLE unregistered_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zaiko_web_unregistered_entries_select" ON unregistered_entries;
CREATE POLICY "zaiko_web_unregistered_entries_select" ON unregistered_entries
  FOR SELECT USING (true);

REVOKE ALL ON TABLE unregistered_entries FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE unregistered_entries FROM anon, authenticated;
GRANT SELECT ON TABLE unregistered_entries TO anon, authenticated;
GRANT ALL ON TABLE unregistered_entries TO service_role;

DO $$
BEGIN
  RAISE NOTICE 'unregistered_entries を作成しました（SELECTのみ・書込は service_role）。';
END $$;

NOTIFY pgrst, 'reload schema';
