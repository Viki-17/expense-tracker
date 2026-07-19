import { NavLink } from 'react-router-dom';
import { HomeIcon, ListBulletIcon, PlusCircleIcon, EnvelopeIcon, ChartBarIcon } from './Icons';

const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/transactions', label: 'Activity', icon: ListBulletIcon },
  { to: '/add', label: 'Add', icon: PlusCircleIcon, primary: true },
  { to: '/sms', label: 'SMS', icon: EnvelopeIcon },
  { to: '/budgets', label: 'Budget', icon: ChartBarIcon },
];

export default function BottomNav() {
  const handleHomeClick = () => {
    sessionStorage.removeItem('dashboardTab');
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom">
      <div className="mx-auto max-w-md px-3 pb-1 pt-2">
        <div className="flex items-center justify-around rounded-2xl bg-surface/90 backdrop-blur-xl border border-separator/60 shadow-card h-16 px-1">
          {navItems.map(({ to, label, icon: Icon, primary }) =>
            primary ? (
              <NavLink
                key={to}
                to={to}
                className="tap -mt-6 flex items-center justify-center w-14 h-14 rounded-2xl bg-accent text-white shadow-card"
                aria-label={label}
              >
                <Icon className="w-7 h-7" />
              </NavLink>
            ) : (
              <NavLink
                key={to}
                to={to}
                onClick={to === '/' ? handleHomeClick : undefined}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition-colors tap ${
                    isActive ? 'text-accent' : 'text-tertiary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-6 h-6 transition-transform ${isActive ? '' : ''}`} strokeWidth={isActive ? 2 : 1.6} />
                    <span className="text-[10px] font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            )
          )}
        </div>
      </div>
    </nav>
  );
}