import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import LoadingSpinner from './components/common/LoadingSpinner';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InvoiceListPage = lazy(() => import('./pages/InvoiceListPage'));
const InvoiceCreatePage = lazy(() => import('./pages/InvoiceCreatePage'));
const InvoiceViewPage = lazy(() => import('./pages/InvoiceViewPage'));
const QuotationListPage = lazy(() => import('./pages/QuotationListPage'));
const QuotationCreatePage = lazy(() => import('./pages/QuotationCreatePage'));
const QuotationViewPage = lazy(() => import('./pages/QuotationViewPage'));
const CreditNotesPage = lazy(() => import('./pages/CreditNotesPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const CustomerListPage = lazy(() => import('./pages/CustomerListPage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function DashboardGuard() {
  const { user } = useAuth();
  if (user?.role === 'staff') return <Navigate to="/quotations" replace />;
  return <Suspense fallback={<LoadingSpinner />}><DashboardPage /></Suspense>;
}

function LazyPage({ Component }) {
  return <Suspense fallback={<LoadingSpinner />}><Component /></Suspense>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'var(--font-body)', fontSize: '0.9rem' },
            success: { duration: 3000 },
            error: { duration: 4000 }
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardGuard />} />
              <Route path="/invoices" element={<LazyPage Component={InvoiceListPage} />} />
              <Route path="/invoices/new" element={<LazyPage Component={InvoiceCreatePage} />} />
              <Route path="/invoices/:id" element={<LazyPage Component={InvoiceViewPage} />} />
              <Route path="/invoices/:id/edit" element={<LazyPage Component={InvoiceCreatePage} />} />
              <Route path="/quotations" element={<LazyPage Component={QuotationListPage} />} />
              <Route path="/quotations/new" element={<LazyPage Component={QuotationCreatePage} />} />
              <Route path="/quotations/:id" element={<LazyPage Component={QuotationViewPage} />} />
              <Route path="/quotations/:id/edit" element={<LazyPage Component={QuotationCreatePage} />} />
              <Route path="/credit-notes" element={<LazyPage Component={CreditNotesPage} />} />
              <Route path="/reports" element={<LazyPage Component={ReportsPage} />} />
              <Route path="/customers" element={<LazyPage Component={CustomerListPage} />} />
              <Route path="/products" element={<LazyPage Component={ProductListPage} />} />
              <Route path="/settings" element={<LazyPage Component={SettingsPage} />} />
            </Route>
          </Route>
          <Route path="*" element={<LazyPage Component={NotFoundPage} />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
