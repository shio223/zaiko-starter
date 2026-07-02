# Supabase（既存プロジェクト「Zaiko STARTER」）

このWeb版は **新規Supabaseプロジェクトを作らず**、既存プロジェクト「Zaiko STARTER」の `products` テーブルを利用します。

## セットアップ手順

### 1. 接続情報を `.env.local` に設定

Supabase ダッシュボード → プロジェクト「Zaiko STARTER」→ Settings → API から取得:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. 既存スキーマを確認

SQL Editor で以下を実行:

```
supabase/migrations/000_inspect_products_schema.sql
```

「不足」と表示されたカラムがある場合のみ、次のステップへ進みます。

### 3. 不足カラム・設定を追加

SQL Editor で以下を実行:

```
supabase/migrations/002_upgrade_existing_products.sql
```

このSQLは:

- 既存の `products` テーブル・データを保持したまま
- 不足カラムのみ `ADD COLUMN IF NOT EXISTS` で追加
- インデックス・トリガー・RLS を Web版用に設定

### 4. 再確認

再度 `000_inspect_products_schema.sql` を実行し、全カラムが「存在」になっていることを確認してください。

## Web版が参照する products カラム

| カラム名 | 説明 |
|---|---|
| id | 主キー（UUID） |
| shelf_number | 棚番 |
| supplier | 仕入先 |
| department | 部門 |
| part_number | 品番 |
| product_name | 品名 |
| quantity | 数量（在庫数） |
| unit_price | 単価 |
| stock_amount | 在庫金額 |
| reorder_point | 発注点 |
| memo | 備考 |
| last_inventory_count | 最終棚卸数 |
| created_at | 作成日時 |
| updated_at | 更新日時 |

## 既存カラム名が異なる場合

既存テーブルのカラム名が上記と異なる場合（例: 日本語カラム名）は、以下のいずれかが必要です。

1. **VIEW を作成**して Web版用のカラム名にマッピングする
2. **アプリ側の型・クエリ**を既存カラム名に合わせて変更する

その場合は `000_inspect_products_schema.sql` の実行結果を共有してください。

## ファイル一覧

| ファイル | 用途 |
|---|---|
| `000_inspect_products_schema.sql` | 既存スキーマ確認 |
| `002_upgrade_existing_products.sql` | **既存プロジェクト用**（これを使う） |
| `001_create_products.sql` | 参考用（新規作成時のみ。既存では使わない） |
