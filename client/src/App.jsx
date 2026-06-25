import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InvoiceListPage from './pages/InvoiceListPage';
import InvoiceCreatePage from './pages/InvoiceCreatePage';
import InvoiceViewPage from './pages/InvoiceViewPage';
import CustomerListPage from './pages/CustomerListPage';
import ProductListPage from './pages/ProductListPage';
import SettingsPage from './pages/SettingsPage';
import CreditNotesPage from './pages/CreditNotesPage';
import QuotationListPage from './pages/QuotationListPage';
import QuotationCreatePage from './pages/QuotationCreatePage';
import QuotationViewPage from './pages/QuotationViewPage';
import ReportsPage from './pages/ReportsPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

function DashboardGuard() {
  const { user } = useAuth();
  if (user?.role === 'staff') return <Navigate to="/quotations" replace />;
  return <DashboardPage />;
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
              <Route path="/invoices" element={<InvoiceListPage />} />
              <Route path="/invoices/new" element={<InvoiceCreatePage />} />
              <Route path="/invoices/:id" element={<InvoiceViewPage />} />
              <Route path="/invoices/:id/edit" element={<InvoiceCreatePage />} />
              <Route path="/quotations" element={<QuotationListPage />} />
              <Route path="/quotations/new" element={<QuotationCreatePage />} />
              <Route path="/quotations/:id" element={<QuotationViewPage />} />
              <Route path="/quotations/:id/edit" element={<QuotationCreatePage />} />
              <Route path="/credit-notes" element={<CreditNotesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/customers" element={<CustomerListPage />} />
              <Route path="/products" element={<ProductListPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
