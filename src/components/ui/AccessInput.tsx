/** Access版スタイルのテキスト入力 */
import type { InputHTMLAttributes } from "react";

type AccessInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  required?: boolean;
};

export function AccessInput({
  label,
  id,
  className = "",
  error,
  required,
  ...props
}: AccessInputProps) {
  return (
    <div className="mb-2">
      {label && (
        <label htmlFor={id} className="access-label">
          {label}
          {required && <span className="field-required"> *</span>}
        </label>
      )}
      <input
        id={id}
        className={`access-input ${error ? "access-input-error" : ""} ${className}`}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
