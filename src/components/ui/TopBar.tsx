import { type ReactNode } from 'react';
import { useSafeArea } from '../../hooks/useSafeArea';

interface TopBarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  sticky?: boolean;
  borderless?: boolean;
}

export function TopBar({ title, subtitle, leading, trailing, sticky = true, borderless = false }: TopBarProps) {
  const safeArea = useSafeArea();
  const top = safeArea.top || 0;
  const inlineStyle: React.CSSProperties = top > 0 ? { paddingTop: top + 8 } : {};
  return (
    <header
      className={`safe-top -mx-4 -mt-4 px-4 pt-4 overflow-hidden rounded-b-[2rem] bg-canvas/90 backdrop-blur-xl ${
        borderless ? '' : 'border-b border-separator/40'
      } ${sticky ? 'sticky top-0 z-30' : ''} lg:-mx-12 lg:-mt-10 lg:px-12 lg:pt-10`}
      style={inlineStyle}
    >
      <div className="flex items-center gap-3 px-0 pb-5 lg:px-0">
        {leading}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-[-0.045em] text-label truncate leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-secondary truncate mt-1">{subtitle}</p>}
        </div>
        {trailing}
      </div>
    </header>
  );
}
