import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface Tab<T extends string> {
  key: T;
  label: ReactNode;
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (v: T) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

export function Tabs<T extends string>({ tabs, value, onChange, variant = 'underline', className = '' }: TabsProps<T>) {
  if (variant === 'pill') {
    return (
      <div className={`inline-flex bg-surface-2 rounded-xl p-1 ${className}`}>
        {tabs.map((t) => {
          const active = t.key === value;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                active ? 'text-label' : 'text-tertiary'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="pill-bg"
                  className="absolute inset-0 bg-surface rounded-lg shadow-card"
                  transition={{ type: 'spring', stiffness: 500, damping: 42 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative flex gap-6 ${className}`}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
              active ? 'text-label' : 'text-tertiary'
            } ${
              active
                ? 'after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-accent after:rounded-full'
                : ''
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
