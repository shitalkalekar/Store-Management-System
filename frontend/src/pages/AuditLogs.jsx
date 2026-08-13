import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter States
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    try {
      let queryParams = [];
      if (selectedUser) queryParams.push(`user=${selectedUser}`);
      if (selectedEntity) queryParams.push(`entity=${selectedEntity}`);
      if (startDate) queryParams.push(`startDate=${startDate}`);
      if (endDate) queryParams.push(`endDate=${endDate}`);

      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await api.get(`/data/audit-logs${queryStr}`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system audit logs');
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  useEffect(() => {
    const init = async () => {
      await fetchLogs();
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Filters Form */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
          
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>Staff</label>
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px' }}
            >
              <option value="">All Staff</option>
              {employees.filter(emp => emp.user).map(emp => (
                <option key={emp.user._id} value={emp.user._id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>Category</label>
            <select 
              value={selectedEntity} 
              onChange={(e) => setSelectedEntity(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px' }}
            >
              <option value="">All Categories</option>
              <option value="Customer">Customer</option>
              <option value="Vendor">Supplier</option>
              <option value="Product">Product</option>
              <option value="Order">Order</option>
              <option value="Bill">Bill</option>
              <option value="Payment">Payment</option>
              <option value="Setting">Settings</option>
              <option value="Employee">Staff</option>
              <option value="Expense">Expense</option>
              <option value="PurchaseOrder">Purchase Order</option>
              <option value="ProductStock">Stock Adjustment</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>From Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>To Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
          </div>

          <button type="submit" style={{ padding: '9px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
            Apply Filter
          </button>
        </form>
      </div>

      {/* Logs Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 20px', color: '#475569', fontWeight: 'bold' }}>Sr. No.</th>
              <th style={{ padding: '12px 20px', color: '#475569', fontWeight: 'bold' }}>Timestamp</th>
              <th style={{ padding: '12px 20px', color: '#475569', fontWeight: 'bold' }}>Staff</th>
              <th style={{ padding: '12px 20px', color: '#475569', fontWeight: 'bold' }}>Action</th>
              <th style={{ padding: '12px 20px', color: '#475569', fontWeight: 'bold' }}>Category</th>
              <th style={{ padding: '12px 20px', color: '#475569', fontWeight: 'bold' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 20px', color: '#475569', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ padding: '12px 20px', color: '#64748b' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '12px 20px', fontWeight: '600', color: '#334155' }}>
                    {log.user ? `${log.user.name} (${log.user.email})` : 'System'}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontWeight: 'bold',
                      background: log.action === 'create' ? '#d1fae5' : log.action === 'delete' ? '#fee2e2' : '#eff6ff',
                      color: log.action === 'create' ? '#065f46' : log.action === 'delete' ? '#b91c1c' : '#1d4ed8',
                      textTransform: 'uppercase'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', color: '#475569' }}>{log.entity}</td>
                  <td style={{ padding: '12px 20px', color: '#475569', fontFamily: 'monospace', fontSize: '11px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.diff}>
                    {log.diff}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
