import { NavLink } from 'react-router-dom';
import { HomeIcon, ListBulletIcon, PlusCircleIcon, EnvelopeIcon, ChartBarIcon } from './Icons';

const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/transactions', label: 'History', icon: ListBulletIcon },
  { to: '/add', label: 'Add', icon: PlusCircleIcon },
  { to: '/sms', label: 'SMS', icon: EnvelopeIcon },
  { to: '/budgets', label: 'Budget', icon: ChartBarIcon },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
