import { type ReactNode } from 'react';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  children?: ReactNode;
  className?: string;
}

const sizeCls = {
  sm: 'w-9 h-9 text-sm',
  md: 'w-11 h-11 text-base',
  lg: 'w-14 h-14 text-lg',
};

export function Avatar({ size = 'md', color, children, className = '' }: AvatarProps) {
  const bg = color || 'rgb(var(--surface-2))';
  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold shrink-0 contain-layout ${sizeCls[size]} ${className}`}
      style={{
        // Soft tinted background derived from the category color
        backgroundColor: tintFrom(color) || bg,
        color: color || 'rgb(var(--label))',
      }}
    >
      {children}
    </div>
  );
}

// Convert "#a1b2c3" into a soft translucent tint background. Returns null if no hex.
function tintFrom(hex?: string): string | null {
  if (!hex) return null;
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, 0.18)`;
}