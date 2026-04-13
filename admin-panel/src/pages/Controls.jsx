import React, { useState } from 'react';
import { Cpu, Play, AlertTriangle, CheckCircle2, Bot, Globe } from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';

export default function Controls() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);

  const runAction = async (endpoint, name) => {
    setLoading(true);
    setActiveAction(name);
    setStatus(null);
    try {
      await api.post(endpoint);
      setStatus({ type: 'success', text: `${name} triggered successfully. Check server logs for progress.` });
    } catch (err) {
      setStatus({ type: 'error', text: `Failed to trigger ${name}.` });
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const actions = [
    {
      title: 'Run AI Enrichment Cron',
      description: 'Triggers the Gemini AI cron job to process unenriched posts.',
      icon: Bot,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      endpoint: '/ai-crons/run'
    },
    {
      title: 'Run Section Scrapper Cron',
      description: 'Manually triggers the main section scraping cron job.',
      icon: Globe,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      endpoint: '/scrapper/run-section-cron'
    },
    {
      title: 'Fetch All Sections',
      description: 'Forces the scrapper to fetch jobs for all configured sections immediately.',
      icon: Globe,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      endpoint: '/scrapper/fetch-all-by-section'
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">AI & Scrapper Controls</h2>
        <p className="text-sm text-slate-500 mt-1">Manually trigger background jobs, AI enrichment, and web scrapers.</p>
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
        {actions.map((action) => (
          <div key={action.title} className="bg-white rounded-2xl border border-dashboard-border shadow-sm p-6 flex flex-col">
            <div className="flex items-start gap-4 mb-6">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", action.bg, action.color)}>
                <action.icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{action.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{action.description}</p>
              </div>
            </div>
            <div className="mt-auto">
              <button 
                onClick={() => runAction(action.endpoint, action.title)}
                disabled={loading}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 border border-dashboard-border py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play size={16} className={loading && activeAction === action.title ? "animate-pulse" : ""} />
                {loading && activeAction === action.title ? 'Running...' : 'Trigger Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
