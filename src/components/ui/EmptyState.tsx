import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-tertiary mb-4">
        {icon}
      </div>
      <p className="text-label font-semibold">{title}</p>
      {subtitle && <p className="text-tertiary text-sm mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}