import type { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div aria-hidden="true" style={style} className={`animate-pulse rounded-xl bg-surface-2 contain-layout ${className}`} />;
}
