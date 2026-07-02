/** Access版スタイルの複数行入力（備考欄など） */
import type { TextareaHTMLAttributes } from "react";

type AccessTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function AccessTextarea({
  label,
  id,
  className = "",
  ...props
}: AccessTextareaProps) {
  return (
    <div className="mb-2">
      {label && (
        <label htmlFor={id} className="access-label">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`access-input resize-none ${className}`}
        {...props}
      />
    </div>
  );
}
