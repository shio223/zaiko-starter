/** Access版スタイルのパネル（枠付きボックス） */
import type { ReactNode } from "react";

type AccessPanelProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function AccessPanel({ title, children, className = "" }: AccessPanelProps) {
  return (
    <div className={`access-panel ${className}`}>
      {title && (
        <div className="mb-2 border-b border-[#808080] pb-1 text-sm font-bold">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
