import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Building2,
  Landmark,
  MessageSquare,
  Store,
  Database,
  Download,
  Upload,
  Plus,
  Save,
  CheckCircle2,
  FileText,
  Printer,
  Sliders,
  Receipt,
  Layout,
  Check
} from 'lucide-react';
import Toast from '../components/Toast.jsx';
import {
  validateName,
  sanitizeNameInput,
  sanitizeNumericInput,
  validateMobile,
  validateEmail,
  validateGST,
  validatePAN,
  trimObjectValues
} from '../utils/formValidation.js';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'bank' | 'pdf' | 'messages' | 'branches' | 'backup'
  const [settings, setSettings] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState({ type: 'success', message: '' });

  // Add Branch Form State
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', address: '', contact: '' });

  // Backup & Restore State
  const [restoreFile, setRestoreFile] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [settRes, branchRes] = await Promise.all([
        api.get('/settings'),
        api.get('/branches')
      ]);
      setSettings(settRes.data);
      setBranches(Array.isArray(branchRes.data) ? branchRes.data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch settings parameters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSettings = async (e) => {
    if (e) e.preventDefault();
    setSuccess('');
    setError('');
    try {
      await api.put('/settings', settings);
      setSuccess('System configuration parameters updated successfully! ✅');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError('Failed to update system settings');
    }
  };

  const handleAddBranchSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      await api.post('/branches', branchForm);
      setSuccess('New branch registered successfully! ✅');
      setShowAddBranch(false);
      setBranchForm({ name: '', address: '', contact: '' });
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to register branch');
    }
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.get('/data/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medical_system_backup_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('Database backup downloaded successfully! 💾');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError('Failed to generate database backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    if (!restoreFile) return;
    setBackupLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('backup', restoreFile);
      await api.post('/data/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Database restored successfully! Refreshing...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      setError('Failed to restore database from backup file');
    } finally {
      setBackupLoading(false);
    }
  };

  const currentTemplate = settings?.pdfSettings?.billTemplate || 'MODERN_TAX_INVOICE';

  if (loading) return <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>Loading system settings control panel...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Alert Notifications */}
      {success && (
        <div style={{ padding: '12px 16px', background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
          {error}
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap', gap: '6px' }}>
        <button 
          onClick={() => setActiveTab('shop')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'shop' ? '3px solid #3b82f6' : '3px solid transparent', fontWeight: '700', fontSize: '13px', color: activeTab === 'shop' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          <Building2 size={16} /> Shop Details
        </button>
        <button 
          onClick={() => setActiveTab('bank')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'bank' ? '3px solid #3b82f6' : '3px solid transparent', fontWeight: '700', fontSize: '13px', color: activeTab === 'bank' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          <Landmark size={16} /> Bank Details
        </button>
        <button 
          onClick={() => setActiveTab('pdf')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'pdf' ? '3px solid #3b82f6' : '3px solid transparent', fontWeight: '700', fontSize: '13px', color: activeTab === 'pdf' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          <Printer size={16} /> Bill Formats & PDF Settings
        </button>
        <button 
          onClick={() => setActiveTab('messages')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'messages' ? '3px solid #3b82f6' : '3px solid transparent', fontWeight: '700', fontSize: '13px', color: activeTab === 'messages' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          <MessageSquare size={16} /> Payment Messages
        </button>
        <button 
          onClick={() => setActiveTab('branches')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'branches' ? '3px solid #3b82f6' : '3px solid transparent', fontWeight: '700', fontSize: '13px', color: activeTab === 'branches' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          <Store size={16} /> Branch Registry ({branches.length})
        </button>
        <button 
          onClick={() => setActiveTab('backup')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'backup' ? '3px solid #3b82f6' : '3px solid transparent', fontWeight: '700', fontSize: '13px', color: activeTab === 'backup' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          <Database size={16} /> Data Backup & Restore
        </button>
      </div>

      {/* Tab 1: Shop Details */}
      {activeTab === 'shop' && (
        <div className="card" style={{ maxWidth: '700px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} color="#3b82f6" /> Shop Profile & GST Configuration
          </h3>
          
          <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Shop Name</label>
              <input 
                type="text"
                value={settings?.companyName || ''}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>GSTIN Number</label>
                <input 
                  type="text"
                  value={settings?.gstNumber || ''}
                  onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>State</label>
                <input 
                  type="text"
                  value={settings?.state || 'Maharashtra'}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Contact Phone</label>
                <input 
                  type="text"
                  value={settings?.contact || ''}
                  onChange={(e) => setSettings({ ...settings, contact: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Official Email</label>
                <input 
                  type="email"
                  value={settings?.email || ''}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Shop Address</label>
              <textarea 
                value={settings?.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
              <Save size={16} /> Save Shop Details
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Bank Details */}
      {activeTab === 'bank' && (
        <div className="card" style={{ maxWidth: '700px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={18} color="#3b82f6" /> Bank Account Details for Invoices
          </h3>
          
          <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Bank Name</label>
              <input 
                type="text"
                value={settings?.bankDetails?.bankName || ''}
                onChange={(e) => setSettings({ ...settings, bankDetails: { ...settings?.bankDetails, bankName: e.target.value } })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Account Number</label>
                <input 
                  type="text"
                  value={settings?.bankDetails?.accountNo || ''}
                  onChange={(e) => setSettings({ ...settings, bankDetails: { ...settings?.bankDetails, accountNo: e.target.value } })}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>IFSC Code</label>
                <input 
                  type="text"
                  value={settings?.bankDetails?.ifscCode || ''}
                  onChange={(e) => setSettings({ ...settings, bankDetails: { ...settings?.bankDetails, ifscCode: e.target.value } })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
              <Save size={16} /> Save Bank Details
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Bill Formats & PDF Page Size Settings */}
      {activeTab === 'pdf' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Bill Format Selection Cards */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layout size={18} color="#3b82f6" /> Select System Bill Format & Design Template
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Choose which bill format the admin wants to use. The selected format will be applied system-wide wherever bills are generated or downloaded.
                </p>
              </div>
            </div>

            {/* Template Selection Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '16px' }}>
              
              {/* Option 1: Classic Retail Memo Book */}
              <div 
                onClick={() => setSettings({
                  ...settings,
                  pdfSettings: { ...(settings?.pdfSettings || {}), billTemplate: 'CLASSIC_MEMO_BOOK' }
                })}
                style={{ 
                  border: currentTemplate === 'CLASSIC_MEMO_BOOK' ? '2px solid #b91c1c' : '1px solid #cbd5e1',
                  borderRadius: '12px', padding: '18px', cursor: 'pointer', background: currentTemplate === 'CLASSIC_MEMO_BOOK' ? '#fff5f5' : '#ffffff',
                  boxShadow: currentTemplate === 'CLASSIC_MEMO_BOOK' ? '0 4px 12px rgba(185, 28, 28, 0.15)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '800', fontSize: '14px', color: '#b91c1c' }}>🔴 Classic Retail Bill Book (Memo Format)</span>
                  {currentTemplate === 'CLASSIC_MEMO_BOOK' && <span className="badge badge-danger" style={{ background: '#b91c1c', color: '#fff' }}>ACTIVE</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5', marginBottom: '12px' }}>
                  Inspired by classic physical printed memo bill books. Features red border framing, header banner box, Serial <code>No.</code> line, <code>Shri</code> customer line, itemized grid (No., Particulars, Qty, Rate, Amount), bottom <code>TOTAL</code> box, and <code>For: [Shop Name]</code> signature block.
                </div>
                <div style={{ fontSize: '11px', color: '#991b1b', background: '#fee2e2', padding: '6px 10px', borderRadius: '6px', fontWeight: '700' }}>
                  Recommended for Retail Stores & Memo Billing
                </div>
              </div>

              {/* Option 2: Modern Corporate Tax Invoice */}
              <div 
                onClick={() => setSettings({
                  ...settings,
                  pdfSettings: { ...(settings?.pdfSettings || {}), billTemplate: 'MODERN_TAX_INVOICE' }
                })}
                style={{ 
                  border: currentTemplate === 'MODERN_TAX_INVOICE' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  borderRadius: '12px', padding: '18px', cursor: 'pointer', background: currentTemplate === 'MODERN_TAX_INVOICE' ? '#eff6ff' : '#ffffff',
                  boxShadow: currentTemplate === 'MODERN_TAX_INVOICE' ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '800', fontSize: '14px', color: '#1e40af' }}>🏢 Modern Corporate Tax Invoice</span>
                  {currentTemplate === 'MODERN_TAX_INVOICE' && <span className="badge badge-info" style={{ background: '#2563eb', color: '#fff' }}>ACTIVE</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5', marginBottom: '12px' }}>
                  Clean corporate invoice layout with GSTIN breakdown (CGST, SGST, IGST), payment status badges, Billed To customer box, and official Bank Account payment details.
                </div>
                <div style={{ fontSize: '11px', color: '#1d4ed8', background: '#dbeafe', padding: '6px 10px', borderRadius: '6px', fontWeight: '700' }}>
                  Recommended for B2B & Wholesale Distributions
                </div>
              </div>

              {/* Option 3: Elegant Minimalist Invoice */}
              <div 
                onClick={() => setSettings({
                  ...settings,
                  pdfSettings: { ...(settings?.pdfSettings || {}), billTemplate: 'ELEGANT_MINIMAL' }
                })}
                style={{ 
                  border: currentTemplate === 'ELEGANT_MINIMAL' ? '2px solid #6366f1' : '1px solid #cbd5e1',
                  borderRadius: '12px', padding: '18px', cursor: 'pointer', background: currentTemplate === 'ELEGANT_MINIMAL' ? '#f5f3ff' : '#ffffff',
                  boxShadow: currentTemplate === 'ELEGANT_MINIMAL' ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '800', fontSize: '14px', color: '#4338ca' }}>✨ Minimalist Enterprise Invoice</span>
                  {currentTemplate === 'ELEGANT_MINIMAL' && <span className="badge" style={{ background: '#6366f1', color: '#fff' }}>ACTIVE</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5', marginBottom: '12px' }}>
                  Sleek minimalist enterprise style with top indigo accent header bar, crisp typography, simplified item list, and clean summary figures.
                </div>
                <div style={{ fontSize: '11px', color: '#4338ca', background: '#ede9fe', padding: '6px 10px', borderRadius: '6px', fontWeight: '700' }}>
                  Recommended for Modern Clinics & Pharmacies
                </div>
              </div>

              {/* Option 4: Thermal Receipt POS */}
              <div 
                onClick={() => setSettings({
                  ...settings,
                  pdfSettings: { ...(settings?.pdfSettings || {}), billTemplate: 'THERMAL_POS' }
                })}
                style={{ 
                  border: currentTemplate === 'THERMAL_POS' ? '2px solid #059669' : '1px solid #cbd5e1',
                  borderRadius: '12px', padding: '18px', cursor: 'pointer', background: currentTemplate === 'THERMAL_POS' ? '#ecfdf5' : '#ffffff',
                  boxShadow: currentTemplate === 'THERMAL_POS' ? '0 4px 12px rgba(5, 150, 105, 0.15)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '800', fontSize: '14px', color: '#047857' }}>🧾 Thermal Receipt (POS Slip)</span>
                  {currentTemplate === 'THERMAL_POS' && <span className="badge badge-success" style={{ background: '#059669', color: '#fff' }}>ACTIVE</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5', marginBottom: '12px' }}>
                  Compact continuous thermal receipt roll format designed specifically for 80mm thermal receipt printers.
                </div>
                <div style={{ fontSize: '11px', color: '#047857', background: '#d1fae5', padding: '6px 10px', borderRadius: '6px', fontWeight: '700' }}>
                  Recommended for POS Receipt Printers
                </div>
              </div>

            </div>

            <button onClick={handleUpdateSettings} className="btn btn-primary" style={{ marginTop: '20px' }}>
              <Save size={16} /> Save Selected Bill Format
            </button>
          </div>

          {/* Paper Dimensions Section */}
          <div className="card" style={{ maxWidth: '700px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} color="#3b82f6" /> Document Paper Dimensions
            </h3>

            <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  📄 Bill Page Paper Size
                </label>
                <select 
                  value={settings?.pdfSettings?.billPageSize || 'A4'}
                  onChange={(e) => setSettings({
                    ...settings,
                    pdfSettings: { ...(settings?.pdfSettings || {}), billPageSize: e.target.value }
                  })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px' }}
                >
                  <option value="A4">A4 Standard (Full Page — 210 × 297 mm)</option>
                  <option value="A5">A5 Half Page (Compact Receipt — 148 × 210 mm)</option>
                  <option value="LETTER">US Letter Size (Standard — 216 × 279 mm)</option>
                  <option value="THERMAL_80MM">80mm Thermal Receipt Roll (POS Roll)</option>
                </select>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  📄 Quotation Page Paper Size
                </label>
                <select 
                  value={settings?.pdfSettings?.quotationPageSize || 'A4'}
                  onChange={(e) => setSettings({
                    ...settings,
                    pdfSettings: { ...(settings?.pdfSettings || {}), quotationPageSize: e.target.value }
                  })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px' }}
                >
                  <option value="A4">A4 Standard (Full Page — 210 × 297 mm)</option>
                  <option value="A5">A5 Half Page (Compact Estimate — 148 × 210 mm)</option>
                  <option value="LETTER">US Letter Size (Standard — 216 × 279 mm)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <Save size={16} /> Save Settings
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Tab 4: Payment Messages */}
      {activeTab === 'messages' && (
        <div className="card" style={{ maxWidth: '700px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="#3b82f6" /> Payment Reminder Message Templates
          </h3>
          
          <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>English Message Template</label>
              <textarea 
                value={settings?.smsTemplates?.english || ''}
                onChange={(e) => setSettings({ ...settings, smsTemplates: { ...settings?.smsTemplates, english: e.target.value } })}
                rows="3"
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Marathi Message Template (मराठी)</label>
              <textarea 
                value={settings?.smsTemplates?.marathi || ''}
                onChange={(e) => setSettings({ ...settings, smsTemplates: { ...settings?.smsTemplates, marathi: e.target.value } })}
                rows="3"
              />
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              Available placeholders: <code>{'{customer_name}'}</code>, <code>{'{amount}'}</code>, <code>{'{company_name}'}</code>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
              <Save size={16} /> Save Message Templates
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: Branch Registry */}
      {activeTab === 'branches' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={18} color="#3b82f6" /> Multi-Branch Registry
            </h3>
            <button 
              onClick={() => setShowAddBranch(true)}
              className="btn btn-primary"
            >
              <Plus size={16} /> Add New Branch
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>Contact Number</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(br => (
                  <tr key={br._id}>
                    <td style={{ fontWeight: '700', color: '#0f172a' }}>{br.name}</td>
                    <td>{br.contact}</td>
                    <td>{br.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Data Backup & Restore */}
      {activeTab === 'backup' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} color="#10b981" /> System Database Export
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Download a complete JSON snapshot of all system records (Products, Customers, Bills, Orders, Expenses, and Settings).
            </p>
            <button 
              onClick={handleDownloadBackup} 
              disabled={backupLoading}
              className="btn btn-success"
            >
              <Download size={16} /> {backupLoading ? 'Exporting...' : 'Download Full System Backup'}
            </button>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} color="#3b82f6" /> System Data Restore
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Restore database state from a previously exported backup file.
            </p>
            
            <form onSubmit={handleRestoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="file" 
                accept=".json"
                onChange={(e) => setRestoreFile(e.target.files[0])}
                style={{ fontSize: '13px' }}
              />
              <button 
                type="submit" 
                disabled={!restoreFile || backupLoading}
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start' }}
              >
                <Upload size={16} /> {backupLoading ? 'Restoring...' : 'Restore Database'}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Add Branch Modal */}
      {showAddBranch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Register New Branch</h3>
            
            <form onSubmit={handleAddBranchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Branch Name*</label>
                <input 
                  type="text"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Contact Phone*</label>
                <input 
                  type="text"
                  value={branchForm.contact}
                  onChange={(e) => setBranchForm({ ...branchForm, contact: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Full Address*</label>
                <textarea 
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  rows="3"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddBranch(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: 'success', message: '' })}
      />

    </div>
  );
}
