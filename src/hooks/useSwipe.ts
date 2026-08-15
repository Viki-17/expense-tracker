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
  const pointerId = useRef<number | null>(null);
  const leftRef = useRef(onSwipeLeft);
  const rightRef = useRef(onSwipeRight);

  leftRef.current = onSwipeLeft;
  rightRef.current = onSwipeRight;

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      tracking.current = true;
      pointerId.current = e.pointerId;
      startX.current = e.clientX;
      startY.current = e.clientY;
      el.setPointerCapture(e.pointerId);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!tracking.current || pointerId.current !== e.pointerId) return;
      tracking.current = false;
      pointerId.current = null;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        e.preventDefault();
        if (dx > 0) rightRef.current?.();
        else leftRef.current?.();
      }
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (pointerId.current !== e.pointerId) return;
      tracking.current = false;
      pointerId.current = null;
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerCancel);
      tracking.current = false;
      pointerId.current = null;
    };
  }, [threshold, disabled]);

  return ref;
}
