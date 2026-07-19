import { type ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

const isDetailPage = (path: string) =>
  path.startsWith('/category/') || path.startsWith('/merchant/');

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  const isDetail = useMemo(() => isDetailPage(location.pathname), [location.pathname]);

  const anim = useMemo(
    () =>
      isDetail
        ? {
            initial: { x: '100%' },
            animate: { x: 0, opacity: 1 },
            exit: { x: '100%' },
            transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] as const },
          }
        : {
            initial: { opacity: 0, y: 3 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -3 },
            transition: { duration: 0.08, ease: [0.25, 0.8, 0.25, 1] as const },
          },
    [isDetail]
  );

  return (
    <div className="flex h-dvh bg-canvas">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64 min-w-0">
        <main className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto lg:overflow-y-auto pb-28 lg:pb-8 scroll-y">
            <div className="max-w-4xl mx-auto px-3 py-4 lg:px-8 lg:py-8 min-h-full">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={anim.initial}
                  animate={anim.animate}
                  exit={anim.exit}
                  transition={anim.transition}
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