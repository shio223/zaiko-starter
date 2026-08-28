-- ============================================================
-- KEYENCE ハンディ取込の監査ログ
--
-- 用途:
--   - INOUT_LOG.TXT（mode 1 入庫 / mode 2 出庫）取込の監査
--   - 同一ファイル内容の二重取込防止（file_content_hash UNIQUE）
--
-- 対象外（今回）:
--   - mode 3（棚卸）の在庫反映
--   - INVENTORY_LOG → inventory_count_lines 接続
--   - inventory_counts / complete_inventory_count は変更しない（残置）
--
-- 書き込み: service_role（API Route）のみ
-- 読み取り: anon / authenticated に SELECT 可（監査参照用）
--
-- 実行: Supabase SQL Editor（ご確認後）
-- ============================================================

CREATE TABLE IF NOT EXISTS handheld_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_name TEXT NOT NULL DEFAULT '',
  -- ファイル内容全体の SHA-256（hex）。同一内容の再取込を拒否する
  file_content_hash TEXT NOT NULL,

  -- inout = INOUT_LOG 系 / inventory = INVENTORY_LOG 系 /
  -- mixed = 混在 / manual = 手動入力のみ
  log_kind TEXT NOT NULL DEFAULT 'inout'
    CHECK (log_kind IN ('inout', 'inventory', 'mixed', 'manual')),

  device_id TEXT NOT NULL DEFAULT '',

  row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  -- mode3・未登録スキップ・二重行スキップ等
  skipped_count INTEGER NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),

  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'partial', 'rejected')),

  error_summary TEXT NOT NULL DEFAULT '',
  -- 監査用。巨大ファイルはアプリ側で省略可
  raw_text TEXT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT handheld_import_logs_file_content_hash_key UNIQUE (file_content_hash)
);

COMMENT ON TABLE handheld_import_logs IS
  'KEYENCEハンディ取込の監査ログ（二重取込防止含む）';
COMMENT ON COLUMN handheld_import_logs.file_content_hash IS
  'ファイル内容 SHA-256（hex）。同一内容の再アップロード拒否用';
COMMENT ON COLUMN handheld_import_logs.log_kind IS
  'inout / inventory / mixed / manual';
COMMENT ON COLUMN handheld_import_logs.skipped_count IS
  'mode3・未登録・重複などで在庫反映しなかった行数';

CREATE TABLE IF NOT EXISTS handheld_import_log_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_log_id UUID NOT NULL
    REFERENCES handheld_import_logs(id) ON DELETE CASCADE,

  line_number INTEGER NOT NULL DEFAULT 0,
  scanned_at TIMESTAMPTZ NULL,
  device_id TEXT NOT NULL DEFAULT '',
  -- 1=入庫 2=出庫 3=棚卸（認識のみ。3は applied にしない）
  mode SMALLINT NULL CHECK (mode IS NULL OR mode IN (1, 2, 3)),
  staff_code TEXT NULL,
  shelf_code TEXT NOT NULL DEFAULT '',
  part_number TEXT NOT NULL DEFAULT '',
  quantity NUMERIC(12, 4) NULL,

  -- applied / skipped_mode3 / skipped_unregistered / failed / duplicate / skipped_other
  result TEXT NOT NULL
    CHECK (result IN (
      'applied',
      'skipped_mode3',
      'skipped_unregistered',
      'failed',
      'duplicate',
      'skipped_other'
    )),
  result_message TEXT NOT NULL DEFAULT '',

  inventory_transaction_id UUID NULL
    REFERENCES inventory_transactions(id) ON DELETE SET NULL,
  unregistered_entry_id UUID NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE handheld_import_log_lines IS
  'KEYENCE取込の行単位監査（mode3は skipped_mode3）';
COMMENT ON COLUMN handheld_import_log_lines.mode IS
  '1=入庫 2=出庫 3=棚卸（在庫反映対象は1/2のみ）';
COMMENT ON COLUMN handheld_import_log_lines.result IS
  'applied / skipped_mode3 / skipped_unregistered / failed / duplicate / skipped_other';

CREATE INDEX IF NOT EXISTS idx_handheld_import_logs_imported_at
  ON handheld_import_logs (imported_at DESC);

CREATE INDEX IF NOT EXISTS idx_handheld_import_logs_file_hash
  ON handheld_import_logs (file_content_hash);

CREATE INDEX IF NOT EXISTS idx_handheld_import_log_lines_import_id
  ON handheld_import_log_lines (import_log_id);

CREATE INDEX IF NOT EXISTS idx_handheld_import_log_lines_part_number
  ON handheld_import_log_lines (part_number);

CREATE INDEX IF NOT EXISTS idx_handheld_import_log_lines_result
  ON handheld_import_log_lines (result);

ALTER TABLE handheld_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE handheld_import_log_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zaiko_web_handheld_import_logs_select" ON handheld_import_logs;
DROP POLICY IF EXISTS "zaiko_web_handheld_import_log_lines_select" ON handheld_import_log_lines;

CREATE POLICY "zaiko_web_handheld_import_logs_select" ON handheld_import_logs
  FOR SELECT USING (true);

CREATE POLICY "zaiko_web_handheld_import_log_lines_select" ON handheld_import_log_lines
  FOR SELECT USING (true);

REVOKE ALL ON TABLE handheld_import_logs FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE handheld_import_logs FROM anon, authenticated;
GRANT SELECT ON TABLE handheld_import_logs TO anon, authenticated;
GRANT ALL ON TABLE handheld_import_logs TO service_role;

REVOKE ALL ON TABLE handheld_import_log_lines FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE handheld_import_log_lines FROM anon, authenticated;
GRANT SELECT ON TABLE handheld_import_log_lines TO anon, authenticated;
GRANT ALL ON TABLE handheld_import_log_lines TO service_role;

DO $$
BEGIN
  RAISE NOTICE 'handheld_import_logs / handheld_import_log_lines を作成しました（SELECTのみ・書込は service_role）。';
END $$;

NOTIFY pgrst, 'reload schema';
