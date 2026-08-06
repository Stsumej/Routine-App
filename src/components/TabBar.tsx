import { Home, BarChart3, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' || p.startsWith('/routines') },
  { to: '/insights', label: 'Insights', icon: BarChart3, match: (p: string) => p.startsWith('/insights') },
  { to: '/profile', label: 'Profile', icon: User, match: (p: string) => p.startsWith('/profile') },
];

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="tabbar">
      {TABS.map(({ to, label, icon: Icon, match }) => (
        <Link key={to} to={to} className={`tab${match(pathname) ? ' active' : ''}`}>
          <Icon size={20} strokeWidth={2} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
