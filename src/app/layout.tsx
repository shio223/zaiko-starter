/**
 * 全ページ共通のルートレイアウト
 * ブラウザタブのタイトルや日本語設定を定義
 */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zaiko STARTER - 在庫管理システム",
  description: "在庫管理システム Zaiko STARTER Web版",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
