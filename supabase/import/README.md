# 最新在庫データの取り込み（Access → Supabase）

本番運用前に、Access の最新在庫を Supabase の `products` テーブルへ入れておくことをおすすめします。

## 手順

### 1. Access から CSV をエクスポート

1. Access の製品マスタ／在庫データを開く
2. **外部データ** → **エクスポート** → **テキストファイル（CSV）**
3. UTF-8 で保存（文字化け防止）

### 2. CSV の列名を合わせる

Supabase `products` テーブルに合わせて、CSV の1行目（ヘッダー）を次の名前にしてください。

| CSV列名 | 内容 |
|---|---|
| shelf_number | 棚番 |
| supplier | 仕入先 |
| department | 部門 |
| part_number | 品番 |
| product_name | 品名 |
| quantity | 在庫数 |
| unit_price | 単価 |
| reorder_point | 発注点 |
| memo | 備考 |
| last_inventory_count | 最終棚卸数 |

**不要な列（自動設定されます）**
- id
- stock_amount（数量 × 単価で自動計算）
- created_at / updated_at

テンプレート: `products_import_template.csv`

### 3. Supabase にインポート

1. Supabase ダッシュボード → **Table Editor** → **products**
2. 右上 **Insert** 横の **︙** → **Import data from CSV**
3. 用意した CSV を選択
4. 列のマッピングを確認して **Import**

### 4. 確認

- Table Editor で件数・内容を確認
- Webアプリの **在庫リスト** で表示を確認

## 注意

- **既にテスト登録したデータがある場合**、重複しないよう先に整理してください
- 品番（part_number）が同じ行が複数あると、在庫が二重に見えることがあります
- 大量データ（数千件以上）の場合は、SQL Editor で COPY を使う方法もあります

## Access の列名が違う場合

Access の列名が日本語の場合、Excel などで開いて1行目を上記の英語列名に変更してからインポートしてください。

例:
- 棚番 → shelf_number
- 品番 → part_number
- 品名 → product_name
- 在庫数 → quantity

列名の対応表が分かれば、アプリ側に合わせることもできます。
