import React from 'react';

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'cobalt' | 'teal' | 'success' | 'warning' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  variant = 'default',
}) => {
  const iconBgStyles = {
    default: 'bg-[var(--surface-2)] text-[var(--foreground-muted)] border border-[var(--border)]',
    cobalt: 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20',
    teal: 'bg-[var(--teal-bg)] text-[var(--teal)] border border-[var(--teal-border)]',
    success: 'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]',
    warning: 'bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning-border)]',
    danger: 'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)]',
  };

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-all duration-150">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--foreground-muted)] tracking-tight">{label}</span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${iconBgStyles[variant]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-black tracking-tight text-[var(--foreground)]">{value}</div>
        {subtitle && (
          <p className="text-[11px] text-[var(--foreground-muted)] mt-1 font-normal leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
