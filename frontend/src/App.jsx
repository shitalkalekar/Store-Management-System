import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import api, { AUTH_EXPIRED_EVENT, clearAccessToken, setAccessToken } from './services/api.js';
import { Loader2 } from 'lucide-react';

// Import Pages
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Customers from './pages/Customers.jsx';
import Vendors from './pages/Vendors.jsx';
import Products from './pages/Products.jsx';
import Orders from './pages/Orders.jsx';
import Quotations from './pages/Quotations.jsx';
import Bills from './pages/Bills.jsx';
import Payments from './pages/Payments.jsx';
import Reports from './pages/Reports.jsx';
import SettingsPage from './pages/Settings.jsx';

// Advanced Pages
import FinancialDashboard from './pages/FinancialDashboard.jsx';
import Purchases from './pages/Purchases.jsx';
import Expenses from './pages/Expenses.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import CustomerLedgers from './pages/CustomerLedgers.jsx';
import InvoiceGenerator from './pages/InvoiceGenerator.jsx';

// Layouts & Routes
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

const NotFound = () => (
  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
    <h2 style={{ color: '#1e293b' }}>404 - Page Not Found</h2>
    <p style={{ color: '#64748b' }}>The page you are looking for does not exist.</p>
  </div>
);

// Map old page keys → URL routes
const PAGE_KEY_TO_URL = {
  dashboard: '/dashboard',
  financial_dashboard: '/sales-dashboard',
  customers: '/customers',
  customer_ledgers: '/customer-ledgers',
  vendors: '/suppliers',
  products: '/products',
  purchases: '/purchase-orders',
  expenses: '/expenses',
  orders: '/orders',
  quotations: '/quotes',
  bills: '/bills',
  checkout_invoice: '/checkout-invoice',
  payments: '/payments',
  reports: '/reports',
  audit_logs: '/audit-logs',
  settings: '/settings',
};

// Wrapper for pages that expect onNavigate
const PageWrapper = ({ children }) => {
  const navigate = useNavigate();
  const handleNavigate = (page) => {
    const route = PAGE_KEY_TO_URL[page] || ('/' + page.replace(/_/g, '-'));
    navigate(route);
  };
  return React.cloneElement(children, { onNavigate: handleNavigate });
};

function AppContent() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('sis_jwt_token') || sessionStorage.getItem('sis_jwt_token');
      if (token) {
        setAccessToken(token);
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user || res.data);
        } catch (err) {
          if (err.response?.status === 401) {
            clearAccessToken();
            localStorage.removeItem('sis_jwt_token');
            sessionStorage.removeItem('sis_jwt_token');
          } else {
            console.warn('Auth check skipped or rate limited:', err.message);
          }
        }
      }
      setCheckingAuth(false);
    };
    initAuth();

    const handleExpiredAuth = () => {
      setUser(null);
      clearAccessToken();
      localStorage.removeItem('sis_jwt_token');
      sessionStorage.removeItem('sis_jwt_token');
      navigate('/login', { replace: true });
    };
    
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredAuth);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredAuth);
  }, [navigate]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    setUser(null);
    clearAccessToken();
    localStorage.removeItem('sis_jwt_token');
    sessionStorage.removeItem('sis_jwt_token');
    navigate('/login', { replace: true });
  };

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main, #F6F8FA)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Loader2 size={36} color="var(--primary, #6C3EB8)" className="animate-spin" />
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary, #64748B)' }}>Authenticating user session...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<PublicRoute user={user} />}>
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      </Route>

      <Route element={<ProtectedRoute user={user} />}>
        <Route element={<DashboardLayout user={user} onLogout={handleLogout} />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<PageWrapper><Dashboard role={user?.role} /></PageWrapper>} />
          <Route path="/sales-dashboard" element={<FinancialDashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customer-ledgers" element={<PageWrapper><CustomerLedgers /></PageWrapper>} />
          <Route path="/suppliers" element={<Vendors />} />
          <Route path="/products" element={<Products />} />
          <Route path="/purchase-orders" element={<PageWrapper><Purchases /></PageWrapper>} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/orders" element={<PageWrapper><Orders /></PageWrapper>} />
          <Route path="/quotes" element={<Quotations />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/checkout-invoice" element={<PageWrapper><InvoiceGenerator /></PageWrapper>} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
