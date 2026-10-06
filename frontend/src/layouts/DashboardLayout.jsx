import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Users, BookOpen, Building2,
  Package, Truck, DollarSign, Receipt, FileText,
  CreditCard, BarChart3, ShieldAlert, Settings, LogOut, Activity
} from 'lucide-react';

export default function DashboardLayout({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login', { replace: true });
  };

  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path || path === 'dashboard') return 'Dashboard';
    return path.replace(/-/g, ' ');
  };

  const renderSidebar = () => {
    if (user.role === 'admin') {
      return (
        <aside className="sidebar no-print">
          <div className="sidebar-header">
            <div className="logo-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="2" y="18" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="800" fill="white">NE</text>
              </svg>
            </div>
            <div>
              <div className="sidebar-title">NARESH ENTERPRISES</div>
              <div className="sidebar-subtitle">Distribution Management ERP</div>
            </div>
          </div>

          <div className="sidebar-menu">
            <div className="sidebar-section-label">Overview</div>
            <NavLink to="/dashboard" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><LayoutDashboard size={18} /></span> Dashboard
            </NavLink>
            <NavLink to="/sales-dashboard" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><TrendingUp size={18} /></span> Sales Dashboard
            </NavLink>

            <div className="sidebar-section-label">Parties & People</div>
            <NavLink to="/customers" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><Users size={18} /></span> Customers
            </NavLink>
            <NavLink to="/customer-ledgers" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><BookOpen size={18} /></span> Customer Ledgers
            </NavLink>
            <NavLink to="/suppliers" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><Building2 size={18} /></span> Suppliers
            </NavLink>

            <div className="sidebar-section-label">Inventory & Logistics</div>
            <NavLink to="/products" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><Package size={18} /></span> Products
            </NavLink>
            <NavLink to="/purchase-orders" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><Truck size={18} /></span> Purchase Orders
            </NavLink>
            <NavLink to="/expenses" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><DollarSign size={18} /></span> Expenses
            </NavLink>

            <div className="sidebar-section-label">Sales & Billing</div>
            <NavLink to="/orders" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><Receipt size={18} /></span> Orders
            </NavLink>
            <NavLink to="/quotes" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><FileText size={18} /></span> Quotes
            </NavLink>
            <NavLink to="/bills" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><Receipt size={18} /></span> Bills
            </NavLink>
            <NavLink to="/checkout-invoice" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><FileText size={18} /></span> Checkout Invoice
            </NavLink>
            <NavLink to="/payments" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><CreditCard size={18} /></span> Payments
            </NavLink>

            <div className="sidebar-section-label">Analytics & Comm</div>
            <NavLink to="/reports" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><BarChart3 size={18} /></span> Reports
            </NavLink>
            <NavLink to="/audit-logs" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><ShieldAlert size={18} /></span> Audit Logs
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <span className="menu-icon"><Settings size={18} /></span> Settings
            </NavLink>
          </div>

          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{user.name}</strong>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Administrator</div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </aside>
      );
    }
    return null;
  };

  return (
    <div className="app-container">
      {renderSidebar()}
      <div className="content-area">
        <header className="top-navbar no-print">
          <div className="page-title">
            <span style={{ color: '#94a3b8', fontWeight: '500' }}>Shop &raquo; </span>
            <span style={{ textTransform: 'capitalize', color: '#1e293b' }}>{getPageTitle()}</span>
          </div>

          <div className="nav-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'var(--primary-light)', padding: '4px 12px', borderRadius: '9999px', border: '1px solid var(--primary-border)' }}>
              <Activity size={14} color="var(--primary)" />
              <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>System Online</span>
            </div>

            <div className="nav-profile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${user.role === 'admin' ? 'badge-info' : 'badge-success'}`}>
                {user.role}
              </span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{user.name}</strong>
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
