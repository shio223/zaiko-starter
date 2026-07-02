/** Access版スタイルのボタン（青・緑・オレンジ・赤） */
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "blue" | "green" | "orange" | "red";

type AccessButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
  href?: string;
};

const variantClass: Record<ButtonVariant, string> = {
  blue: "btn-blue",
  green: "btn-green",
  orange: "btn-orange",
  red: "btn-red",
};

export function AccessButton({
  variant = "blue",
  children,
  className = "",
  href,
  ...props
}: AccessButtonProps) {
  const classes = `btn-access ${variantClass[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
