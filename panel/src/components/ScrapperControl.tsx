import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Terminal
} from 'lucide-react';
import api from '@/src/lib/api';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

export function ScrapperControl() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [lastRun, setLastRun] = useState<any>(null);

  const runCron = async () => {
    setLoading(true);
    const startTime = new Date();
    try {
      const res = await api.post('/scrapper/run-section-cron');
      if (res.data.success) {
        toast.success('Scrapper cron executed successfully');
        setLastRun(res.data.data);
        setLogs(prev => [
          { 
            time: startTime.toLocaleTimeString(), 
            status: 'success', 
            message: 'Cron execution completed',
            details: res.data.data 
          },
          ...prev
        ]);
      }
    } catch (error) {
      toast.error('Scrapper cron failed');
      setLogs(prev => [
        { 
          time: startTime.toLocaleTimeString(), 
          status: 'error', 
          message: 'Cron execution failed',
          details: error 
        },
        ...prev
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100">Scrapper Controls</h2>
          <p className="text-zinc-400 mt-1">Trigger and monitor automated scraping cycles</p>
        </div>
        <button
          onClick={runCron}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all active:scale-95",
            loading 
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
              : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
          )}
        >
          {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {loading ? 'Running Cycle...' : 'Run Scrape Cycle'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Terminal className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-lg text-white">Execution Logs</h3>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
                  <p className="text-zinc-600 text-sm">No recent executions found.</p>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-wider",
                          log.status === 'success' ? "text-green-500" : "text-red-500"
                        )}>
                          {log.message}
                        </span>
                      </div>
                      <span className="text-zinc-600 text-xs font-mono">{log.time}</span>
                    </div>
                    {log.details && (
                      <pre className="text-[10px] text-zinc-500 bg-zinc-900/50 p-2 rounded overflow-x-auto font-mono">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-bold text-lg text-white mb-4">Last Run Summary</h3>
            {lastRun ? (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Total Processed</p>
                  <p className="text-2xl font-bold text-white">{lastRun.totalProcessed || 0}</p>
                </div>
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <p className="text-zinc-500 text-xs uppercase font-bold mb-1">New Posts Found</p>
                  <p className="text-2xl font-bold text-green-500">{lastRun.newPosts || 0}</p>
                </div>
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Errors Encountered</p>
                  <p className="text-2xl font-bold text-red-500">{lastRun.errors || 0}</p>
                </div>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No data available from last run.</p>
            )}
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
            <h3 className="font-bold text-orange-500 mb-2">Important Note</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Running a scrape cycle will iterate through all active sections and fetch the latest recruitment data. This process might take several minutes depending on the number of sources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
