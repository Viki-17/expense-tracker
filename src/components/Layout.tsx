import { type ReactNode, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigationType = useNavigationType();

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Record<string, number>>({});
  const prevPathRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prevPath = prevPathRef.current;
    if (prevPath && prevPath !== location.pathname) {
      scrollPositions.current[prevPath] = el.scrollTop;
    }
    el.scrollTop =
      navigationType === 'POP'
        ? scrollPositions.current[location.pathname] ?? 0
        : 0;
    prevPathRef.current = location.pathname;
  }, [location.pathname, navigationType]);

  return (
    <div className="relative flex h-dvh overflow-hidden bg-canvas bg-kk-glow bg-grid bg-no-repeat">
      <div className="pointer-events-none absolute -left-32 top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-accent/10 blur-3xl" />
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-72 min-w-0">
        <main className="relative flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className="absolute inset-0 overflow-y-auto lg:overflow-y-auto pb-28 lg:pb-8 scroll-y"
          >
            <div className="relative max-w-6xl mx-auto px-4 py-4 lg:px-12 lg:py-10 min-h-full">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="min-h-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
