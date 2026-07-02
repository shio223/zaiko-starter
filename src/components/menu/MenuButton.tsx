/**
 * メインメニューのボタン1つ分
 * 構成: 番号（①〜⑪） + アイコン + ラベル
 */
import Link from "next/link";
import type { ReactNode } from "react";

type MenuButtonVariant = "blue" | "green" | "orange" | "red";

type MenuButtonProps = {
  number: number;
  label: string;
  href?: string;
  variant: MenuButtonVariant;
  icon: ReactNode;
  onClick?: () => void;
  wide?: boolean;
};

const variantClass: Record<MenuButtonVariant, string> = {
  blue: "menu-btn-blue",
  green: "menu-btn-green",
  orange: "menu-btn-orange",
  red: "menu-btn-red",
};

/** Access版メニューと同じ丸数字 */
const numberDisplay = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪"];

export function MenuButton({
  number,
  label,
  href,
  variant,
  icon,
  onClick,
  wide = false,
}: MenuButtonProps) {
  const content = (
    <div className={`menu-item ${wide ? "menu-item-wide" : ""}`}>
      <span className="menu-number">{numberDisplay[number - 1]}</span>
      <div className="menu-icon-box">{icon}</div>
      <div className={`menu-btn ${variantClass[variant]}`}>{label}</div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="menu-item-link">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className="menu-item-link" onClick={onClick}>
      {content}
    </button>
  );
}
