import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function PublicTracking() {
  const [orderId, setOrderId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Extract ID from path like /track/12345
    const pathParts = window.location.pathname.split('/');
    const idIndex = pathParts.indexOf('track');
    if (idIndex !== -1 && pathParts.length > idIndex + 1) {
      const id = pathParts[idIndex + 1];
      setOrderId(id);
      fetchTrackingData(id);
    } else {
      setError('Invalid tracking URL.');
      setLoading(false);
    }
  }, []);

  const fetchTrackingData = async (id) => {
    try {
      const res = await api.get(`/track/${id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Order not found or tracking unavailable.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading tracking information...</div>;
  }

  if (error || !data) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#b91c1c' }}>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return '#f59e0b';
      case 'Assigned': return '#3b82f6';
      case 'Packed': return '#8b5cf6';
      case 'Out for Delivery': return '#f97316';
      case 'Delivered': return '#10b981';
      case 'Cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '30px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '5px' }}>Delivery Tracking</h1>
          <p style={{ color: '#64748b' }}>Order ID: {data.id.substring(18).toUpperCase()}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Customer</div>
            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{data.customer}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Expected Delivery</div>
            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{new Date(data.deliveryDate).toLocaleDateString()}</div>
          </div>
        </div>

        <div style={{ padding: '15px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          <div style={{ fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>Current Status:</div>
          <div style={{ padding: '6px 16px', borderRadius: '20px', background: getStatusColor(data.status), color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>
            {data.status}
          </div>
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#334155', marginBottom: '15px' }}>Tracking History</h3>
        <div style={{ marginLeft: '10px', borderLeft: '2px solid #e2e8f0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {data.statusHistory && data.statusHistory.map((h, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-27px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: getStatusColor(h.status), border: '2px solid #fff' }}></div>
              <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>{h.status}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(h.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {(data.latitude !== 0 && data.longitude !== 0 && data.status === 'Out for Delivery') && (
          <div style={{ marginTop: '30px', padding: '15px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '10px' }}>Live Location</h3>
            <div style={{ height: '200px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight="0" 
                marginWidth="0" 
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(data.longitude)-0.005},${Number(data.latitude)-0.005},${Number(data.longitude)+0.005},${Number(data.latitude)+0.005}&layer=mapnik&marker=${Number(data.latitude)},${Number(data.longitude)}`}
              ></iframe>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
