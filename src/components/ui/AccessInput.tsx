/** Access版スタイルのテキスト入力 */
import type { InputHTMLAttributes } from "react";

type AccessInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function AccessInput({ label, id, className = "", ...props }: AccessInputProps) {
  return (
    <div className="mb-2">
      {label && (
        <label htmlFor={id} className="access-label">
          {label}
        </label>
      )}
      <input id={id} className={`access-input ${className}`} {...props} />
    </div>
  );
}
