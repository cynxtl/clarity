import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 shrink-0";
  
  const sizeStyles = {
    xs: "text-[11px] h-7 px-2.5 gap-1.5",
    sm: "text-xs h-8 px-3 gap-1.5",
    md: "text-xs h-9 px-3.5 gap-2 font-semibold",
    lg: "text-sm h-10 px-4 gap-2.5 font-semibold",
  };

  const variantStyles = {
    primary: "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] shadow-xs border border-transparent font-semibold",
    secondary: "bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground)] border border-[var(--border)]",
    outline: "bg-transparent hover:bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)]",
    ghost: "bg-transparent hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
    danger: "bg-[var(--danger)] hover:opacity-90 text-white font-semibold shadow-xs",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : icon ? (
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
};
