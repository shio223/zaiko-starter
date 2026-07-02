/** 各画面のタイトルバー */
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between border-b-2 border-[#808080] pb-2">
      <h1 className="text-lg font-bold">{title}</h1>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
