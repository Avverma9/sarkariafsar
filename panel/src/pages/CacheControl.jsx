import React, { useState } from 'react';
import { Database, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';

export default function CacheControl() {
  const [pattern, setPattern] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFlushAll = async () => {
    if (!window.confirm('Are you sure you want to flush the ENTIRE Redis cache? This may temporarily slow down the site.')) return;
    
    setLoading(true);
    setStatus(null);
    try {
      await api.post('/cache/flush');
      setStatus({ type: 'success', text: 'All cache flushed successfully.' });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to flush cache. Please check server logs.';
      setStatus({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleFlushPattern = async (e) => {
    e.preventDefault();
    if (!pattern) return;
    
    setLoading(true);
    setStatus(null);
    try {
      await api.post('/cache/flush-pattern', { pattern });
      setStatus({ type: 'success', text: `Cache matching pattern "${pattern}" flushed successfully.` });
      setPattern('');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to flush pattern.';
      setStatus({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cache Control</h2>
        <p className="text-sm text-slate-500 mt-1">Manage Redis cache to ensure users see the latest data.</p>
      </div>

      {status && (
        <div className={cn(
          "p-4 rounded-xl text-sm flex items-center gap-2 border",
          status.type === 'success' ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"
        )}>
          {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {status.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-dashboard-border shadow-sm p-6">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
            <Trash2 size={20} />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Flush All Cache</h3>
          <p className="text-sm text-slate-500 mb-6">
            Clears the entire Redis database. Use this only when major structural changes are made.
          </p>
          <button 
            onClick={handleFlushAll}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
          >
            Flush Everything
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-dashboard-border shadow-sm p-6">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Database size={20} />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Flush by Pattern</h3>
          <p className="text-sm text-slate-500 mb-6">
            Clear specific cache keys using a wildcard pattern (e.g., <code className="bg-slate-100 px-1 rounded">cache:/api/post*</code>).
          </p>
          <form onSubmit={handleFlushPattern} className="space-y-3">
            <input 
              type="text" 
              required
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. cache:/api/post*"
              className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-slate-900 outline-none focus:border-blue-500 transition-all font-mono text-sm"
            />
            <button 
              type="submit"
              disabled={loading || !pattern}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              Flush Pattern
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
