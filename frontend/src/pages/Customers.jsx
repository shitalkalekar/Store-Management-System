import React, { useState, useEffect } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';
import Toast from '../components/Toast.jsx';
import BulkImportModal from '../components/BulkImportModal.jsx';
import { downloadAuthenticatedFile } from '../utils/authenticatedDownload.js';
import {
  validateName,
  sanitizeNameInput,
  sanitizeNumericInput,
  sanitizePriceInput,
  sanitizeTextareaInput,
  validateMobile,
  validateGST,
  validateRequired,
  validatePositiveNumber,
  trimObjectValues
} from '../utils/formValidation.js';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ type: 'success', message: '' });

  // Bulk operation and filter states
  const [selectedIds, setSelectedIds] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [creditLimitRange, setCreditLimitRange] = useState(''); // 'all' | 'has_limit' | 'no_limit'
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Form State & Validation
  const [formMode, setFormMode] = useState(null); // 'add' | 'edit' | null
  const [formData, setFormData] = useState({ name: '', mobile: '', address: '', state: 'Maharashtra', gstNumber: '', notes: '', defaultRecurringDays: '', creditLimit: '' });
  const [formErrors, setFormErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  // Profile Modal State
  const [profileCustomer, setProfileCustomer] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await api.get(`/customers?search=${search}`);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      console.error('Failed to fetch branches', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchBranches();
  }, [search]);

  const handleOpenAdd = () => {
    setFormData({ name: '', mobile: '', address: '', state: 'Maharashtra', gstNumber: '', notes: '', defaultRecurringDays: '', creditLimit: '' });
    setFormErrors({});
    setFormMode('add');
  };

  const handleOpenEdit = (customer) => {
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      address: customer.address,
      state: customer.state || 'Maharashtra',
      gstNumber: customer.gstNumber || '',
      notes: customer.notes || '',
      defaultRecurringDays: customer.defaultRecurringDays || '',
      creditLimit: customer.creditLimit || ''
    });
    setFormErrors({});
    setSelectedId(customer._id);
    setFormMode('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    const errs = {};

    const nameErr = validateName(formData.name, 'Customer Name');
    if (nameErr) errs.name = nameErr;

    const mobErr = validateMobile(formData.mobile);
    if (mobErr) errs.mobile = mobErr;

    const addrErr = validateRequired(formData.address, 'Address');
    if (addrErr) errs.address = addrErr;

    if (formData.gstNumber) {
      const gstErr = validateGST(formData.gstNumber, false);
      if (gstErr) errs.gstNumber = gstErr;
    }

    if (formData.creditLimit) {
      const credErr = validatePositiveNumber(formData.creditLimit, 'Credit Limit', true);
      if (credErr) errs.creditLimit = credErr;
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    try {
      setError('');
      const cleanData = trimObjectValues(formData);
      if (formMode === 'add') {
        await api.post('/customers', cleanData);
        setToast({ type: 'success', message: 'Customer added successfully! ✅' });
      } else {
        await api.put(`/customers/${selectedId}`, cleanData);
        setToast({ type: 'success', message: 'Customer updated successfully! ✅' });
      }
      setFormMode(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to save customer';
      setError(msg);
      setToast({ type: 'error', message: msg });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      setError('');
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      setError('Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (selectedBranch && c.branch !== selectedBranch) return false;
    if (selectedState && c.state !== selectedState) return false;
    if (creditLimitRange === 'has_limit' && !(c.creditLimit > 0)) return false;
    if (creditLimitRange === 'no_limit' && c.creditLimit > 0) return false;
    return true;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredCustomers.map(c => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected customers?`)) return;
    try {
      setError('');
      await api.post('/bulk/delete', { model: 'customer', ids: selectedIds });
      setSelectedIds([]);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      setError('Failed to perform bulk delete');
    }
  };

  const handleBulkExport = () => {
    const dataToExport = customers.filter(c => selectedIds.includes(c._id));
    const cleanData = dataToExport.map(c => ({
      Name: c.name,
      Mobile: c.mobile,
      Address: c.address,
      GSTIN: c.gstNumber || 'N/A',
      CreditLimit: c.creditLimit || 0,
      State: c.state || 'N/A',
      Notes: c.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "selected_customers.xlsx");
  };

  const handleOpenProfile = async (customer) => {
    setProfileCustomer(customer);
    setProfileLoading(true);
    try {
      const res = await api.get(`/customers/${customer._id}`);
      setProfileData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch customer profile ledger');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <input 
          type="text"
          placeholder="🔍 Search customers by name or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '320px', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowBulkImport(true)}
            style={{ padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📥 Bulk Import Excel
          </button>
          <button 
            onClick={handleOpenAdd}
            style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
          >
            ➕ Add Customer
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>State Filter</label>
          <select 
            value={selectedState} 
            onChange={(e) => setSelectedState(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
          >
            <option value="">All States</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Goa">Goa</option>
            <option value="Gujarat">Gujarat</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Credit Limit</label>
          <select 
            value={creditLimitRange} 
            onChange={(e) => setCreditLimitRange(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
          >
            <option value="">All Limits</option>
            <option value="has_limit">Has Credit Limit</option>
            <option value="no_limit">No Credit Limit</option>
          </select>
        </div>

        {branches.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Branch</label>
            <select 
              value={selectedBranch} 
              onChange={(e) => setSelectedBranch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div style={{ display: 'flex', gap: '15px', background: '#eff6ff', padding: '15px', borderRadius: '12px', border: '1px solid #bfdbfe', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
            Selected <strong>{selectedIds.length}</strong> customers
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleBulkExport}
              style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
            >
              📥 Export to Excel
            </button>
            <button 
              onClick={handleBulkDelete}
              style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
            >
              🗑️ Bulk Delete
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              style={{ padding: '8px 16px', background: '#cbd5e1', color: '#1e293b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Customer List Table */}
      {loading ? (
        <div>Loading customer records...</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 20px', width: '40px' }}>
                  <input 
                    type="checkbox"
                    checked={filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Sr. No.</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Customer Name</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Mobile</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>GSTIN</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Credit Limit</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Looping Period</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Address</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c, idx) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px', width: '40px' }}>
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(c._id)}
                        onChange={() => handleSelectRow(c._id)}
                      />
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569', fontWeight: 'bold' }}>{idx + 1}</td>
                    <td style={{ padding: '14px 20px', fontWeight: '600', color: '#1e293b' }}>
                      <span onClick={() => handleOpenProfile(c)} style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>{c.name}</span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>{c.mobile}</td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>{c.gstNumber || 'N/A'}</td>
                    <td style={{ padding: '14px 20px', color: '#166534', fontWeight: 'bold' }}>{c.creditLimit > 0 ? `Rs. ${c.creditLimit}` : 'None'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      {c.defaultRecurringDays > 0 ? (
                        <span style={{ background: '#fffbeb', color: '#b45309', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #fde68a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          🔄 Every {c.defaultRecurringDays} Days
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Not Set</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleOpenProfile(c)}
                        style={{ padding: '6px 12px', background: '#ecfdf5', color: '#047857', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                      >
                        📂 Ledger
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(c)}
                        style={{ padding: '6px 12px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(c._id)}
                        style={{ padding: '6px 12px', background: '#fef2f2', color: '#b91c1c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {formMode && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '15px' }}>{formMode === 'add' ? 'Add New Customer' : 'Edit Customer'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>Customer Name*</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => {
                    setFormData({ ...formData, name: sanitizeNameInput(e.target.value) });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${formErrors.name ? '#ef4444' : '#cbd5e1'}`, outline: 'none' }}
                />
                {formErrors.name && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px', display: 'block' }}>{formErrors.name}</span>}
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>Mobile Number*</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={formData.mobile} 
                  onChange={(e) => {
                    setFormData({ ...formData, mobile: sanitizeNumericInput(e.target.value, 10) });
                    if (formErrors.mobile) setFormErrors({ ...formErrors, mobile: '' });
                  }}
                  placeholder="10-digit mobile number"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${formErrors.mobile ? '#ef4444' : '#cbd5e1'}`, outline: 'none' }}
                />
                {formErrors.mobile && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px', display: 'block' }}>{formErrors.mobile}</span>}
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>GST Number (Optional)</label>
                <input 
                  type="text" 
                  maxLength={15}
                  value={formData.gstNumber} 
                  onChange={(e) => {
                    setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() });
                    if (formErrors.gstNumber) setFormErrors({ ...formErrors, gstNumber: '' });
                  }}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${formErrors.gstNumber ? '#ef4444' : '#cbd5e1'}`, outline: 'none' }}
                />
                {formErrors.gstNumber && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px', display: 'block' }}>{formErrors.gstNumber}</span>}
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>Address*</label>
                <textarea 
                  value={formData.address} 
                  onChange={(e) => {
                    setFormData({ ...formData, address: sanitizeTextareaInput(e.target.value) });
                    if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                  }}
                  rows="3"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${formErrors.address ? '#ef4444' : '#cbd5e1'}`, outline: 'none' }}
                />
                {formErrors.address && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px', display: 'block' }}>{formErrors.address}</span>}
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>State</label>
                <input
                  type="text"
                  maxLength={100}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: sanitizeTextareaInput(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>Notes</label>
                <input 
                  type="text" 
                  value={formData.notes} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>Default Order Loop (Days) - Optional</label>
                <input 
                  type="number"
                  min="0"
                  placeholder="e.g. 30"
                  value={formData.defaultRecurringDays} 
                  onChange={(e) => setFormData({ ...formData, defaultRecurringDays: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>



              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setFormMode(null)}
                  style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile / Ledger Modal */}
      {profileCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{profileCustomer.name}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>📍 {profileCustomer.address} | 📞 {profileCustomer.mobile}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={async () => {
                    try {
                      await downloadAuthenticatedFile(
                        `/reports/ledger?customerId=${profileCustomer._id}&pdf=true`,
                        `Customer_Statement_${profileCustomer.name}.pdf`,
                      );
                    } catch (err) {
                      console.error('Customer statement download failed:', err);
                      setError('Failed to download the customer statement');
                    }
                  }}
                  style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
                >
                  📋 Download Statement PDF
                </button>
                <button 
                  onClick={() => setProfileCustomer(null)}
                  style={{ background: '#cbd5e1', border: 'none', fontSize: '16px', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', color: '#1e293b', fontWeight: 'bold' }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {profileLoading ? (
              <div>Loading ledger statements...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Financial Summary */}
                <div style={{ display: 'flex', gap: '15px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Outstanding Balance</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#b91c1c', marginTop: '4px' }}>
                      Rs. {profileData?.outstanding?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid #cbd5e1', paddingLeft: '15px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Invoiced</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#334155', marginTop: '4px' }}>
                      Rs. {profileData?.billHistory?.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>

                {/* Financial Transactions */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>Financial Transactions</h4>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '10px 15px', color: '#475569' }}>Date</th>
                          <th style={{ padding: '10px 15px', color: '#475569' }}>Activity Type</th>
                          <th style={{ padding: '10px 15px', color: '#475569' }}>Ref ID</th>
                          <th style={{ padding: '10px 15px', color: '#475569' }}>Status</th>
                          <th style={{ padding: '10px 15px', color: '#475569', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profileData?.timeline && profileData.timeline.filter(t => ['Invoice', 'Payment', 'Refund'].includes(t.type)).length > 0 ? (
                          profileData.timeline.filter(t => ['Invoice', 'Payment', 'Refund'].includes(t.type)).map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 15px', color: '#475569' }}>{new Date(item.date).toLocaleDateString()}</td>
                              <td style={{ padding: '10px 15px', fontWeight: 'bold', color: '#334155' }}>{item.type}</td>
                              <td style={{ padding: '10px 15px', color: '#475569' }}>{item.ref}</td>
                              <td style={{ padding: '10px 15px' }}>
                                <span style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px', 
                                  borderRadius: '4px', 
                                  background: item.status === 'Paid' || item.status === 'Cleared' ? '#d1fae5' : '#fee2e2',
                                  color: item.status === 'Paid' || item.status === 'Cleared' ? '#065f46' : '#b91c1c',
                                  fontWeight: '600'
                                }}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ padding: '10px 15px', textAlign: 'right', fontWeight: 'bold', color: item.type.includes('Payment') ? '#166534' : '#1e293b' }}>
                                {item.type.includes('Payment') ? '-' : ''}Rs. {item.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" style={{ padding: '20px', textLight: 'center', color: '#94a3b8' }}>No financial transactions found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order History */}
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>Order History</h4>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '10px 15px', color: '#475569' }}>Date</th>
                          <th style={{ padding: '10px 15px', color: '#475569' }}>Activity Type</th>
                          <th style={{ padding: '10px 15px', color: '#475569' }}>Ref ID</th>
                          <th style={{ padding: '10px 15px', color: '#475569' }}>Status</th>
                          <th style={{ padding: '10px 15px', color: '#475569', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profileData?.timeline && profileData.timeline.filter(t => ['Order', 'Quotation'].includes(t.type)).length > 0 ? (
                          profileData.timeline.filter(t => ['Order', 'Quotation'].includes(t.type)).map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 15px', color: '#475569' }}>{new Date(item.date).toLocaleDateString()}</td>
                              <td style={{ padding: '10px 15px', fontWeight: 'bold', color: '#334155' }}>{item.type}</td>
                              <td style={{ padding: '10px 15px', color: '#475569' }}>{item.ref}</td>
                              <td style={{ padding: '10px 15px' }}>
                                <span style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px', 
                                  borderRadius: '4px', 
                                  background: item.status === 'Delivered' || item.status === 'Completed' ? '#d1fae5' : '#e0e7ff',
                                  color: item.status === 'Delivered' || item.status === 'Completed' ? '#065f46' : '#3730a3',
                                  fontWeight: '600'
                                }}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ padding: '10px 15px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b' }}>
                                Rs. {item.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" style={{ padding: '20px', textLight: 'center', color: '#94a3b8' }}>No order history found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        type="customers"
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={() => {
          fetchCustomers();
          setToast({ type: 'success', message: 'Customers imported successfully! ✅' });
        }}
      />

      {/* Toast Notification */}
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: 'success', message: '' })}
      />

    </div>
  );
}
