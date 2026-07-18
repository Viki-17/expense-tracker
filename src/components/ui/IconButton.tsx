import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { XMarkIcon } from '../Icons';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-11 h-11',
};

export function IconButton({ children, label, size = 'md', className = '', ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      aria-label={label}
      className={`tap flex items-center justify-center rounded-full bg-surface-2 text-label hover:bg-surface-3 active:scale-90 transition-all duration-150 ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function CloseButton({ label = 'Close', ...rest }: { label?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <IconButton label={label} {...rest}>
      <XMarkIcon className="w-5 h-5" />
    </IconButton>
  );
}