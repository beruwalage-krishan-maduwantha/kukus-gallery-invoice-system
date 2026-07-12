import { BRAND } from '../brand';

// Section keys must match server/models/Role.js SECTIONS
export const SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', path: '/' },
  { key: 'quotations', label: 'Quotations', path: '/quotations' },
  { key: 'invoices', label: 'Invoices', path: '/invoices' },
  { key: 'orders', label: BRAND.ordersLabel, path: '/orders' },
  { key: 'expenses', label: 'Expenses', path: '/expenses' },
  { key: 'creditNotes', label: 'Credit Notes', path: '/credit-notes' },
  { key: 'reports', label: 'Reports', path: '/reports' },
  { key: 'customers', label: 'Customers', path: '/customers' },
  { key: 'products', label: 'Products', path: '/products' }
];

// Sections staff without an assigned job role can use (pre-roles behaviour)
const LEGACY_STAFF = ['quotations', 'invoices', 'orders', 'customers', 'expenses'];

export function hasSection(user, key) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (Array.isArray(user.permissions)) {
    return user.permissions.includes('*') || user.permissions.includes(key);
  }
  // stale cached user object from before roles existed
  return LEGACY_STAFF.includes(key);
}

export function firstAllowedPath(user) {
  const section = SECTIONS.find(s => hasSection(user, s.key));
  return section ? section.path : '/settings';
}
