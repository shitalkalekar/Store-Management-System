import React, { useState, useEffect } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';
import DateFilter from '../components/DateFilter.jsx';
import Toast from '../components/Toast.jsx';
import { validatePositiveNumber, validateRequired } from '../utils/formValidation.js';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState({ type: 'success', message: '' });

  // Bulk and Filter States
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [dateRange, setDateRange] = useState({ filterType: 'all', startDate: '', endDate: '' });

  // Receipt Modal State
  const [selectedReceiptExpense, setSelectedReceiptExpense] = useState(null);

  // Form State & Validation
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ category: 'fuel', amount: '', date: '', notes: '', receiptImage: '', branchId: '' });
  const [formErrors, setFormErrors] = useState({});

  const fetchData = async () => {
    try {
      const [expRes, branchRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/branches')
      ]);
      setExpenses(expRes.data);
      setBranches(branchRes.data);
      if (branchRes.data.length > 0) {
        setFormData(prev => ({ ...prev, branchId: branchRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch expenses directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, receiptImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    const errs = {};

    const catErr = validateRequired(formData.category, 'Category');
    if (catErr) errs.category = catErr;

    const amtErr = validatePositiveNumber(formData.amount, 'Expense Amount', false);
    if (amtErr) errs.amount = amtErr;

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setSuccess('');
    setError('');
    try {
      await api.post('/expenses', formData);
      setToast({ type: 'success', message: 'Expense logged successfully! ✅' });
      setShowAdd(false);
      setFormData({ category: 'fuel', amount: '', date: '', notes: '', receiptImage: '', branchId: branches[0]?._id || '' });
      fetchData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to record expense';
      setError(msg);
      setToast({ type: 'error', message: msg });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense entry?')) return;
    setSuccess('');
    setError('');
    try {
      await api.delete(`/expenses/${id}`);
      setSuccess('Expense entry removed successfully. ✅');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete expense entry');
    }
  };

  const handleOpenReceiptInNewTab = (receiptDataUri) => {
    if (!receiptDataUri) return;
    try {
      if (receiptDataUri.startsWith('data:')) {
        const arr = receiptDataUri.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        window.open(receiptDataUri, '_blank');
      }
    } catch (err) {
      console.error('Blob URL creation error:', err);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`<html><head><title>Receipt Image</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#0f172a;min-height:100vh;"><img src="${receiptDataUri}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body></html>`);
      }
    }
  };

  const handleDownloadReceipt = (expense) => {
    if (!expense?.receiptImage) return;
    const link = document.createElement('a');
    link.href = expense.receiptImage;
    link.download = `Expense_Receipt_${expense.category}_${expense._id.substring(18)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredExpenses = expenses.filter(e => {
    if (selectedCategory && e.category !== selectedCategory) return false;
    if (selectedBranch) {
      const bId = e.branch?._id || e.branch;
      if (bId !== selectedBranch) return false;
    }
    if (minAmount && e.amount < Number(minAmount)) return false;
    if (maxAmount && e.amount > Number(maxAmount)) return false;
    return true;
  });

  const handleSelectAll = (evt) => {
    if (evt.target.checked) {
      setSelectedIds(filteredExpenses.map(e => e._id));
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
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected expense entries?`)) return;
    try {
      setError('');
      setSuccess('');
      await api.post('/bulk/delete', { model: 'expense', ids: selectedIds });
      setSuccess(`Deleted ${selectedIds.length} expense entries. ✅`);
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to perform bulk delete');
    }
  };

  const handleBulkExport = () => {
    const dataToExport = expenses.filter(e => selectedIds.includes(e._id));
    const cleanData = dataToExport.map(e => ({
      Category: e.category,
      Amount: e.amount,
      Date: new Date(e.date).toLocaleDateString(),
      Notes: e.notes || '',
      Branch: e.branch?.name || e.branch
    }));
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "selected_expenses.xlsx");
  };

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>Loading expense loggers...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {success && (
        <div style={{ padding: '12px', background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: '8px', fontSize: '13px' }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#334155' }}>Expenses Directory</h2>
        <button 
          onClick={() => setShowAdd(true)}
          style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
        >
          ➕ Add Expense
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Category</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
          >
            <option value="">All Categories</option>
            <option value="rent">Rent</option>
            <option value="salary">Salary</option>
            <option value="fuel">Fuel</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Date Range</label>
          <DateFilter
            value={dateRange.filterType}
            onChange={setDateRange}
          />
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Min Amount</label>
          <input 
            type="number"
            placeholder="Min Rs."
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', width: '100px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Max Amount</label>
          <input 
            type="number"
            placeholder="Max Rs."
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', width: '100px' }}
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div style={{ display: 'flex', gap: '15px', background: '#eff6ff', padding: '15px', borderRadius: '12px', border: '1px solid #bfdbfe', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
            Selected <strong>{selectedIds.length}</strong> expenses
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

      {/* Expenses Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 20px', width: '40px' }}>
                <input 
                  type="checkbox"
                  checked={filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Sr. No.</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Date</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Category</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Branch</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Amount</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Notes</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>Receipt Attached</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', color: '#475569', fontWeight: 'bold', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((e, idx) => (
                <tr key={e._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', width: '40px' }}>
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(e._id)}
                      onChange={() => handleSelectRow(e._id)}
                    />
                  </td>
                  <td style={{ padding: '14px 20px', color: '#475569', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>{new Date(e.date).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 'bold', textTransform: 'capitalize', color: '#1e293b' }}>{e.category}</td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>{e.branch?.name || 'N/A'}</td>
                  <td style={{ padding: '14px 20px', color: '#b91c1c', fontWeight: 'bold' }}>Rs. {e.amount.toFixed(2)}</td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>{e.notes || '-'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    {e.receiptImage ? (
                      <button 
                        onClick={() => setSelectedReceiptExpense(e)}
                        style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        👁️ View Receipt
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>None</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDelete(e._id)}
                      style={{ padding: '6px 12px', background: '#fef2f2', color: '#b91c1c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No expenses found matching the filter criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive Receipt Viewer Modal */}
      {selectedReceiptExpense && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15,23,42,0.8)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 1000, padding: '15px' 
        }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: '16px', 
            padding: '24px', 
            maxWidth: '550px', 
            width: '100%', 
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', textTransform: 'capitalize' }}>
                  🧾 {selectedReceiptExpense.category} Expense Receipt
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Amount: <strong>Rs. {selectedReceiptExpense.amount.toFixed(2)}</strong> | Date: {new Date(selectedReceiptExpense.date).toLocaleDateString()}
                </span>
              </div>
              <button 
                onClick={() => setSelectedReceiptExpense(null)} 
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}
              >
                ✕ Close
              </button>
            </div>

            {/* Receipt Image Display Container */}
            <div style={{ 
              background: '#0f172a', 
              borderRadius: '12px', 
              padding: '15px', 
              display: 'flex', 
              alignItems: 'center', 
              justify: 'center', 
              minHeight: '280px',
              maxHeight: '450px',
              overflow: 'hidden'
            }}>
              {selectedReceiptExpense.receiptImage.startsWith('data:application/pdf') ? (
                <iframe 
                  src={selectedReceiptExpense.receiptImage} 
                  title="PDF Receipt" 
                  style={{ width: '100%', height: '400px', border: 'none', borderRadius: '8px' }} 
                />
              ) : (
                <img 
                  src={selectedReceiptExpense.receiptImage} 
                  alt="Expense Receipt" 
                  style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }} 
                />
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleDownloadReceipt(selectedReceiptExpense)}
                style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                📥 Download Receipt
              </button>
              <button 
                onClick={() => handleOpenReceiptInNewTab(selectedReceiptExpense.receiptImage)}
                style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🌐 Open in New Window
              </button>
              <button 
                onClick={() => setSelectedReceiptExpense(null)}
                style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '15px' }}>Add Expense</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>Category*</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                >
                  <option value="rent">Rent</option>
                  <option value="salary">Salary</option>
                  <option value="fuel">Fuel</option>
                  <option value="misc">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>Amount (Rs.)*</label>
                <input 
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                  min="0.01"
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>Date of Expense</label>
                <input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>Branch*</label>
                <select 
                  value={formData.branchId} 
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                  required
                >
                  {branches.map(br => (
                    <option key={br._id} value={br._id}>{br.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>Notes</label>
                <input 
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px' }}>Upload Receipt (File)</label>
                <input 
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleImageUpload}
                  style={{ width: '100%', fontSize: '12px' }}
                />
                {formData.receiptImage && (
                  <img src={formData.receiptImage} alt="Receipt Preview" style={{ maxHeight: '60px', marginTop: '10px', objectFit: 'contain' }} />
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)}
                  style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Save Entry
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
