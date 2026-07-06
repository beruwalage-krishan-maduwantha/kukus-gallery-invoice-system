import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BRAND } from '../../brand';
import {
  HomeIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  CubeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ReceiptRefundIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', icon: HomeIcon, label: 'Dashboard', access: 'admin' },
  { to: '/quotations', icon: DocumentDuplicateIcon, label: 'Quotations', access: 'all' },
  { to: '/invoices', icon: DocumentTextIcon, label: 'Invoices', access: 'all' },
  { to: '/orders', icon: ClipboardDocumentListIcon, label: 'Orders', access: 'all' },
  { to: '/expenses', icon: BanknotesIcon, label: 'Expenses', access: 'admin' },
  { to: '/credit-notes', icon: ReceiptRefundIcon, label: 'Credit Notes', access: 'admin' },
  { to: '/reports', icon: ChartBarIcon, label: 'Reports', access: 'admin' },
  { to: '/customers', icon: UserGroupIcon, label: 'Customers', access: 'all' },
  { to: '/products', icon: CubeIcon, label: 'Products', access: 'admin' },
  { to: '/settings', icon: Cog6ToothIcon, label: 'Settings', access: 'all' },
];

export default function Sidebar({ show, onClose }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const visibleItems = navItems.filter(item => item.access === 'all' || (item.access === 'admin' && isAdmin));

  return (
    <>
      {show && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${show ? 'show' : ''}`}>
        <div className="sidebar-header">
          <img src={BRAND.logo} alt={BRAND.name} className="sidebar-logo" />
          <span className="sidebar-brand">System</span>
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map(({ to, icon: Icon, label }) => (
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
