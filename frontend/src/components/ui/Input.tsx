import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[var(--foreground)] mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-[var(--surface-2)] border ${
          error ? 'border-[var(--danger)]' : 'border-[var(--border)]'
        } rounded-lg px-3 py-2 text-xs text-[var(--foreground)] placeholder-[var(--foreground-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all duration-150 ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] font-medium text-[var(--danger)] mt-1">{error}</p>}
      {hint && !error && <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{hint}</p>}
    </div>
  );
};
