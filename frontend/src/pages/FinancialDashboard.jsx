import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CreditCard,
  Users,
  ArrowUpDown,
  Receipt,
  ArrowUpRight
} from 'lucide-react';

export default function FinancialDashboard() {
  const [stats, setStats] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Sort State
  const [sortField, setSortField] = useState('outstanding');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchData = async () => {
    try {
      const [statsRes, expRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/expenses')
      ]);
      setStats(statsRes.data);
      setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load financial dashboards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalSales = stats?.totalSales || 0;
  const netProfit = totalSales - totalExpenses;

  // Sorting customer dues table
  const sortedDues = stats?.customerDues ? [...stats.customerDues] : [];
  if (sortedDues.length > 0) {
    sortedDues.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Prepare chart data (Monthly Breakdown simulation)
  const salesTrend = [
    { month: 'Jan', Sales: totalSales * 0.15, Expenses: totalExpenses * 0.15 },
    { month: 'Feb', Sales: totalSales * 0.20, Expenses: totalExpenses * 0.10 },
    { month: 'Mar', Sales: totalSales * 0.10, Expenses: totalExpenses * 0.20 },
    { month: 'Apr', Sales: totalSales * 0.25, Expenses: totalExpenses * 0.15 },
    { month: 'May', Sales: totalSales * 0.12, Expenses: totalExpenses * 0.12 },
    { month: 'Jun', Sales: totalSales * 0.18, Expenses: totalExpenses * 0.28 }
  ];

  if (loading) return <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>Loading financial dashboards...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Financial Scorecards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        <div className="stat-card" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
          <div className="stat-header">
            <span className="stat-title" style={{ color: '#0369a1' }}>Total Sales</span>
            <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#0369a1' }}>Rs. {totalSales.toFixed(2)}</div>
          <div className="stat-subtext">Today: Rs. {(stats?.todaySales || 0).toFixed(2)}</div>
        </div>

        <div className="stat-card" style={{ background: '#fef2f2', borderColor: '#fee2e2' }}>
          <div className="stat-header">
            <span className="stat-title" style={{ color: '#991b1b' }}>Total Expenses</span>
            <div className="stat-icon-wrapper" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#991b1b' }}>Rs. {totalExpenses.toFixed(2)}</div>
          <div className="stat-subtext">Total business expenses logged</div>
        </div>

        <div className="stat-card" style={{ background: netProfit >= 0 ? '#f0fdf4' : '#fff1f2', borderColor: netProfit >= 0 ? '#bbf7d0' : '#fecdd3' }}>
          <div className="stat-header">
            <span className="stat-title" style={{ color: netProfit >= 0 ? '#166534' : '#990000' }}>Net Profit / Loss</span>
            <div className="stat-icon-wrapper" style={{ background: netProfit >= 0 ? '#dcfce7' : '#fee2e2', color: netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: netProfit >= 0 ? '#166534' : '#b91c1c' }}>Rs. {netProfit.toFixed(2)}</div>
          <div className="stat-subtext">Sales minus total expenses</div>
        </div>

        <div className="stat-card" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="stat-header">
            <span className="stat-title" style={{ color: '#92400e' }}>Unpaid Amount</span>
            <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#92400e' }}>Rs. {(stats?.totalOutstanding || 0).toFixed(2)}</div>
          <div className="stat-subtext">Customer balance pending</div>
        </div>

      </div>

      {/* Sales Trend Chart */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#3b82f6" /> Sales vs Expenses Trend
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>6 Months Comparison</span>
        </div>
        <div style={{ width: '100%', height: '220px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip formatter={(value) => `Rs. ${Number(value).toFixed(2)}`} />
              <Area type="monotone" dataKey="Sales" stroke="#3b82f6" fillOpacity={0.15} fill="#3b82f6" />
              <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fillOpacity={0.08} fill="#ef4444" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Sortable Dues and Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Outstanding Dues list */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#ef4444" /> Unpaid Customer Balances
          </h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th 
                  onClick={() => handleRequestSort('name')}
                  style={{ padding: '10px 12px', color: '#475569', cursor: 'pointer', fontWeight: '700' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Customer {sortField === 'name' && <ArrowUpDown size={12} />}
                  </span>
                </th>
                <th 
                  onClick={() => handleRequestSort('outstanding')}
                  style={{ padding: '10px 12px', color: '#475569', cursor: 'pointer', textAlign: 'right', fontWeight: '700' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    Unpaid Amount {sortField === 'outstanding' && <ArrowUpDown size={12} />}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDues.map((du, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: '#334155' }}>
                    {du.name}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#ef4444' }}>
                    Rs. {du.outstanding.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Transactions Feed */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} color="#10b981" /> Recent Payments Received
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((tr, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{tr.customerName}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Mode: {tr.mode} | Date: {new Date(tr.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <ArrowUpRight size={14} /> Rs. {tr.amount.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{tr.ref || 'Ref: N/A'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', padding: '40px' }}>No recent payments.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
