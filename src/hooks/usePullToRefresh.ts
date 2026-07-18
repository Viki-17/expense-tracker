import { useState, useRef, useCallback, useEffect } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => void;
  threshold?: number;
}

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let current: HTMLElement | null = el?.parentElement ?? null;
  while (current) {
    const overflowY = getComputedStyle(current).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return current;
    current = current.parentElement;
  }
  return null;
}

export function usePullToRefresh(
  ref: React.RefObject<HTMLElement | null>,
  options: PullToRefreshOptions
) {
  const { onRefresh, threshold = 80 } = options;

  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef(0);
  const scrollEl = useRef<HTMLElement | null>(null);
  const isAtTop = useRef(false);
  const currentPull = useRef(0);

  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    startY.current = e.touches[0].clientY;
    currentPull.current = 0;
    setPullDistance(0);

    if (!scrollEl.current) {
      scrollEl.current = findScrollParent(ref.current);
    }
    isAtTop.current = scrollEl.current ? scrollEl.current.scrollTop <= 1 : true;
  }, [ref]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isAtTop.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 10) {
      currentPull.current = Math.min(dy * 0.5, 120);
      setPullDistance(currentPull.current);
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (currentPull.current >= threshold && isAtTop.current) {
      setRefreshing(true);
      onRefreshRef.current?.();
    }
    currentPull.current = 0;
    setPullDistance(0);
  }, [threshold]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { pullDistance, refreshing, setRefreshing };
}
