/** Access版スタイルの複数行入力（備考欄など） */
import type { TextareaHTMLAttributes } from "react";

type AccessTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function AccessTextarea({
  label,
  id,
  className = "",
  error,
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
        className={`access-input resize-none ${error ? "access-input-error" : ""} ${className}`}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
