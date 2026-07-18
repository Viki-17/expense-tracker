import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  inset?: boolean;
  onClick?: () => void;
  padded?: boolean;
}

export function Card({ children, className = '', inset, onClick, padded = true }: CardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter') onClick();
            }
          : undefined
      }
      className={`${inset ? 'cardInset' : 'card'} shadow-card ${
        onClick ? 'tap active:scale-[0.99] cursor-pointer' : ''
      } ${padded ? 'p-4' : ''} ${className}`}
    >
      {children}
    </div>
  );
}