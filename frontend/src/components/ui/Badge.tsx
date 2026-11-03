import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export type BadgeVariant = 'error' | 'warning' | 'info' | 'success' | 'neutral' | 'cobalt' | 'teal';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  showIcon = false,
  className = '',
}) => {
  const sizeStyles = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const variantStyles: Record<BadgeVariant, string> = {
    error: "bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)]",
    warning: "bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning-border)]",
    info: "bg-[var(--info-bg)] text-[var(--info)] border border-[var(--info-border)]",
    success: "bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]",
    neutral: "bg-[var(--surface-2)] text-[var(--foreground-muted)] border border-[var(--border)]",
    cobalt: "bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/25",
    teal: "bg-[var(--teal-bg)] text-[var(--teal)] border border-[var(--teal-border)]",
  };

  const iconMap: Record<BadgeVariant, React.ReactNode> = {
    error: <AlertCircle className="w-3 h-3 shrink-0" />,
    warning: <AlertTriangle className="w-3 h-3 shrink-0" />,
    info: <Info className="w-3 h-3 shrink-0" />,
    success: <CheckCircle2 className="w-3 h-3 shrink-0" />,
    neutral: null,
    cobalt: null,
    teal: null,
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {showIcon && iconMap[variant]}
      {children}
    </span>
  );
};

export const GradeBadge: React.FC<{ grade: string; size?: 'sm' | 'md' | 'lg' }> = ({ grade, size = 'md' }) => {
  const gradeStyles: Record<string, string> = {
    'A+': "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]",
    'A': "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]",
    'B': "bg-[var(--info-bg)] text-[var(--info)] border-[var(--info-border)]",
    'C': "bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-border)]",
    'D': "bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]",
    'F': "bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]",
  };

  const sizeClasses = {
    sm: "text-xs font-bold px-2 py-0.5 rounded",
    md: "text-sm font-extrabold px-2.5 py-1 rounded-md",
    lg: "text-xl font-black px-3.5 py-1.5 rounded-lg",
  };

  const chosenStyle = gradeStyles[grade] || "bg-[var(--surface-2)] text-[var(--foreground)] border-[var(--border)]";

  return (
    <span className={`inline-flex items-center justify-center border font-mono tracking-wider shadow-2xs ${sizeClasses[size]} ${chosenStyle}`}>
      {grade}
    </span>
  );
};
