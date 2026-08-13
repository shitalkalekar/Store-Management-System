import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function CustomerDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In future phases, we will fetch specific dashboard data for the customer
    api.get('/auth/me')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading Customer Portal...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>Welcome back, {user?.name}!</h2>
        <p style={{ color: '#64748b' }}>This is your customer portal. Here you can track orders, view invoices, and make payments online.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '14px', color: '#475569', marginBottom: '10px' }}>Your Outstanding Balance</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#b91c1c' }}>Rs. 0.00</div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>No pending invoices.</p>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '14px', color: '#475569', marginBottom: '10px' }}>Active Orders</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#047857' }}>0</div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>Currently processing or out for delivery.</p>
        </div>
      </div>
      
      {/* We will build the rest of this page out during the Online Order Booking task */}
    </div>
  );
}
