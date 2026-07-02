# Zaiko STARTER Web版

既存のAccess在庫管理システム「Zaiko STARTER」をWeb化したアプリケーションです。

**Supabaseは既存プロジェクト「Zaiko STARTER」を使用します（新規作成不要）。**

## 技術スタック

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase（既存プロジェクト）
- Vercel（公開予定）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 既存 Supabase プロジェクトに接続

1. Supabase ダッシュボードでプロジェクト **「Zaiko STARTER」** を開く
2. Settings → API から URL と anon key を取得
3. `.env.local` を作成して設定

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. 既存 products テーブルの確認・更新

詳細は [supabase/README.md](supabase/README.md) を参照。

```bash
# 1. SQL Editor でスキーマ確認
supabase/migrations/000_inspect_products_schema.sql

# 2. 不足カラムがあればアップグレード実行
supabase/migrations/002_upgrade_existing_products.sql
```

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## ファイル構成

```
src/
├── app/
│   ├── page.tsx                    # メインメニュー
│   ├── inventory/page.tsx          # 在庫リスト
│   ├── master/                     # 製品マスタ
│   └── (その他メニュー画面)         # プレースホルダー
├── components/
└── lib/
    ├── supabase/
    │   ├── client.ts               # Supabaseクライアント
    │   └── products-schema.ts      # 既存テーブル定義
    ├── types/product.ts
    └── utils/product.ts
supabase/
├── README.md                       # 既存プロジェクト接続手順
└── migrations/
    ├── 000_inspect_products_schema.sql   # スキーマ確認
    ├── 002_upgrade_existing_products.sql # 既存用アップグレード
    └── 001_create_products.sql           # 参考用（既存では使わない）
```

## 実装済み機能

- メインメニュー（Access版と同じ配置）
- 在庫リスト（検索・入庫/出庫・CSV出力・発注点警告）
- 入出庫履歴
- 月別移動量
- 棚卸リスト・棚卸開始・棚卸確定
- バーコード印刷
- データ転送（CSV入出力）
- KEYENCE連携（マスタ出力・スキャン結果取込）
- 製品マスタ / 棚番マスタ CRUD

## Supabase マイグレーション

機能ごとに SQL の実行が必要です。詳細は [supabase/README.md](supabase/README.md)。

| SQL | 用途 |
|---|---|
| 002 | products テーブル拡張 |
| 003 | 品番ユニーク制約 |
| 004 | 棚番マスタ |
| 005 | 入出庫履歴 |
| 006 | 棚卸 |

## 未実装

- 担当者マスタ
- 未登録リスト

## Vercel デプロイ

1. GitHub にリポジトリをプッシュ
2. Vercel でプロジェクトをインポート
3. 環境変数に既存「Zaiko STARTER」プロジェクトの URL / anon key を設定
