import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:brightness-110 active:brightness-95',
  secondary:
    'bg-surface-2 text-label hover:bg-surface-3 border border-separator/60',
  ghost: 'text-secondary hover:text-label hover:bg-surface-2',
  danger: 'bg-danger-soft text-danger hover:brightness-110',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3.5 text-sm rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`tap font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 ${
        variants[variant]
      } ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}