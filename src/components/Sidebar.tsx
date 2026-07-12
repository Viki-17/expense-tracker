import { NavLink, useLocation } from 'react-router-dom';
import { HomeIcon, ListBulletIcon, PlusCircleIcon, EnvelopeIcon, ChartBarIcon, CogIcon } from './Icons';

const navItems = [
  { to: '/', label: 'Dashboard', icon: HomeIcon },
  { to: '/transactions', label: 'Transactions', icon: ListBulletIcon },
  { to: '/add', label: 'Add Transaction', icon: PlusCircleIcon },
  { to: '/sms', label: 'SMS Import', icon: EnvelopeIcon },
  { to: '/budgets', label: 'Budgets', icon: ChartBarIcon },
  { to: '/settings', label: 'Settings', icon: CogIcon },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
            ET
          </div>
          <span className="text-lg font-semibold text-gray-900">Expense Tracker</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">v1.0.0 &middot; PWA Ready</p>
      </div>
    </aside>
  );
}
