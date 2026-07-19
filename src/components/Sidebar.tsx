import { NavLink, useLocation } from 'react-router-dom';
import { HomeIcon, ListBulletIcon, PlusCircleIcon, EnvelopeIcon, ChartBarIcon, CogIcon } from './Icons';

const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/transactions', label: 'Transactions', icon: ListBulletIcon },
  { to: '/add', label: 'Add Transaction', icon: PlusCircleIcon },
  { to: '/sms', label: 'SMS Import', icon: EnvelopeIcon },
  { to: '/budgets', label: 'Budgets', icon: ChartBarIcon },
  { to: '/settings', label: 'Settings', icon: CogIcon },
];

export default function Sidebar() {
  const location = useLocation();

  const handleHomeClick = () => {
    sessionStorage.removeItem('dashboardTab');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-separator/60 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-separator/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-sm">
            ET
          </div>
          <span className="text-lg font-bold text-label">Expense Tracker</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={to === '/' ? handleHomeClick : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-soft text-accent'
                  : 'text-secondary hover:bg-surface-2 hover:text-label'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-tertiary'}`} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-separator/60">
        <p className="text-xs text-tertiary">v1.0.0 &middot; Local-first</p>
      </div>
    </aside>
  );
}