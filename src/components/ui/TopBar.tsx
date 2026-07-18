import { type ReactNode } from 'react';
import { useSafeArea } from '../../hooks/useSafeArea';

interface TopBarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  sticky?: boolean;
}

export function TopBar({ title, subtitle, leading, trailing, sticky = true }: TopBarProps) {
  const safeArea = useSafeArea();
  const top = safeArea.top || 0;
  const inlineStyle: React.CSSProperties = top > 0 ? { paddingTop: top + 8 } : {};
  return (
    <header
      className={`safe-top bg-canvas/80 backdrop-blur-xl border-b border-separator/60 ${
        sticky ? 'sticky top-0 z-30' : ''
      }`}
      style={inlineStyle}
    >
      <div className="flex items-center gap-3 px-4 pb-3">
        {leading}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-label truncate leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-tertiary truncate mt-0.5">{subtitle}</p>}
        </div>
        {trailing}
      </div>
    </header>
  );
}