import { type ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  const title = useMemo(() => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/transactions': return 'Transactions';
      case '/add': return 'Add Transaction';
      case '/sms': return 'SMS Import';
      case '/budgets': return 'Budgets';
      case '/settings': return 'Settings';
      default: return 'Expense Tracker';
    }
  }, [location.pathname]);

  return (
    <div className="flex h-dvh bg-gray-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <header className="hidden lg:flex items-center h-16 px-8 bg-white border-b border-gray-200 shrink-0">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </header>

        <header className="lg:hidden flex items-center h-14 px-4 bg-white border-b border-gray-200 shrink-0 safe-top">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
