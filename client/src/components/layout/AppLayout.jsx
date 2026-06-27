import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const pageTitles = {
  '/': 'Dashboard',
  '/invoices': 'Invoices',
  '/invoices/new': 'New Invoice',
  '/quotations': 'Quotations',
  '/quotations/new': 'New Quotation',
  '/orders': 'Orders',
  '/credit-notes': 'Credit Notes',
  '/reports': 'Reports',
  '/customers': 'Customers',
  '/products': 'Products',
  '/settings': 'Settings'
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  let title = pageTitles[location.pathname] || '';
  if (location.pathname.match(/^\/invoices\/[^/]+\/edit$/)) title = 'Edit Invoice';
  else if (location.pathname.match(/^\/invoices\/[^/]+$/)) title = 'Invoice Details';
  else if (location.pathname.match(/^\/quotations\/[^/]+\/edit$/)) title = 'Edit Quotation';
  else if (location.pathname.match(/^\/quotations\/[^/]+$/)) title = 'Quotation Details';

  return (
    <div className="app-layout">
      <Sidebar show={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
