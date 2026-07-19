import { useRef, useEffect } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  disabled?: boolean;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  disabled = false,
}: SwipeHandlers) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const leftRef = useRef(onSwipeLeft);
  const rightRef = useRef(onSwipeRight);

  leftRef.current = onSwipeLeft;
  rightRef.current = onSwipeRight;

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const handlePointerDown = (e: PointerEvent) => {
      startX.current = e.clientX;
      startY.current = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        if (dx > 0) rightRef.current?.();
        else leftRef.current?.();
      }
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointerup', handlePointerUp);

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointerup', handlePointerUp);
    };
  }, [threshold, disabled]);

  return ref;
}
