import React, { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import api, { setAccessToken } from '../services/api.js';

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

// Mirrors the server-side rule in backend/src/controllers/authController.js so
// the owner sees the requirement before a round trip, not instead of one.
const passwordProblem = (password) => {
  if (password.length < 16) return 'Use at least 16 characters.';
  if (password.length > 128) return 'Use at most 128 characters.';
  if (!/[A-Z]/.test(password)) return 'Include an uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Include a lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Include a digit.';
  return '';
};

export default function ChangePasswordCard() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    const problem = passwordProblem(form.newPassword);
    if (problem) return setStatus({ type: 'error', message: `New password is too weak. ${problem}` });
    if (form.newPassword !== form.confirmPassword) {
      return setStatus({ type: 'error', message: 'The new password and its confirmation do not match.' });
    }
    if (form.newPassword === form.currentPassword) {
      return setStatus({ type: 'error', message: 'The new password must be different from the current one.' });
    }

    setSaving(true);
    try {
      const { data } = await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      // The server rotates the credential and invalidates every token issued
      // beforehand, including this tab's. It returns a replacement so the owner
      // stays signed in here while other sessions are ended.
      if (data?.token) setAccessToken(data.token);
      setForm(EMPTY_FORM);
      setStatus({
        type: 'success',
        message: 'Password changed. Any other signed-in session has been ended. Store the new password in your password manager now.',
      });
    } catch (err) {
      const message = err.response?.status === 401
        ? 'The current password is incorrect.'
        : err.response?.data?.error || 'The password could not be changed. Try again.';
      setStatus({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  const field = (label, name, autoComplete) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label htmlFor={name} style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>{label}</label>
      <input
        id={name}
        name={name}
        type="password"
        autoComplete={autoComplete}
        value={form[name]}
        onChange={update(name)}
        maxLength={128}
        required
        style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
      />
    </div>
  );

  return (
    <div className="card" style={{ maxWidth: '520px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <KeyRound size={18} color="#3b82f6" /> Change owner password
      </h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
        Requires the current password. At least 16 characters with an uppercase letter,
        a lowercase letter, and a digit.
      </p>

      {status.message && (
        <div
          role="status"
          style={{
            padding: '12px 14px',
            marginBottom: '16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            background: status.type === 'success' ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${status.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
            color: status.type === 'success' ? '#065f46' : '#b91c1c',
          }}
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {field('Current password', 'currentPassword', 'current-password')}
        {field('New password', 'newPassword', 'new-password')}
        {field('Confirm new password', 'confirmPassword', 'new-password')}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
        >
          <ShieldCheck size={16} /> {saving ? 'Changing…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
