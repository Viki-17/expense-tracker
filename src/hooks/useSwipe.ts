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
  const tracking = useRef(false);
  const leftRef = useRef(onSwipeLeft);
  const rightRef = useRef(onSwipeRight);

  leftRef.current = onSwipeLeft;
  rightRef.current = onSwipeRight;

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest('button, a, input, textarea, select, [role="button"]');

    const handlePointerDown = (e: PointerEvent) => {
      if (isInteractiveTarget(e.target)) {
        tracking.current = false;
        return;
      }
      tracking.current = true;
      startX.current = e.clientX;
      startY.current = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!tracking.current) return;
      tracking.current = false;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        if (dx > 0) rightRef.current?.();
        else leftRef.current?.();
      }
    };

    const handlePointerCancel = () => {
      tracking.current = false;
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [threshold, disabled]);

  return ref;
}
