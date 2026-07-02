/** 各画面のタイトルバー（レスポンシブ対応） */
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="page-header">
      <h1 className="page-header-title">{title}</h1>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
}
