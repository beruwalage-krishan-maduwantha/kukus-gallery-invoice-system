import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import { hasSection, firstAllowedPath } from './utils/permissions';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InvoiceListPage = lazy(() => import('./pages/InvoiceListPage'));
const InvoiceCreatePage = lazy(() => import('./pages/InvoiceCreatePage'));
const InvoiceViewPage = lazy(() => import('./pages/InvoiceViewPage'));
const QuotationListPage = lazy(() => import('./pages/QuotationListPage'));
const QuotationCreatePage = lazy(() => import('./pages/QuotationCreatePage'));
const QuotationViewPage = lazy(() => import('./pages/QuotationViewPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const CreditNotesPage = lazy(() => import('./pages/CreditNotesPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const CustomerListPage = lazy(() => import('./pages/CustomerListPage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function LazyPage({ Component, section }) {
  const { user } = useAuth();
  if (section && !hasSection(user, section)) {
    return <Navigate to={firstAllowedPath(user)} replace />;
  }
  return <Suspense fallback={<LoadingSpinner />}><Component /></Suspense>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'var(--font-body)', fontSize: '0.9rem', background: 'var(--surface)', color: 'var(--ink)' },
            success: { duration: 3000 },
            error: { duration: 4000 }
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<LazyPage Component={DashboardPage} section="dashboard" />} />
              <Route path="/invoices" element={<LazyPage Component={InvoiceListPage} section="invoices" />} />
              <Route path="/invoices/new" element={<LazyPage Component={InvoiceCreatePage} section="invoices" />} />
              <Route path="/invoices/:id" element={<LazyPage Component={InvoiceViewPage} section="invoices" />} />
              <Route path="/invoices/:id/edit" element={<LazyPage Component={InvoiceCreatePage} section="invoices" />} />
              <Route path="/quotations" element={<LazyPage Component={QuotationListPage} section="quotations" />} />
              <Route path="/quotations/new" element={<LazyPage Component={QuotationCreatePage} section="quotations" />} />
              <Route path="/quotations/:id" element={<LazyPage Component={QuotationViewPage} section="quotations" />} />
              <Route path="/quotations/:id/edit" element={<LazyPage Component={QuotationCreatePage} section="quotations" />} />
              <Route path="/orders" element={<LazyPage Component={OrdersPage} section="orders" />} />
              <Route path="/expenses" element={<LazyPage Component={ExpensesPage} section="expenses" />} />
              <Route path="/credit-notes" element={<LazyPage Component={CreditNotesPage} section="creditNotes" />} />
              <Route path="/reports" element={<LazyPage Component={ReportsPage} section="reports" />} />
              <Route path="/customers" element={<LazyPage Component={CustomerListPage} section="customers" />} />
              <Route path="/products" element={<LazyPage Component={ProductListPage} section="products" />} />
              <Route path="/settings" element={<LazyPage Component={SettingsPage} />} />
            </Route>
          </Route>
          <Route path="*" element={<LazyPage Component={NotFoundPage} />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
