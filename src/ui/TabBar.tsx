import { NavLink } from 'react-router';
import { BookMarked, CalendarDays, Settings, TrendingUp, type LucideIcon } from 'lucide-react';

const TABS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Hoy', icon: CalendarDays, end: true },
  { to: '/comidas', label: 'Comidas', icon: BookMarked },
  { to: '/progreso', label: 'Progreso', icon: TrendingUp },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Secciones">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="tabbar__item">
          <Icon size={25} strokeWidth={1.8} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
