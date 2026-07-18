import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

interface SafeArea {
  top: number;
  left: number;
  right: number;
}

function readCssVar(name: string): number {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
}

function detectAndroidSafeArea(): { top: number; left: number; right: number } {
  const vv = window.visualViewport;
  if (!vv) return { top: 24, left: 0, right: 0 };

  const top = Math.round(vv.offsetTop);
  const left = Math.round(vv.offsetLeft);
  const right = Math.round(vv.width < window.innerWidth ? window.innerWidth - (vv.offsetLeft + vv.width) : 0);

  return { top: top || 24, left, right };
}

export function useSafeArea(): SafeArea {
  const [extra, setExtra] = useState<SafeArea>({ top: 0, left: 0, right: 0 });
  const mounted = useRef(false);

  useEffect(() => {
    const compute = () => {
      const cssTop = readCssVar('--sat');
      const cssLeft = readCssVar('--sal');
      const cssRight = readCssVar('--sar');

      if (cssTop > 0 || cssLeft > 0 || cssRight > 0) {
        setExtra({ top: 0, left: 0, right: 0 });
        return;
      }

      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        setExtra({ top: 0, left: 0, right: 0 });
        return;
      }

      setExtra(detectAndroidSafeArea());
    };

    compute();
    mounted.current = true;

    window.addEventListener('resize', compute);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', compute);
      window.visualViewport.addEventListener('scroll', compute);
    }

    return () => {
      window.removeEventListener('resize', compute);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', compute);
        window.visualViewport.removeEventListener('scroll', compute);
      }
    };
  }, []);

  return extra;
}
