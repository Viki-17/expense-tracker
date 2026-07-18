import { type ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'expense' | 'income' | 'accent' | 'warning';
  size?: 'xs' | 'sm';
  className?: string;
}

const tones = {
  neutral: 'bg-surface-2 text-secondary',
  expense: 'bg-danger-soft text-danger',
  income: 'bg-success-soft text-success',
  accent: 'bg-accent-soft text-accent',
  warning: 'bg-warning/15 text-warning',
};

const sizes = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
};

export function Badge({ children, tone = 'neutral', size = 'xs', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${tones[tone]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}