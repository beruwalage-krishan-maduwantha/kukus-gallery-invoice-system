import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CubeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', icon: HomeIcon, label: 'Dashboard' },
  { to: '/invoices', icon: DocumentTextIcon, label: 'Invoices' },
  { to: '/customers', icon: UserGroupIcon, label: 'Customers' },
  { to: '/products', icon: CubeIcon, label: 'Products' },
  { to: '/settings', icon: Cog6ToothIcon, label: 'Settings' },
];

export default function Sidebar({ show, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {show && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${show ? 'show' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="Kukus Gallery" className="sidebar-logo" />
          <span className="sidebar-brand">Invoice System</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon className="sidebar-link-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{user?.role}</span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Logout">
            <ArrowRightOnRectangleIcon />
          </button>
        </div>
      </aside>
    </>
  );
}
