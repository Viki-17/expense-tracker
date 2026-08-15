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
    <aside className="fixed left-4 top-4 bottom-4 h-[calc(100%-2rem)] w-64 bg-surface/95 border border-separator/50 rounded-[2rem] flex flex-col shadow-card overflow-hidden">
      <div className="h-20 flex items-center px-6 border-b border-separator/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-on-accent font-bold text-sm shadow-lg shadow-accent/20">
            <span className="tracking-[-0.12em]">KK</span>
          </div>
          <span className="text-lg font-bold tracking-[-0.03em] text-label">KaiKanakku</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={to === '/' ? handleHomeClick : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-on-accent shadow-lg shadow-accent/10'
                  : 'text-secondary hover:bg-surface-2 hover:text-label'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-on-accent' : 'text-tertiary'}`} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-5 border-t border-separator/40">
        <p className="text-xs text-tertiary">v1.0.0 &middot; Local-first</p>
      </div>
    </aside>
  );
}
