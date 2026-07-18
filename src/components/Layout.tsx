import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-dvh bg-canvas">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64 min-w-0">
        <main className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto lg:overflow-y-auto pb-28 lg:pb-8 scroll-y">
            <div className="max-w-4xl mx-auto py-4 lg:px-8 lg:py-8 min-h-full">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
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