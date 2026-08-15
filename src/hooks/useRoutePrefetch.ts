import { useEffect } from 'react';

const routeLoaders = [
  () => import('../pages/Home'),
  () => import('../pages/Transactions'),
  () => import('../pages/AddTransaction'),
  () => import('../pages/SMSImport'),
  () => import('../pages/Budgets'),
  () => import('../pages/Settings'),
  () => import('../pages/CategoryDetail'),
  () => import('../pages/MerchantDetail'),
];

export function useRoutePrefetch() {
  useEffect(() => {
    let cancelled = false;

    const prefetch = () => {
      for (const loader of routeLoaders) {
        loader().catch(() => {});
      }
    };

    const run = () => {
      if (!cancelled) prefetch();
    };

    if ('requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(
        () => {
          if (!cancelled) prefetch();
        },
        { timeout: 1500 }
      );
      return () => {
        cancelled = true;
        (window as any).cancelIdleCallback(idleId);
      };
    }

    const timer = setTimeout(run, 800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
}
