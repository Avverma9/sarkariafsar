import React, { useState } from 'react';
import { Bell, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';

export default function Notifications() {
  const [postId, setPostId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSendAlert = async (e) => {
    e.preventDefault();
    if (!postId || !message) return;
    
    setLoading(true);
    setStatus(null);
    try {
      const response = await api.post(`/notify/manual/${postId}`, { message });
      setStatus({ 
        type: 'success', 
        text: `Alert sent successfully to ${response.data.sent || 0} active subscribers.` 
      });
      setPostId('');
      setMessage('');
    } catch (err) {
      setStatus({ 
        type: 'error', 
        text: 'Failed to send alert. Please check the Post ID and try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Notifications Manager</h2>
        <p className="text-sm text-slate-500 mt-1">Manually push email alerts to active subscribers of a specific job post.</p>
      </div>

      <div className="bg-white rounded-2xl border border-dashboard-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-dashboard-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Send Manual Alert</h3>
              <p className="text-xs text-slate-500">Trigger an immediate email to all users subscribed to a post.</p>
            </div>
          </div>

          {status && (
            <div className={cn(
              "p-4 mb-6 rounded-xl text-sm flex items-center gap-2 border",
              status.type === 'success' ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"
            )}>
              {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {status.text}
            </div>
          )}

          <form onSubmit={handleSendAlert} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Job Post ID</label>
              <input 
                type="text" 
                required
                value={postId}
                onChange={(e) => setPostId(e.target.value)}
                placeholder="e.g. 663def456abc123"
                className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2.5 px-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Alert Message</label>
              <textarea 
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Result has been declared — check the official website now!"
                rows={4}
                className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2.5 px-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={loading || !postId || !message}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {loading ? 'Sending...' : 'Send Alert Now'}
            </button>
          </form>
        </div>
        
        <div className="p-6 bg-slate-50">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">How it works</h4>
          <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
            <li>Subscribers will receive an email immediately.</li>
            <li>The email subject will be automatically formatted as: <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">🔔 [Post Title] — [Your Message]</code></li>
            <li>Only users with an active subscription (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">isActive: true</code>) will be notified.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
