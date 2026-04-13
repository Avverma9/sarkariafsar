import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Chrome, Mail, Eye, EyeOff,
  CheckCircle2, AlertTriangle, Save, RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';

const DEFAULT = {
  googleEnabled: true,
  googleClientId: '',
  googleClientSecret: '',
  emailOtpEnabled: false,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  otpExpireMinutes: 10,
};

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
        checked ? 'bg-blue-600' : 'bg-slate-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, hint }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type={isPassword && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-dashboard-border rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-9"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function AuthSettings() {
  const [form, setForm]       = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [status, setStatus]   = useState(null);

  useEffect(() => {
    api.get('/admin/auth-settings')
      .then(r => setForm({ ...DEFAULT, ...r.data.data }))
      .catch(() => setStatus({ type: 'error', text: 'Failed to load auth settings.' }))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await api.put('/admin/auth-settings', form);
      setStatus({ type: 'success', text: 'Auth settings saved successfully.' });
    } catch (err) {
      setStatus({ type: 'error', text: err?.response?.data?.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Auth Settings</h2>
        <p className="text-sm text-slate-500 mt-1">
          Enable / disable login methods and manage credentials stored in the database.
        </p>
      </div>

      {status && (
        <div className={cn(
          'p-4 rounded-xl text-sm flex items-center gap-2 border',
          status.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        )}>
          {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {status.text}
        </div>
      )}

      {/* ── Google OAuth Card ── */}
      <div className="bg-white rounded-2xl border border-dashboard-border shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Chrome size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Google OAuth</h3>
              <p className="text-xs text-slate-500">Sign in with Google account</p>
            </div>
          </div>
          <Toggle checked={form.googleEnabled} onChange={set('googleEnabled')} />
        </div>

        {form.googleEnabled && (
          <div className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-100">
            <Field
              label="Client ID"
              value={form.googleClientId}
              onChange={set('googleClientId')}
              placeholder="446261549361-xxxx.apps.googleusercontent.com"
              hint="From Google Cloud Console → APIs & Services → Credentials"
            />
            <Field
              label="Client Secret"
              type="password"
              value={form.googleClientSecret}
              onChange={set('googleClientSecret')}
              placeholder="GOCSPX-xxxxxxxxxxxx"
            />
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 leading-relaxed">
              <strong>Authorized redirect URI</strong> to add in Google Cloud Console:<br />
              <code className="text-blue-700">https://api.sarkariafsar.com/api/auth/google/callback</code>
            </div>
          </div>
        )}
      </div>

      {/* ── Email OTP Card ── */}
      <div className="bg-white rounded-2xl border border-dashboard-border shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Mail size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Email OTP Login</h3>
              <p className="text-xs text-slate-500">Send a 6-digit OTP to user's email via Nodemailer</p>
            </div>
          </div>
          <Toggle checked={form.emailOtpEnabled} onChange={set('emailOtpEnabled')} />
        </div>

        {form.emailOtpEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Field
              label="SMTP Host"
              value={form.smtpHost}
              onChange={set('smtpHost')}
              placeholder="smtp.gmail.com"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">SMTP Port</label>
              <input
                type="number"
                value={form.smtpPort}
                onChange={e => set('smtpPort')(Number(e.target.value))}
                className="w-full border border-dashboard-border rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <Toggle checked={form.smtpSecure} onChange={set('smtpSecure')} />
              <span className="text-sm text-slate-600">SSL / Secure (port 465)</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">OTP Expiry (minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={form.otpExpireMinutes}
                onChange={e => set('otpExpireMinutes')(Number(e.target.value))}
                className="w-full border border-dashboard-border rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Field
              label="SMTP User (email)"
              value={form.smtpUser}
              onChange={set('smtpUser')}
              placeholder="alerts@sarkariafsar.com"
            />
            <Field
              label="SMTP Password / App Password"
              type="password"
              value={form.smtpPass}
              onChange={set('smtpPass')}
              placeholder="Gmail App Password"
              hint="For Gmail use an App Password, not your account password"
            />
            <Field
              label="From Address (optional)"
              value={form.smtpFrom}
              onChange={set('smtpFrom')}
              placeholder='"Sarkari Afsar" <alerts@sarkariafsar.com>'
              hint="Defaults to SMTP User if left blank"
            />
          </div>
        )}
      </div>

      {/* ── Save ── */}
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
        >
          {saving
            ? <RefreshCw size={16} className="animate-spin" />
            : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
