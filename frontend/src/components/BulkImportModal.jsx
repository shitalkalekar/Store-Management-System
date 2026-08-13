import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle, X, FileText } from 'lucide-react';
import api from '../services/api';

export default function BulkImportModal({ type = 'products', isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const entityTitle = type === 'products' ? 'Products' : type === 'customers' ? 'Customers' : 'Suppliers';

  // Sample data generation & download
  const handleDownloadSample = () => {
    let headers = [];
    let sampleRows = [];

    if (type === 'products') {
      headers = ['Product Name', 'Category', 'HSN', 'Unit', 'Purchase Price', 'Retail Price', 'Initial Stock', 'Reorder Level', 'Supplier', 'Branch'];
      sampleRows = [
        ['Amoxicillin 500mg', 'Antibiotics', 'HSN3004', 'Strips', 45, 60, 100, 20, 'Apex Pharma', 'Main Branch'],
        ['Paracetamol 650mg', 'Analgesic', 'HSN3004', 'Strips', 15, 25, 200, 30, 'Apex Pharma', 'Main Branch']
      ];
    } else if (type === 'customers') {
      headers = ['Customer Name', 'Mobile', 'GST', 'Address', 'Credit Limit', 'Notes'];
      sampleRows = [
        ['Ramesh Chemist', '9876543210', '27ABCDE1234F1Z5', '123 Station Road, Mumbai', 50000, 'Regular wholesale buyer'],
        ['Apollo Clinic', '9876543211', '', '45 MG Road, Pune', 25000, 'Monthly billing customer']
      ];
    } else if (type === 'suppliers') {
      headers = ['Supplier Name', 'Mobile', 'GST', 'Address', 'Contact Person', 'Notes'];
      sampleRows = [
        ['Apex Pharma Pvt Ltd', '9988776655', '27AAACA1234A1Z1', 'Plot 12 Industrial Area, Thane', 'Rajesh Sharma', 'Primary medicine distributor'],
        ['Sun Health Supplies', '9988776644', '27AAACB5678B1Z2', '88 City Center, Nagpur', 'Anita Desai', 'Surgical goods vendor']
      ];
    }

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample');
    XLSX.writeFile(wb, `${type}_import_sample.xlsx`);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg('Please select an Excel file (.xlsx, .xls) to upload');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rows || rows.length === 0) {
          setErrorMsg('The selected Excel file is empty.');
          setLoading(false);
          return;
        }

        // Call backend bulk import endpoint
        const res = await api.post('/data/import-bulk', {
          entityType: type,
          data: rows
        });

        setImportSummary(res.data);
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error(err);
        setErrorMsg(err.response?.data?.error || 'Failed to process bulk import. Please check file format.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadErrorReport = () => {
    if (!importSummary || !importSummary.failedRecords || importSummary.failedRecords.length === 0) return;

    const reportRows = importSummary.failedRecords.map(item => ({
      'Row Number': item.row,
      'Failure Reason': item.reason,
      'Data Record': JSON.stringify(item.record)
    }));

    const ws = XLSX.utils.json_to_sheet(reportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Error_Report');
    XLSX.writeFile(wb, `${type}_import_error_report.xlsx`);
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', width: '90%', maxWidth: '580px',
        maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet color="#2563eb" size={24} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
              Bulk Import {entityTitle}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {!importSummary ? (
          <div>
            <div style={{
              backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px',
              padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#334155' }}>Need an import template?</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Download sample formatted Excel sheet with expected columns.</p>
              </div>
              <button
                type="button"
                onClick={handleDownloadSample}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6ff',
                  color: '#2563eb', border: '1px solid #bfdbfe', padding: '8px 14px', borderRadius: '6px',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer'
                }}
              >
                <Download size={15} /> Sample Excel
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Select Excel File (.xlsx, .xls)
              </label>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1',
                  fontSize: '13px', backgroundColor: '#fff'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '9px 18px', borderRadius: '6px', border: '1px solid #cbd5e1',
                  backgroundColor: '#fff', color: '#475569', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={loading || !file}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', borderRadius: '6px',
                  border: 'none', backgroundColor: '#2563eb', color: '#fff', fontSize: '13px', fontWeight: 500,
                  cursor: loading || !file ? 'not-allowed' : 'pointer', opacity: loading || !file ? 0.6 : 1
                }}
              >
                <Upload size={16} />
                {loading ? 'Processing...' : 'Upload & Import'}
              </button>
            </div>
          </div>
        ) : (
          /* Import Summary Screen */
          <div>
            <div style={{
              backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
              padding: '16px', marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <CheckCircle size={22} color="#16a34a" />
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#15803d' }}>
                  Import Completed Summary
                </h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Total Rows</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{importSummary.totalRows || 0}</div>
                </div>
                <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '12px', color: '#16a34a' }}>Successful</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#16a34a' }}>{importSummary.importedCount || 0}</div>
                </div>
                <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                  <div style={{ fontSize: '12px', color: '#dc2626' }}>Failed</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>{importSummary.failedCount || 0}</div>
                </div>
              </div>
            </div>

            {importSummary.failedRecords && importSummary.failedRecords.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>Failed Records Details</h5>
                  <button
                    onClick={handleDownloadErrorReport}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2',
                      border: '1px solid #fca5a5', color: '#b91c1c', padding: '4px 10px', borderRadius: '4px',
                      fontSize: '12px', cursor: 'pointer', fontWeight: 500
                    }}
                  >
                    <Download size={13} /> Download Error Report
                  </button>
                </div>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #fee2e2', borderRadius: '6px', backgroundColor: '#fff' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fef2f2', color: '#991b1b', textAlign: 'left' }}>
                        <th style={{ padding: '6px 10px', width: '50px' }}>Row</th>
                        <th style={{ padding: '6px 10px' }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importSummary.failedRecords.map((fail, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 600 }}>Row {fail.row}</td>
                          <td style={{ padding: '6px 10px', color: '#b91c1c' }}>{fail.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 20px', borderRadius: '6px', border: 'none',
                  backgroundColor: '#2563eb', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
